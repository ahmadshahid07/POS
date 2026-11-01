import { DBManager } from '../db/connection';
import { BusinessService } from './businessService';
import { Sale, SaleDetail, CartItem, PaymentMethod } from '../../src/types';

export interface CheckoutParams {
  cart: CartItem[];
  customerId?: number | null;
  discountType: 'percentage' | 'fixed';
  discountAmount: number;
  taxRate: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  cashierId?: number | null;
}

export class PosService {
  static completeSale(params: CheckoutParams): SaleDetail {
    const db = DBManager.getDb();

    if (!params.cart || params.cart.length === 0) {
      throw new Error('Cannot complete sale with an empty cart.');
    }

    return db.transaction(() => {
      // 1. Re-validate stock for all items
      for (const item of params.cart) {
        if (item.quantity <= 0) {
          throw new Error(`Invalid quantity for product '${item.product.name}'.`);
        }
        const prod = db.prepare('SELECT id, name, current_stock, cost_price, selling_price FROM products WHERE id = ?').get(item.product.id);
        if (!prod) {
          throw new Error(`Product '${item.product.name}' no longer exists in database.`);
        }
        if (prod.current_stock < item.quantity) {
          throw new Error(`Insufficient stock for '${prod.name}'. Requested: ${item.quantity}, Available: ${prod.current_stock}.`);
        }
      }

      // 2. Compute accurate financial totals
      let subtotal = 0;
      for (const item of params.cart) {
        subtotal += item.quantity * item.unit_price;
      }

      let orderDiscount = 0;
      if (params.discountType === 'percentage') {
        orderDiscount = Math.round((subtotal * (params.discountAmount / 100)) * 100) / 100;
      } else {
        orderDiscount = Math.min(params.discountAmount, subtotal);
      }

      const taxableAmount = Math.max(0, subtotal - orderDiscount);
      const taxAmount = Math.round((taxableAmount * (params.taxRate / 100)) * 100) / 100;
      const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

      const paid = Number(params.paidAmount);
      let changeDue = 0;
      let balanceDue = 0;
      let paymentStatus: 'paid' | 'partial' | 'unpaid' | 'pending_cod' = 'paid';

      if (params.paymentMethod === 'cod') {
        paymentStatus = 'pending_cod';
        balanceDue = grandTotal;
        changeDue = 0;
      } else if (paid >= grandTotal) {
        changeDue = Math.round((paid - grandTotal) * 100) / 100;
        balanceDue = 0;
        paymentStatus = 'paid';
      } else if (paid > 0) {
        balanceDue = Math.round((grandTotal - paid) * 100) / 100;
        changeDue = 0;
        paymentStatus = 'partial';
      } else {
        balanceDue = grandTotal;
        changeDue = 0;
        paymentStatus = 'unpaid';
      }

      // 3. Generate unique sequential invoice number
      const invoiceNumber = BusinessService.getNextSequence('INV');
      const now = new Date().toISOString();

      // 4. Insert into sales
      const saleStmt = db.prepare(`
        INSERT INTO sales (
          invoice_number, customer_id, sale_date, status, payment_status,
          subtotal, discount_type, discount_amount, tax_rate, tax_amount,
          grand_total, paid_amount, change_due, balance_due, payment_method,
          cashier_id, notes, created_at, updated_at
        ) VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const saleRes = saleStmt.run(
        invoiceNumber,
        params.customerId || null,
        now,
        paymentStatus,
        subtotal,
        params.discountType,
        orderDiscount,
        params.taxRate,
        taxAmount,
        grandTotal,
        paid >= grandTotal ? grandTotal : paid,
        changeDue,
        balanceDue,
        params.paymentMethod,
        params.cashierId || null,
        params.notes || null,
        now,
        now
      );

      const saleId = Number(saleRes.lastInsertRowid);

      // 5. Insert sale items, update inventory, and log stock movements
      const insertItemStmt = db.prepare(`
        INSERT INTO sale_items (
          sale_id, product_id, product_name, sku, quantity, unit_price,
          cost_price_snapshot, discount, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare(`
        UPDATE products 
        SET current_stock = current_stock - ?, updated_at = ?
        WHERE id = ?
      `);

      const insertMovementStmt = db.prepare(`
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, previous_stock, new_stock,
          reference_id, reference_type, reason, created_by, created_at
        ) VALUES (?, 'sale', ?, ?, ?, ?, 'sales', 'POS Customer Checkout', ?, ?)
      `);

      const insertedItems: any[] = [];

      for (const item of params.cart) {
        const prod = db.prepare('SELECT current_stock, cost_price FROM products WHERE id = ?').get(item.product.id);
        const prevStock = prod.current_stock;
        const newStock = prevStock - item.quantity;
        const lineTotal = item.quantity * item.unit_price;

        const itemRes = insertItemStmt.run(
          saleId,
          item.product.id,
          item.product.name,
          item.product.sku,
          item.quantity,
          item.unit_price,
          prod.cost_price, // Snapshot current unit cost
          item.discount || 0,
          lineTotal
        );

        updateStockStmt.run(item.quantity, now, item.product.id);
        insertMovementStmt.run(item.product.id, -item.quantity, prevStock, newStock, invoiceNumber, params.cashierId || null, now);

        insertedItems.push({
          id: Number(itemRes.lastInsertRowid),
          sale_id: saleId,
          product_id: item.product.id,
          product_name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          cost_price_snapshot: prod.cost_price,
          discount: item.discount || 0,
          line_total: lineTotal
        });
      }

      // 6. Record payment record and allocation
      const settledAmount = paid >= grandTotal ? grandTotal : paid;
      let insertedPayments: any[] = [];

      if (settledAmount > 0 && params.paymentMethod !== 'cod') {
        const payRes = db.prepare(`
          INSERT INTO payments (
            transaction_type, sale_id, customer_id, amount, payment_method,
            reference_number, payment_date, status, notes, cashier_id, created_at
          ) VALUES ('sale_payment', ?, ?, ?, ?, ?, ?, 'completed', 'POS Sale Payment', ?, ?)
        `).run(saleId, params.customerId || null, settledAmount, params.paymentMethod, invoiceNumber, now, params.cashierId || null, now);

        const paymentId = Number(payRes.lastInsertRowid);

        db.prepare(`
          INSERT INTO payment_allocations (payment_id, sale_id, allocated_amount, created_at)
          VALUES (?, ?, ?, ?)
        `).run(paymentId, saleId, settledAmount, now);

        insertedPayments.push({
          id: paymentId,
          transaction_type: 'sale_payment',
          sale_id: saleId,
          amount: settledAmount,
          payment_method: params.paymentMethod,
          payment_date: now
        });

        // 7. If cash payment, record in active cash session
        if (params.paymentMethod === 'cash') {
          const activeSession = db.prepare('SELECT id FROM cash_sessions WHERE status = \'open\' ORDER BY id DESC LIMIT 1').get();
          if (activeSession) {
            db.prepare(`
              INSERT INTO cash_movements (session_id, movement_type, amount, reason, reference_id, created_by, created_at)
              VALUES (?, 'sale', ?, 'POS Sale Cash Receipt', ?, ?, ?)
            `).run(activeSession.id, settledAmount, invoiceNumber, params.cashierId || null, now);
          }
        }
      }

      // 8. If customer selected and credit balance, update customer receivable
      if (params.customerId) {
        db.prepare(`
          UPDATE customers 
          SET 
            total_purchases = total_purchases + ?,
            total_paid = total_paid + ?,
            balance_receivable = balance_receivable + ?,
            updated_at = ?
          WHERE id = ?
        `).run(grandTotal, settledAmount, balanceDue, now, params.customerId);
      }

      // 9. Return complete sale detail
      const saleDetail: SaleDetail = {
        id: saleId,
        invoice_number: invoiceNumber,
        customer_id: params.customerId || null,
        sale_date: now,
        status: 'completed',
        payment_status: paymentStatus,
        subtotal,
        discount_type: params.discountType,
        discount_amount: orderDiscount,
        tax_rate: params.taxRate,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        paid_amount: settledAmount,
        change_due: changeDue,
        balance_due: balanceDue,
        payment_method: params.paymentMethod,
        cashier_id: params.cashierId || null,
        notes: params.notes || null,
        items_count: params.cart.length,
        created_at: now,
        updated_at: now,
        items: insertedItems,
        payments: insertedPayments
      };

      return saleDetail;
    })();
  }

  static getSalesHistory(options?: {
    startDate?: string;
    endDate?: string;
    customerId?: number;
    cashierId?: number;
    paymentStatus?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): { sales: Sale[]; total: number } {
    const db = DBManager.getDb();
    let whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (options?.startDate) {
      whereClauses.push('date(s.sale_date) >= date(?)');
      params.push(options.startDate);
    }
    if (options?.endDate) {
      whereClauses.push('date(s.sale_date) <= date(?)');
      params.push(options.endDate);
    }
    if (options?.customerId) {
      whereClauses.push('s.customer_id = ?');
      params.push(options.customerId);
    }
    if (options?.cashierId) {
      whereClauses.push('s.cashier_id = ?');
      params.push(options.cashierId);
    }
    if (options?.paymentStatus) {
      whereClauses.push('s.payment_status = ?');
      params.push(options.paymentStatus);
    }
    if (options?.search) {
      const q = `%${options.search.trim()}%`;
      whereClauses.push('(s.invoice_number LIKE ? OR c.name LIKE ?)');
      params.push(q, q);
    }

    const where = whereClauses.join(' AND ');

    const countRow = db.prepare(`
      SELECT COUNT(*) as total 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE ${where}
    `).get(...params);
    const total = countRow ? countRow.total : 0;

    let query = `
      SELECT 
        s.*,
        c.name as customer_name,
        c.phone as customer_phone,
        u.username as cashier_name,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.cashier_id = u.id
      WHERE ${where}
      ORDER BY s.id DESC
    `;

    if (options?.limit) {
      query += ` LIMIT ${options.limit} OFFSET ${options.offset || 0}`;
    }

    const rows = db.prepare(query).all(...params);
    return {
      sales: rows as Sale[],
      total
    };
  }

  static getSaleDetail(saleId: number): SaleDetail | null {
    const db = DBManager.getDb();
    const saleRow = db.prepare(`
      SELECT 
        s.*,
        c.name as customer_name,
        c.phone as customer_phone,
        u.username as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.cashier_id = u.id
      WHERE s.id = ?
    `).get(saleId);

    if (!saleRow) return null;

    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId);
    const payments = db.prepare('SELECT * FROM payments WHERE sale_id = ?').all(saleId);
    const returns = db.prepare('SELECT * FROM sales_returns WHERE sale_id = ?').all(saleId);

    return {
      ...saleRow,
      items,
      payments,
      returns
    };
  }
}
