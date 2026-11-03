import { DBManager } from '../db/connection';
import { BusinessService } from './businessService';
import { SalesReturn, SalesReturnItem } from '../../src/types';

export interface ProcessSalesReturnParams {
  saleId: number;
  items: {
    saleItemId: number;
    productId: number;
    quantity: number;
    refundUnitPrice: number;
    restockAction: 'restock' | 'damaged' | 'scrap';
  }[];
  reason: string;
  refundMethod: string;
  userId?: number;
}

export class ReturnService {
  static processSalesReturn(params: ProcessSalesReturnParams): SalesReturn {
    const db = DBManager.getDb();

    if (!params.items || params.items.length === 0) {
      throw new Error('Return must contain at least one item.');
    }

    return db.transaction(() => {
      const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(params.saleId);
      if (!sale) {
        throw new Error(`Sale with ID ${params.saleId} not found.`);
      }

      let totalRefund = 0;
      for (const item of params.items) {
        if (item.quantity <= 0) {
          throw new Error('Return quantity must be greater than 0.');
        }
        const saleItem = db.prepare('SELECT * FROM sale_items WHERE id = ? AND sale_id = ?').get(item.saleItemId, params.saleId);
        if (!saleItem) {
          throw new Error(`Item ${item.saleItemId} does not belong to sale ${params.saleId}.`);
        }

        // Verify cumulative previously returned quantities to prevent over-refunding
        const priorReturns = db.prepare(`
          SELECT COALESCE(SUM(sri.quantity), 0) as already_returned
          FROM sales_return_items sri
          JOIN sales_returns sr ON sr.id = sri.return_id
          WHERE sri.sale_item_id = ? AND sr.status != 'voided' AND sr.status != 'cancelled'
        `).get(item.saleItemId) as { already_returned: number };

        const availableToReturn = saleItem.quantity - (priorReturns.already_returned || 0);
        if (item.quantity > availableToReturn) {
          throw new Error(`Cannot return ${item.quantity} units; only ${availableToReturn} unit(s) remain eligible for return.`);
        }
        totalRefund += item.quantity * item.refundUnitPrice;
      }

      const returnNumber = BusinessService.getNextSequence('RET');
      const now = new Date().toISOString();

      // 1. Create return header
      const returnRes = db.prepare(`
        INSERT INTO sales_returns (
          return_number, sale_id, customer_id, return_date, refund_amount,
          refund_method, reason, status, authorized_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
      `).run(
        returnNumber,
        params.saleId,
        sale.customer_id || null,
        now,
        totalRefund,
        params.refundMethod,
        params.reason,
        params.userId || null,
        now
      );

      const returnId = Number(returnRes.lastInsertRowid);

      // 2. Insert return items and handle inventory restock
      const insertItemStmt = db.prepare(`
        INSERT INTO sales_return_items (
          return_id, sale_item_id, product_id, quantity, unit_price, cost_price, refund_subtotal, restock_action
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare('UPDATE products SET current_stock = current_stock + ?, updated_at = ? WHERE id = ?');
      const insertMovementStmt = db.prepare(`
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, previous_stock, new_stock,
          reference_id, reference_type, reason, created_by, created_at
        ) VALUES (?, 'sale_return', ?, ?, ?, ?, 'returns', ?, ?, ?)
      `);

      const returnItems: SalesReturnItem[] = [];

      for (const item of params.items) {
        const prod = db.prepare('SELECT id, name, current_stock, cost_price FROM products WHERE id = ?').get(item.productId);
        const subtotal = item.quantity * item.refundUnitPrice;

        const itmRes = insertItemStmt.run(
          returnId,
          item.saleItemId,
          item.productId,
          item.quantity,
          item.refundUnitPrice,
          prod.cost_price,
          subtotal,
          item.restockAction
        );

        // Only add to sellable stock if restockAction === 'restock'
        if (item.restockAction === 'restock') {
          const prevStock = prod.current_stock;
          const newStock = prevStock + item.quantity;
          updateStockStmt.run(item.quantity, now, item.productId);
          insertMovementStmt.run(
            item.productId,
            item.quantity,
            prevStock,
            newStock,
            returnNumber,
            `Customer Return (Restocked) - Reason: ${params.reason}`,
            params.userId || null,
            now
          );
        } else {
          // Log movement as damage/scrap without restoring sellable stock
          insertMovementStmt.run(
            item.productId,
            0,
            prod.current_stock,
            prod.current_stock,
            returnNumber,
            `Customer Return (${item.restockAction.toUpperCase()}) - Non-restocked`,
            params.userId || null,
            now
          );
        }

        returnItems.push({
          id: Number(itmRes.lastInsertRowid),
          return_id: returnId,
          sale_item_id: item.saleItemId,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.refundUnitPrice,
          cost_price: prod.cost_price,
          refund_subtotal: subtotal,
          restock_action: item.restockAction
        });
      }

      // 3. Record refund payment transaction
      if (totalRefund > 0) {
        db.prepare(`
          INSERT INTO payments (
            transaction_type, sale_id, customer_id, amount, payment_method,
            reference_number, payment_date, status, notes, cashier_id, created_at
          ) VALUES ('refund', ?, ?, ?, ?, ?, ?, 'completed', 'Sales Return Customer Refund', ?, ?)
        `).run(params.saleId, sale.customer_id || null, totalRefund, params.refundMethod, returnNumber, now, params.userId || null, now);

        // If refund was cash, record in active cash session
        if (params.refundMethod === 'cash') {
          const activeSession = db.prepare('SELECT id FROM cash_sessions WHERE status = \'open\' ORDER BY id DESC LIMIT 1').get();
          if (activeSession) {
            db.prepare(`
              INSERT INTO cash_movements (session_id, movement_type, amount, reason, reference_id, created_by, created_at)
              VALUES (?, 'refund', ?, 'Customer Refund Payout', ?, ?, ?)
            `).run(activeSession.id, totalRefund, returnNumber, params.userId || null, now);
          }
        }
      }

      // 4. Update sale status
      const allSaleItems = db.prepare('SELECT SUM(quantity) as total_qty FROM sale_items WHERE sale_id = ?').get(params.saleId);
      const allReturned = db.prepare(`
        SELECT SUM(sri.quantity) as returned_qty 
        FROM sales_return_items sri 
        JOIN sales_returns sr ON sri.return_id = sr.id 
        WHERE sr.sale_id = ?
      `).get(params.saleId);

      const isFullReturn = (allReturned?.returned_qty || 0) >= (allSaleItems?.total_qty || 0);
      const newStatus = isFullReturn ? 'returned' : 'partially_returned';

      db.prepare('UPDATE sales SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, params.saleId);

      // 5. Update customer balance if applicable
      if (sale.customer_id) {
        db.prepare(`
          UPDATE customers 
          SET 
            total_returns = total_returns + ?,
            balance_receivable = MAX(0, balance_receivable - ?),
            updated_at = ?
          WHERE id = ?
        `).run(totalRefund, totalRefund, now, sale.customer_id);
      }

      return {
        id: returnId,
        return_number: returnNumber,
        sale_id: params.saleId,
        invoice_number: sale.invoice_number,
        customer_id: sale.customer_id || null,
        return_date: now,
        refund_amount: totalRefund,
        refund_method: params.refundMethod,
        reason: params.reason,
        status: 'completed',
        authorized_by: params.userId || null,
        created_at: now,
        items: returnItems
      };
    })();
  }

  static getSalesReturns(options?: { saleId?: number; limit?: number; offset?: number }): SalesReturn[] {
    const db = DBManager.getDb();
    let query = `
      SELECT 
        sr.*,
        s.invoice_number,
        c.name as customer_name,
        u.username as authorizer_name
      FROM sales_returns sr
      JOIN sales s ON sr.sale_id = s.id
      LEFT JOIN customers c ON sr.customer_id = c.id
      LEFT JOIN users u ON sr.authorized_by = u.id
    `;
    const params: any[] = [];
    if (options?.saleId) {
      query += ' WHERE sr.sale_id = ?';
      params.push(options.saleId);
    }
    query += ' ORDER BY sr.id DESC';
    if (options?.limit) {
      query += ` LIMIT ${options.limit} OFFSET ${options.offset || 0}`;
    }

    const rows = db.prepare(query).all(...params);
    return rows.map((r: any) => ({
      ...r,
      items: db.prepare('SELECT * FROM sales_return_items WHERE return_id = ?').all(r.id)
    }));
  }

  static processPurchaseReturn(params: {
    supplierId: number;
    purchaseOrderId?: number | null;
    items: {
      productId: number;
      quantity: number;
      unitCost: number;
    }[];
    reason: string;
    refundMethod?: string;
    userId?: number;
  }): any {
    const db = DBManager.getDb();
    if (!params.items || params.items.length === 0) {
      throw new Error('Purchase return must contain at least one product.');
    }

    return db.transaction(() => {
      const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(params.supplierId);
      if (!supplier) {
        throw new Error(`Supplier #${params.supplierId} not found.`);
      }

      let totalAmount = 0;
      for (const item of params.items) {
        if (item.quantity <= 0) {
          throw new Error('Return quantity must be greater than 0.');
        }
        const prod = db.prepare('SELECT id, name, current_stock FROM products WHERE id = ?').get(item.productId);
        if (!prod) {
          throw new Error(`Product #${item.productId} not found.`);
        }
        if (prod.current_stock < item.quantity) {
          throw new Error(`Cannot return ${item.quantity} units of ${prod.name}; only ${prod.current_stock} currently in stock.`);
        }
        totalAmount += item.quantity * item.unitCost;
      }

      const returnNumber = BusinessService.getNextSequence('PRT');
      const now = new Date().toISOString();

      const retRes = db.prepare(`
        INSERT INTO purchase_returns (
          return_number, purchase_id, purchase_order_id, supplier_id, return_date, total_amount,
          refund_amount, refund_method, reason, status, authorized_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
      `).run(
        returnNumber,
        params.purchaseOrderId || null,
        params.purchaseOrderId || null,
        params.supplierId,
        now,
        totalAmount,
        totalAmount,
        params.refundMethod || 'credit_adjustment',
        params.reason,
        params.userId || null,
        now
      );

      const returnId = Number(retRes.lastInsertRowid);

      const insertItemStmt = db.prepare(`
        INSERT INTO purchase_return_items (return_id, product_id, quantity, unit_cost, line_total, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const updateStockStmt = db.prepare('UPDATE products SET current_stock = current_stock - ?, updated_at = ? WHERE id = ?');
      const insertMovementStmt = db.prepare(`
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, previous_stock, new_stock,
          reference_id, reference_type, reason, created_by, created_at
        ) VALUES (?, 'purchase_return', ?, ?, ?, ?, 'purchase_return', ?, ?, ?)
      `);

      for (const item of params.items) {
        const prod = db.prepare('SELECT id, current_stock FROM products WHERE id = ?').get(item.productId);
        const subtotal = item.quantity * item.unitCost;
        insertItemStmt.run(returnId, item.productId, item.quantity, item.unitCost, subtotal, subtotal);

        const prevStock = prod.current_stock;
        const newStock = prevStock - item.quantity;
        updateStockStmt.run(item.quantity, now, item.productId);
        insertMovementStmt.run(
          item.productId,
          -item.quantity,
          prevStock,
          newStock,
          returnNumber,
          `Returned to Supplier - Reason: ${params.reason}`,
          params.userId || null,
          now
        );
      }

      // Adjust supplier balance payable
      db.prepare(`
        UPDATE suppliers 
        SET balance_payable = MAX(0, balance_payable - ?), updated_at = ?
        WHERE id = ?
      `).run(totalAmount, now, params.supplierId);

      return {
        id: returnId,
        return_number: returnNumber,
        supplier_id: params.supplierId,
        supplier_name: supplier.name,
        total_amount: totalAmount,
        return_date: now,
        reason: params.reason
      };
    })();
  }

  static getPurchaseReturns(options?: { supplierId?: number; limit?: number; offset?: number }): any[] {
    const db = DBManager.getDb();
    let query = `
      SELECT 
        pr.*,
        s.name as supplier_name,
        u.username as authorizer_name
      FROM purchase_returns pr
      JOIN suppliers s ON pr.supplier_id = s.id
      LEFT JOIN users u ON pr.authorized_by = u.id
    `;
    const params: any[] = [];
    if (options?.supplierId) {
      query += ' WHERE pr.supplier_id = ?';
      params.push(options.supplierId);
    }
    query += ' ORDER BY pr.id DESC';
    if (options?.limit) {
      query += ` LIMIT ${options.limit} OFFSET ${options.offset || 0}`;
    }

    const rows = db.prepare(query).all(...params);
    return rows.map((r: any) => ({
      ...r,
      items: db.prepare(`
        SELECT pri.*, p.name as product_name, p.sku 
        FROM purchase_return_items pri
        JOIN products p ON pri.product_id = p.id
        WHERE pri.return_id = ?
      `).all(r.id)
    }));
  }
}

