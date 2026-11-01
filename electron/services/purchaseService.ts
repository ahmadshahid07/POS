import { DBManager } from '../db/connection';
import { BusinessService } from './businessService';
import { PurchaseOrder, PurchaseDetail, Supplier } from '../../src/types';

export interface CreatePurchaseParams {
  supplierId: number;
  invoiceReference?: string;
  purchaseDate: string;
  items: {
    productId: number;
    quantity: number;
    unitCost: number;
    discount?: number;
    taxRate?: number;
  }[];
  paidAmount: number;
  paymentMethod: string;
  notes?: string;
  userId?: number;
}

export class PurchaseService {
  static createAndReceivePurchase(params: CreatePurchaseParams): PurchaseDetail {
    const db = DBManager.getDb();

    if (!params.items || params.items.length === 0) {
      throw new Error('Purchase must contain at least one item.');
    }

    return db.transaction(() => {
      const supplier = db.prepare('SELECT id, name FROM suppliers WHERE id = ?').get(params.supplierId);
      if (!supplier) {
        throw new Error(`Supplier ${params.supplierId} not found.`);
      }

      let subtotal = 0;
      for (const item of params.items) {
        if (item.quantity <= 0 || item.unitCost < 0) {
          throw new Error('Quantity must be greater than 0 and unit cost cannot be negative.');
        }
        subtotal += item.quantity * item.unitCost - (item.discount || 0);
      }

      const totalAmount = Math.max(0, subtotal);
      const paid = Number(params.paidAmount || 0);
      const balance = Math.max(0, totalAmount - paid);
      const poNumber = BusinessService.getNextSequence('PO');
      const now = new Date().toISOString();

      // 1. Insert purchase order
      const poStmt = db.prepare(`
        INSERT INTO purchase_orders (
          po_number, supplier_id, invoice_reference, purchase_date, status,
          subtotal, discount, tax_amount, total_amount, paid_amount, balance_amount,
          payment_method, notes, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'received', ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const poRes = poStmt.run(
        poNumber,
        params.supplierId,
        params.invoiceReference || null,
        params.purchaseDate || now,
        subtotal,
        totalAmount,
        paid,
        balance,
        params.paymentMethod,
        params.notes || null,
        params.userId || null,
        now,
        now
      );

      const purchaseId = Number(poRes.lastInsertRowid);

      // 2. Insert items, update inventory, and recalculate Weighted Average Cost (WAC)
      const itemStmt = db.prepare(`
        INSERT INTO purchase_items (
          purchase_id, product_id, quantity, received_quantity, unit_cost, discount, tax_rate, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateProdStmt = db.prepare(`
        UPDATE products 
        SET current_stock = ?, cost_price = ?, updated_at = ?
        WHERE id = ?
      `);

      const insertMovementStmt = db.prepare(`
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, previous_stock, new_stock,
          reference_id, reference_type, reason, created_by, created_at
        ) VALUES (?, 'purchase_receipt', ?, ?, ?, ?, 'purchases', 'Supplier Stock Receiving', ?, ?)
      `);

      const insertedItems: any[] = [];

      for (const item of params.items) {
        const prod = db.prepare('SELECT id, name, current_stock, cost_price FROM products WHERE id = ?').get(item.productId);
        if (!prod) {
          throw new Error(`Product ${item.productId} not found.`);
        }

        const prevStock = prod.current_stock;
        const newStock = prevStock + item.quantity;
        const lineTotal = item.quantity * item.unitCost - (item.discount || 0);

        // Weighted Average Cost Formula:
        // New WAC = ((Old Stock * Old Cost) + (Received Qty * Purchase Cost)) / (Old Stock + Received Qty)
        let newUnitCost = item.unitCost;
        if (prevStock > 0 && prod.cost_price > 0) {
          const totalValuation = (prevStock * prod.cost_price) + (item.quantity * item.unitCost);
          newUnitCost = Math.round((totalValuation / newStock) * 100) / 100;
        }

        const itmRes = itemStmt.run(
          purchaseId,
          item.productId,
          item.quantity,
          item.quantity,
          item.unitCost,
          item.discount || 0,
          item.taxRate || 0,
          lineTotal
        );

        updateProdStmt.run(newStock, newUnitCost, now, item.productId);
        insertMovementStmt.run(item.productId, item.quantity, prevStock, newStock, poNumber, params.userId || null, now);

        insertedItems.push({
          id: Number(itmRes.lastInsertRowid),
          purchase_id: purchaseId,
          product_id: item.productId,
          product_name: prod.name,
          quantity: item.quantity,
          received_quantity: item.quantity,
          unit_cost: item.unitCost,
          discount: item.discount || 0,
          tax_rate: item.taxRate || 0,
          line_total: lineTotal
        });
      }

      // 3. Record purchase payment if paid > 0
      if (paid > 0) {
        db.prepare(`
          INSERT INTO purchase_payments (
            purchase_id, supplier_id, amount, payment_method, reference_no, payment_date, notes, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'Initial Purchase Payment', ?, ?)
        `).run(purchaseId, params.supplierId, paid, params.paymentMethod, poNumber, now, params.userId || null, now);

        db.prepare(`
          INSERT INTO payments (
            transaction_type, purchase_id, supplier_id, amount, payment_method, reference_number, payment_date, status, notes, cashier_id, created_at
          ) VALUES ('purchase_payment', ?, ?, ?, ?, ?, ?, 'completed', 'Supplier Stock Purchase Payment', ?, ?)
        `).run(purchaseId, params.supplierId, paid, params.paymentMethod, poNumber, now, params.userId || null, now);
      }

      // 4. Update supplier payable balance & totals
      db.prepare(`
        UPDATE suppliers 
        SET 
          total_purchases = total_purchases + ?,
          total_paid = total_paid + ?,
          balance_payable = balance_payable + ?,
          updated_at = ?
        WHERE id = ?
      `).run(totalAmount, paid, balance, now, params.supplierId);

      return {
        id: purchaseId,
        po_number: poNumber,
        supplier_id: params.supplierId,
        supplier_name: supplier.name,
        invoice_reference: params.invoiceReference || null,
        purchase_date: params.purchaseDate || now,
        status: 'received' as const,
        subtotal,
        discount: 0,
        tax_amount: 0,
        total_amount: totalAmount,
        paid_amount: paid,
        balance_amount: balance,
        payment_method: params.paymentMethod,
        notes: params.notes || null,
        created_by: params.userId || null,
        items_count: params.items.length,
        created_at: now,
        updated_at: now,
        items: insertedItems
      };
    })();
  }

  static getPurchases(options?: { supplierId?: number; limit?: number; offset?: number }): { purchases: PurchaseOrder[]; total: number } {
    const db = DBManager.getDb();
    let whereClauses = ['1=1'];
    const params: any[] = [];

    if (options?.supplierId) {
      whereClauses.push('po.supplier_id = ?');
      params.push(options.supplierId);
    }

    const where = whereClauses.join(' AND ');
    const count = db.prepare(`SELECT COUNT(*) as total FROM purchase_orders po WHERE ${where}`).get(...params);
    const total = count ? count.total : 0;

    let query = `
      SELECT 
        po.*,
        s.name as supplier_name,
        u.username as creator_name,
        (SELECT COUNT(*) FROM purchase_items WHERE purchase_id = po.id) as items_count
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE ${where}
      ORDER BY po.id DESC
    `;

    if (options?.limit) {
      query += ` LIMIT ${options.limit} OFFSET ${options.offset || 0}`;
    }

    const rows = db.prepare(query).all(...params);
    return {
      purchases: rows as PurchaseOrder[],
      total
    };
  }

  // Suppliers CRUD
  static getSuppliers(): Supplier[] {
    const db = DBManager.getDb();
    return db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
  }

  static createSupplier(data: Partial<Supplier>): Supplier {
    const db = DBManager.getDb();
    const now = new Date().toISOString();
    const res = db.prepare(`
      INSERT INTO suppliers (name, contact_person, phone, email, address, tax_number, notes, total_purchases, total_paid, balance_payable, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
    `).run(
      data.name!.trim(),
      data.contact_person ? data.contact_person.trim() : null,
      data.phone ? data.phone.trim() : null,
      data.email ? data.email.trim() : null,
      data.address ? data.address.trim() : null,
      data.tax_number ? data.tax_number.trim() : null,
      data.notes || null,
      now,
      now
    );

    return db.prepare('SELECT * FROM suppliers WHERE id = ?').get(Number(res.lastInsertRowid));
  }
}
