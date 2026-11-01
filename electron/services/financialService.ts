import { DBManager } from '../db/connection';
import { BackupService } from './backupService';
import { Customer, Payment, Expense, ExpenseCategory, CashSession, CashMovement, CustomerStatement, CustomerStatementTransaction } from '../../src/types';

export class FinancialService {
  // Customers
  static getCustomers(): Customer[] {
    const db = DBManager.getDb();
    return db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
  }

  static getCustomerStatement(params: { customerId: number; startDate?: string; endDate?: string }): CustomerStatement {
    const db = DBManager.getDb();
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(params.customerId) as Customer;
    if (!customer) {
      throw new Error(`Customer with ID ${params.customerId} not found.`);
    }

    const startDate = params.startDate ? `${params.startDate}T00:00:00.000Z` : '1970-01-01T00:00:00.000Z';
    const endDate = params.endDate ? `${params.endDate}T23:59:59.999Z` : '2099-12-31T23:59:59.999Z';

    // 1. Fetch sales invoices
    const sales = db.prepare(`
      SELECT id, invoice_number, sale_date, grand_total, paid_amount, balance_due, notes
      FROM sales
      WHERE customer_id = ? AND sale_date >= ? AND sale_date <= ? AND status != 'voided'
      ORDER BY sale_date ASC
    `).all(params.customerId, startDate, endDate) as any[];

    // 2. Fetch customer payments / receipts
    const payments = db.prepare(`
      SELECT id, transaction_type, sale_id, amount, payment_method, reference_number, payment_date, notes
      FROM payments
      WHERE customer_id = ? AND payment_date >= ? AND payment_date <= ? AND status = 'completed' AND transaction_type = 'customer_receipt'
      ORDER BY payment_date ASC
    `).all(params.customerId, startDate, endDate) as any[];

    // 3. Fetch sales returns
    const returns = db.prepare(`
      SELECT r.id, r.return_number, r.return_date, r.refund_amount, r.refund_method, r.reason, s.invoice_number
      FROM sales_returns r
      JOIN sales s ON r.sale_id = s.id
      WHERE s.customer_id = ? AND r.return_date >= ? AND r.return_date <= ?
      ORDER BY r.return_date ASC
    `).all(params.customerId, startDate, endDate) as any[];

    // Pre-period balance (transactions prior to startDate)
    const preSales = db.prepare(`
      SELECT COALESCE(SUM(grand_total), 0) as total FROM sales 
      WHERE customer_id = ? AND sale_date < ? AND status != 'voided'
    `).get(params.customerId, startDate) as { total: number };

    const prePayments = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE customer_id = ? AND payment_date < ? AND status = 'completed' AND transaction_type = 'customer_receipt'
    `).get(params.customerId, startDate) as { total: number };

    const preReturns = db.prepare(`
      SELECT COALESCE(SUM(r.refund_amount), 0) as total FROM sales_returns r
      JOIN sales s ON r.sale_id = s.id
      WHERE s.customer_id = ? AND r.return_date < ? AND r.refund_method = 'credit'
    `).get(params.customerId, startDate) as { total: number };

    const openingBalance = Math.max(0, Math.round((preSales.total - prePayments.total - preReturns.total) * 100) / 100);

    interface RawTx {
      date: string;
      type: 'invoice' | 'payment' | 'return';
      id: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
    }

    const rawTxs: RawTx[] = [];

    for (const s of sales) {
      rawTxs.push({
        date: s.sale_date,
        type: 'invoice',
        id: `INV-${s.id}`,
        reference: s.invoice_number,
        description: s.notes ? `Sale Invoice (${s.notes})` : 'Sales Invoice',
        debit: s.grand_total,
        credit: 0
      });
    }

    for (const p of payments) {
      rawTxs.push({
        date: p.payment_date,
        type: 'payment',
        id: `PAY-${p.id}`,
        reference: p.reference_number || `RCPT-${p.id}`,
        description: `Payment Receipt (${p.payment_method.toUpperCase()}${p.notes ? ' - ' + p.notes : ''})`,
        debit: 0,
        credit: p.amount
      });
    }

    for (const r of returns) {
      rawTxs.push({
        date: r.return_date,
        type: 'return',
        id: `RET-${r.id}`,
        reference: r.return_number,
        description: `Credit Note / Return against ${r.invoice_number} (${r.reason || 'Restocked'})`,
        debit: 0,
        credit: r.refund_amount
      });
    }

    rawTxs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = openingBalance;
    let totalInvoiced = 0;
    let totalPayments = 0;
    let totalReturns = 0;

    const transactions: CustomerStatementTransaction[] = [];
    for (const tx of rawTxs) {
      totalInvoiced += tx.debit;
      if (tx.type === 'payment') totalPayments += tx.credit;
      if (tx.type === 'return') totalReturns += tx.credit;

      running = Math.round((running + tx.debit - tx.credit) * 100) / 100;
      transactions.push({
        ...tx,
        running_balance: running
      });
    }

    return {
      customer,
      start_date: params.startDate || 'All Time',
      end_date: params.endDate || new Date().toISOString().slice(0, 10),
      opening_balance: openingBalance,
      total_invoiced: Math.round(totalInvoiced * 100) / 100,
      total_payments: Math.round(totalPayments * 100) / 100,
      total_returns: Math.round(totalReturns * 100) / 100,
      closing_balance: running,
      transactions
    };
  }

  static createCustomer(data: Partial<Customer>): Customer {
    const db = DBManager.getDb();
    const now = new Date().toISOString();
    const res = db.prepare(`
      INSERT INTO customers (name, phone, email, address, notes, total_purchases, total_paid, balance_receivable, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
    `).run(
      data.name!.trim(),
      data.phone ? data.phone.trim() : null,
      data.email ? data.email.trim() : null,
      data.address ? data.address.trim() : null,
      data.notes || null,
      now,
      now
    );

    return db.prepare('SELECT * FROM customers WHERE id = ?').get(Number(res.lastInsertRowid)) as Customer;
  }

  static recordCustomerPayment(params: {
    customerId: number;
    saleId?: number | null;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
    userId?: number;
  }): Payment {
    const db = DBManager.getDb();
    const now = new Date().toISOString();

    if (params.amount <= 0) {
      throw new Error('Payment amount must be greater than 0.');
    }

    return db.transaction(() => {
      const customer = db.prepare('SELECT id, name, balance_receivable FROM customers WHERE id = ?').get(params.customerId);
      if (!customer) {
        throw new Error(`Customer ${params.customerId} not found.`);
      }

      const payRes = db.prepare(`
        INSERT INTO payments (
          transaction_type, sale_id, customer_id, amount, payment_method,
          reference_number, payment_date, status, notes, cashier_id, created_at
        ) VALUES ('customer_receipt', ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)
      `).run(
        params.saleId || null,
        params.customerId,
        params.amount,
        params.paymentMethod,
        params.referenceNumber || null,
        now,
        params.notes || 'Customer Account Payment',
        params.userId || null,
        now
      );

      const paymentId = Number(payRes.lastInsertRowid);

      // If specific sale referenced, update sale paid amount & balance
      if (params.saleId) {
        db.prepare(`
          UPDATE sales 
          SET 
            paid_amount = paid_amount + ?,
            balance_due = MAX(0, balance_due - ?),
            payment_status = CASE WHEN (balance_due - ?) <= 0 THEN 'paid' ELSE 'partial' END,
            updated_at = ?
          WHERE id = ?
        `).run(params.amount, params.amount, params.amount, now, params.saleId);

        db.prepare('INSERT INTO payment_allocations (payment_id, sale_id, allocated_amount, created_at) VALUES (?, ?, ?, ?)')
          .run(paymentId, params.saleId, params.amount, now);
      }

      // Update customer balance
      db.prepare(`
        UPDATE customers 
        SET 
          total_paid = total_paid + ?,
          balance_receivable = MAX(0, balance_receivable - ?),
          updated_at = ?
        WHERE id = ?
      `).run(params.amount, params.amount, now, params.customerId);

      // If cash, record in active session
      if (params.paymentMethod === 'cash') {
        const activeSession = db.prepare('SELECT id FROM cash_sessions WHERE status = \'open\' ORDER BY id DESC LIMIT 1').get();
        if (activeSession) {
          db.prepare(`
            INSERT INTO cash_movements (session_id, movement_type, amount, reason, reference_id, created_by, created_at)
            VALUES (?, 'sale', ?, 'Customer Balance Payment Receipt', ?, ?, ?)
          `).run(activeSession.id, params.amount, params.referenceNumber || null, params.userId || null, now);
        }
      }

      return {
        id: paymentId,
        transaction_type: 'customer_receipt' as const,
        sale_id: params.saleId || null,
        customer_id: params.customerId,
        customer_name: customer.name,
        amount: params.amount,
        payment_method: params.paymentMethod as any,
        reference_number: params.referenceNumber || null,
        payment_date: now,
        status: 'completed',
        notes: params.notes || null,
        cashier_id: params.userId || null,
        created_at: now
      };
    })();
  }

  // Expenses
  static getExpenses(options?: { categoryId?: number; limit?: number; offset?: number }): Expense[] {
    const db = DBManager.getDb();
    let query = `
      SELECT 
        e.*,
        c.name as category_name,
        u.username as creator_name
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
    `;
    const params: any[] = [];
    if (options?.categoryId) {
      query += ' WHERE e.category_id = ?';
      params.push(options.categoryId);
    }
    query += ' ORDER BY e.expense_date DESC, e.id DESC';
    if (options?.limit) {
      query += ` LIMIT ${options.limit} OFFSET ${options.offset || 0}`;
    }

    return db.prepare(query).all(...params);
  }

  static createExpense(params: {
    categoryId?: number | null;
    expenseDate: string;
    amount: number;
    paymentMethod: string;
    payee?: string;
    reference?: string;
    notes?: string;
    userId?: number;
  }): Expense {
    const db = DBManager.getDb();
    if (params.amount <= 0) {
      throw new Error('Expense amount must be greater than 0.');
    }

    const now = new Date().toISOString();
    const expenseNum = `EXP-${Date.now().toString().slice(-6)}`;

    return db.transaction(() => {
      const res = db.prepare(`
        INSERT INTO expenses (
          expense_number, category_id, expense_date, amount, payment_method,
          payee, reference, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        expenseNum,
        params.categoryId || null,
        params.expenseDate || now,
        params.amount,
        params.paymentMethod,
        params.payee || null,
        params.reference || null,
        params.notes || null,
        params.userId || null,
        now
      );

      const expenseId = Number(res.lastInsertRowid);

      // If paid by cash, deduct from active cash session
      if (params.paymentMethod === 'cash') {
        const activeSession = db.prepare('SELECT id FROM cash_sessions WHERE status = \'open\' ORDER BY id DESC LIMIT 1').get();
        if (activeSession) {
          db.prepare(`
            INSERT INTO cash_movements (session_id, movement_type, amount, reason, reference_id, created_by, created_at)
            VALUES (?, 'expense', ?, ?, ?, ?, ?)
          `).run(activeSession.id, params.amount, `Expense: ${params.notes || 'Operating Expense'}`, expenseNum, params.userId || null, now);
        }
      }

      return db.prepare(`
        SELECT e.*, c.name as category_name, u.username as creator_name
        FROM expenses e
        LEFT JOIN expense_categories c ON e.category_id = c.id
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.id = ?
      `).get(expenseId);
    })();
  }

  static getExpenseCategories(): ExpenseCategory[] {
    const db = DBManager.getDb();
    return db.prepare('SELECT * FROM expense_categories ORDER BY name ASC').all();
  }

  // Cash Sessions
  static getActiveCashSession(): CashSession | null {
    const db = DBManager.getDb();
    const row = db.prepare(`
      SELECT cs.*, u.username as user_name
      FROM cash_sessions cs
      JOIN users u ON cs.user_id = u.id
      WHERE cs.status = 'open'
      ORDER BY cs.id DESC
      LIMIT 1
    `).get();

    return row || null;
  }

  static openCashSession(userId: number, openingBalance: number): CashSession {
    const db = DBManager.getDb();
    const active = this.getActiveCashSession();
    if (active) {
      throw new Error(`A cash session is already open by user #${active.user_id}. Please close it first.`);
    }

    const now = new Date().toISOString();
    return db.transaction(() => {
      const res = db.prepare(`
        INSERT INTO cash_sessions (user_id, opened_at, opening_balance, closing_expected, status)
        VALUES (?, ?, ?, ?, 'open')
      `).run(userId, now, openingBalance, openingBalance);

      const sessionId = Number(res.lastInsertRowid);

      db.prepare(`
        INSERT INTO cash_movements (session_id, movement_type, amount, reason, created_by, created_at)
        VALUES (?, 'opening', ?, 'Drawer Opening Balance', ?, ?)
      `).run(sessionId, openingBalance, userId, now);

      return db.prepare('SELECT cs.*, u.username as user_name FROM cash_sessions cs JOIN users u ON cs.user_id = u.id WHERE cs.id = ?').get(sessionId);
    })();
  }

  static getCashMovements(sessionId: number): CashMovement[] {
    const db = DBManager.getDb();
    return db.prepare('SELECT * FROM cash_movements WHERE session_id = ? ORDER BY created_at ASC').all(sessionId);
  }

  static closeCashSession(sessionId: number, actualCash: number, closingNotes?: string): CashSession {
    const db = DBManager.getDb();
    const session = db.prepare('SELECT * FROM cash_sessions WHERE id = ?').get(sessionId);
    if (!session || session.status !== 'open') {
      throw new Error('Cash session is not open or not found.');
    }

    // Calculate expected cash balance from movements
    const movements = db.prepare('SELECT movement_type, amount FROM cash_movements WHERE session_id = ?').all(sessionId);
    let expected = session.opening_balance;
    for (const m of movements) {
      if (m.movement_type === 'sale' || m.movement_type === 'adjustment') {
        expected += m.amount;
      } else if (m.movement_type === 'refund' || m.movement_type === 'expense' || m.movement_type === 'drop' || m.movement_type === 'payout') {
        expected -= m.amount;
      }
    }

    const diff = Math.round((actualCash - expected) * 100) / 100;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE cash_sessions 
      SET 
        closed_at = ?,
        closing_expected = ?,
        closing_actual = ?,
        difference = ?,
        status = 'closed',
        closing_notes = ?
      WHERE id = ?
    `).run(now, expected, actualCash, diff, closingNotes || null, sessionId);

    // Auto-backup snapshot upon cash drawer closure
    BackupService.autoDailyBackup(true).catch((err) => {
      console.warn('[SKYTHS] Automatic drawer-closing backup warning:', err.message);
    });

    return db.prepare('SELECT cs.*, u.username as user_name FROM cash_sessions cs JOIN users u ON cs.user_id = u.id WHERE cs.id = ?').get(sessionId);
  }

  // All Payments
  static getPayments(options?: { limit?: number; offset?: number }): Payment[] {
    const db = DBManager.getDb();
    let query = `
      SELECT 
        p.*,
        c.name as customer_name,
        s.name as supplier_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.payment_date DESC, p.id DESC
    `;
    if (options?.limit) {
      query += ` LIMIT ${options.limit} OFFSET ${options.offset || 0}`;
    }

    return db.prepare(query).all();
  }
}
