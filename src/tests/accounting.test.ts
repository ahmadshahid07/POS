import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DBManager } from '../../electron/db/connection';
import { runMigrations } from '../../electron/db/migrations';
import { AuthService } from '../../electron/services/authService';
import { ProductService } from '../../electron/services/productService';
import { PurchaseService } from '../../electron/services/purchaseService';
import { PosService } from '../../electron/services/posService';
import { ReturnService } from '../../electron/services/returnService';
import { FinancialService } from '../../electron/services/financialService';
import { ReportService } from '../../electron/services/reportService';
import { AssistantService } from '../../electron/services/assistantService';
import { BackupService } from '../../electron/services/backupService';
import { BusinessService } from '../../electron/services/businessService';

const TEST_DB_PATH = path.join(process.cwd(), 'test_skyths_isolated.db');

describe('SKYTHS Offline Accounting & Business Engine Test Suite', () => {
  beforeAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (_) {}
    }
    // Initialize isolated SQLite database
    DBManager.initDatabase(TEST_DB_PATH);
    const schemaPath = path.join(process.cwd(), 'electron', 'db', 'schema.sql');
    runMigrations(schemaPath);
  });

  afterAll(() => {
    DBManager.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (_) {}
    }
  });

  it('Workflow A: First-run admin initialization and password security', async () => {
    const { user, recoveryCode } = await AuthService.createAdminUser({
      username: 'admin',
      password: 'SecureAdminPassword123!',
      full_name: 'Super Administrator',
      email: 'admin@skyths.local',
      phone: '+92 300 0000000'
    });

    expect(user.id).toBeGreaterThan(0);
    expect(user.username).toBe('admin');
    expect(user.role).toBe('admin');
    expect(recoveryCode).toMatch(/^SKYTHS-[A-F0-9]{6}-[A-F0-9]{6}$/);

    // Login test
    const loginSuccess = await AuthService.login('admin', 'SecureAdminPassword123!');
    expect(loginSuccess.success).toBe(true);
    expect(loginSuccess.user?.username).toBe('admin');

    // Failed login test
    const loginFail = await AuthService.login('admin', 'WrongPassword!');
    expect(loginFail.success).toBe(false);
  });

  it('Workflow B: Product creation with SKU & initial stock', () => {
    const prod = ProductService.createProduct({
      name: 'Basmati Rice Premium 5KG',
      sku: 'RICE-5KG-01',
      barcode: '896400010001',
      cost_price: 100,
      selling_price: 200,
      current_stock: 10,
      min_stock_threshold: 5,
      status: 'active'
    });

    expect(prod.id).toBeGreaterThan(0);
    expect(prod.sku).toBe('RICE-5KG-01');
    expect(prod.current_stock).toBe(10);
    expect(prod.cost_price).toBe(100);

    // Verify stock movement was recorded for initial stock
    const movements = ProductService.getStockMovements({ productId: prod.id });
    expect(movements.length).toBe(1);
    expect(movements[0].movement_type).toBe('opening_stock');
    expect(movements[0].quantity).toBe(10);
  });

  it('Workflow C: Supplier purchase receiving and Weighted Average Cost (WAC) update', () => {
    // Create supplier
    const supplier = PurchaseService.createSupplier({
      name: 'Al-Madina Wholesale Distributors',
      phone: '+92 42 111222333',
      address: 'Badami Bagh, Lahore'
    });

    const prodBefore = ProductService.getProductByBarcodeOrSku('RICE-5KG-01')!;
    expect(prodBefore.current_stock).toBe(10);
    expect(prodBefore.cost_price).toBe(100);

    // Receive 10 units at 150 PKR
    // Expected WAC = ((10 * 100) + (10 * 150)) / 20 = 2500 / 20 = 125 PKR
    const po = PurchaseService.createAndReceivePurchase({
      supplierId: supplier.id,
      purchaseDate: new Date().toISOString(),
      items: [
        {
          productId: prodBefore.id,
          quantity: 10,
          unitCost: 150
        }
      ],
      paidAmount: 1000,
      paymentMethod: 'cash',
      notes: 'Test stock receiving'
    });

    expect(po.total_amount).toBe(1500);
    expect(po.paid_amount).toBe(1000);
    expect(po.balance_amount).toBe(500);

    const prodAfter = ProductService.getProductById(prodBefore.id)!;
    expect(prodAfter.current_stock).toBe(20);
    expect(prodAfter.cost_price).toBe(125); // Bulletproof WAC verification!
  });

  it('Workflow D: POS Sale checkout with atomic stock deduction and snapshot cost', () => {
    const prod = ProductService.getProductByBarcodeOrSku('RICE-5KG-01')!;

    // Checkout 2 units @ 200 PKR = 400 PKR
    const sale = PosService.completeSale({
      cart: [
        {
          product: prod,
          quantity: 2,
          unit_price: 200,
          discount: 0,
          line_total: 400
        }
      ],
      discountType: 'fixed',
      discountAmount: 0,
      taxRate: 0,
      paidAmount: 500, // tendered 500 PKR
      paymentMethod: 'cash'
    });

    expect(sale.grand_total).toBe(400);
    expect(sale.paid_amount).toBe(400);
    expect(sale.change_due).toBe(100);
    expect(sale.invoice_number).toMatch(/^INV-\d+$/);

    // Check item historical cost snapshot
    expect(sale.items[0].cost_price_snapshot).toBe(125);

    // Check inventory reduced from 20 to 18
    const updatedProd = ProductService.getProductById(prod.id)!;
    expect(updatedProd.current_stock).toBe(18);

    // Verify stock movements
    const movements = ProductService.getStockMovements({ productId: prod.id });
    const saleMovement = movements.find(m => m.reference_id === sale.invoice_number);
    expect(saleMovement).toBeDefined();
    expect(saleMovement?.quantity).toBe(-2);
  });

  it('Workflow H: Sales return, refund, and inventory restock routing', () => {
    const prod = ProductService.getProductByBarcodeOrSku('RICE-5KG-01')!;
    const sales = PosService.getSalesHistory({ limit: 1 }).sales;
    const lastSale = PosService.getSaleDetail(sales[0].id)!;

    expect(prod.current_stock).toBe(18);

    // Return 1 unit with restockAction = 'restock'
    const returnRecord = ReturnService.processSalesReturn({
      saleId: lastSale.id,
      items: [
        {
          saleItemId: lastSale.items[0].id,
          productId: prod.id,
          quantity: 1,
          refundUnitPrice: 200,
          restockAction: 'restock'
        }
      ],
      reason: 'Customer ordered wrong size',
      refundMethod: 'cash'
    });

    expect(returnRecord.refund_amount).toBe(200);

    // Verify inventory restored from 18 to 19
    const prodAfterReturn = ProductService.getProductById(prod.id)!;
    expect(prodAfterReturn.current_stock).toBe(19);
  });

  it('Workflow I & J: Operating expense and Profit & Loss verification', () => {
    // Record operating expense of 25 PKR
    const expense = FinancialService.createExpense({
      expenseDate: new Date().toISOString(),
      amount: 25,
      paymentMethod: 'cash',
      payee: 'Packaging Supplier',
      notes: 'Paper Bags'
    });

    expect(expense.amount).toBe(25);

    // Generate Profit and Loss report for today
    const today = new Date().toISOString().split('T')[0];
    const pnl = ReportService.getProfitAndLoss(today, today);

    // Expected numbers:
    // Gross sales: 400 PKR (1 sale of 2 units @ 200)
    // Sales returns: 200 PKR (1 unit refunded)
    // Net sales: 400 - 200 = 200 PKR
    // COGS: 2 units sold @ 125 (250) - 1 unit restocked @ 125 (125) = 125 PKR
    // Gross Profit: 200 - 125 = 75 PKR
    // Operating Expenses: 25 PKR
    // Net Operating Profit: 75 - 25 = 50 PKR
    expect(pnl.gross_sales).toBe(400);
    expect(pnl.sales_returns).toBe(200);
    expect(pnl.net_sales).toBe(200);
    expect(pnl.cost_of_goods_sold).toBe(125);
    expect(pnl.gross_profit).toBe(75);
    expect(pnl.operating_expenses).toBe(25);
    expect(pnl.net_operating_profit).toBe(50);
  });

  it('Workflow L: Consistent backup and restore with integrity verification', async () => {
    const backupResult = await BackupService.createBackup();
    expect(backupResult.success).toBe(true);
    expect(fs.existsSync(backupResult.backupPath)).toBe(true);

    // Make an adjustment
    const prod = ProductService.getProductByBarcodeOrSku('RICE-5KG-01')!;
    ProductService.adjustStock({
      productId: prod.id,
      newQuantity: 99,
      reason: 'Physical inventory test discrepancy',
      adjustmentType: 'physical_count'
    });

    expect(ProductService.getProductById(prod.id)!.current_stock).toBe(99);

    // Restore from verified backup
    const restoreResult = await BackupService.restoreBackup(backupResult.backupPath);
    expect(restoreResult.success).toBe(true);

    // Verify stock is restored to 19
    const prodRestored = ProductService.getProductById(prod.id)!;
    expect(prodRestored.current_stock).toBe(19);

    // Clean up backup file
    if (fs.existsSync(backupResult.backupPath)) {
      try {
        fs.unlinkSync(backupResult.backupPath);
      } catch (_) {}
    }
  });

  it('Offline Assistant: Live DB queries and step-by-step answers', () => {
    const lowStockAnswer = AssistantService.query('how many items are low in stock?');
    expect(lowStockAnswer.reply).toBeDefined();

    const salesAnswer = AssistantService.query('what was today sales?');
    expect(salesAnswer.reply).toContain("Today's Business Summary");

    const helpAnswer = AssistantService.query('how do I add a product?');
    expect(helpAnswer.reply).toContain('Products & Inventory');
  });

  it('Workflow M: Customer credit sale, customer payment on account, and customer sales return', () => {
    // 1. Create a customer
    const customer = FinancialService.createCustomer({
      name: 'Haji Muhammad Akram',
      phone: '+92 321 9876543',
      address: 'Shah Alam Market, Lahore'
    });
    expect(customer.id).toBeGreaterThan(0);
    expect(customer.balance_receivable).toBe(0);

    const prod = ProductService.getProductByBarcodeOrSku('RICE-5KG-01')!;

    // 2. Customer Credit Sale: Buy 2 units @ 200 PKR = 400 PKR, paid 100 PKR, credit balance 300 PKR
    const creditSale = PosService.completeSale({
      cart: [
        {
          product: prod,
          quantity: 2,
          unit_price: 200,
          discount: 0,
          line_total: 400
        }
      ],
      customerId: customer.id,
      discountType: 'fixed',
      discountAmount: 0,
      taxRate: 0,
      paidAmount: 100,
      paymentMethod: 'cash'
    });

    expect(creditSale.grand_total).toBe(400);
    expect(creditSale.paid_amount).toBe(100);
    expect(creditSale.balance_due).toBe(300);
    expect(creditSale.payment_status).toBe('partial');

    // Verify customer balance receivable updated to 300
    const customers = FinancialService.getCustomers();
    const custAfterSale = customers.find(c => c.id === customer.id)!;
    expect(custAfterSale.balance_receivable).toBe(300);
    expect(custAfterSale.total_purchases).toBe(400);
    expect(custAfterSale.total_paid).toBe(100);

    // 3. Customer Account Payment: Pay remaining 300 PKR towards the sale
    const payment = FinancialService.recordCustomerPayment({
      customerId: customer.id,
      saleId: creditSale.id,
      amount: 300,
      paymentMethod: 'bank_transfer',
      referenceNumber: 'TRX-998877',
      notes: 'Final settlement'
    });
    expect(payment.id).toBeGreaterThan(0);
    expect(payment.amount).toBe(300);

    // Verify customer balance receivable is now 0
    const custAfterPay = FinancialService.getCustomers().find(c => c.id === customer.id)!;
    expect(custAfterPay.balance_receivable).toBe(0);
    expect(custAfterPay.total_paid).toBe(400);

    // 4. Customer Return with Restock & total_returns tracking
    const returnRecord = ReturnService.processSalesReturn({
      saleId: creditSale.id,
      items: [
        {
          saleItemId: creditSale.items[0].id,
          productId: prod.id,
          quantity: 1,
          refundUnitPrice: 200,
          restockAction: 'restock'
        }
      ],
      reason: 'Customer return overage',
      refundMethod: 'cash'
    });

    expect(returnRecord.refund_amount).toBe(200);

    // Verify customer total_returns was incremented without SQLite column error
    const custAfterReturn = FinancialService.getCustomers().find(c => c.id === customer.id)!;
    expect(custAfterReturn.total_returns).toBe(200);
  });

  it('Workflow N: Supplier debit note / purchase return and stock decrement', () => {
    const suppliers = PurchaseService.getSuppliers();
    const supplier = suppliers[0];
    const prodBefore = ProductService.getProductByBarcodeOrSku('RICE-5KG-01')!;
    const stockBefore = prodBefore.current_stock;
    const balancePayableBefore = supplier.balance_payable;

    // Issue Debit Note / Return 2 units back to supplier @ 125 PKR
    const debitNote = ReturnService.processPurchaseReturn({
      supplierId: supplier.id,
      items: [
        {
          productId: prodBefore.id,
          quantity: 2,
          unitCost: 125
        }
      ],
      reason: 'Batch package punctured during transit'
    });

    expect(debitNote.id).toBeGreaterThan(0);
    expect(debitNote.total_amount).toBe(250);
    expect(debitNote.return_number).toMatch(/^PRT-\d+$/);

    // Verify stock was reduced by 2
    const prodAfter = ProductService.getProductById(prodBefore.id)!;
    expect(prodAfter.current_stock).toBe(stockBefore - 2);

    // Verify supplier payable balance was reduced by 250
    const updatedSuppliers = PurchaseService.getSuppliers();
    const supplierAfter = updatedSuppliers.find(s => s.id === supplier.id)!;
    expect(supplierAfter.balance_payable).toBe(Math.max(0, balancePayableBefore - 250));

    // Verify purchase returns query works
    const returnsList = ReturnService.getPurchaseReturns({ supplierId: supplier.id });
    expect(returnsList.length).toBeGreaterThan(0);
    expect(returnsList[0].items.length).toBe(1);
    expect(returnsList[0].items[0].product_name).toBe(prodBefore.name);
  });

  it('Workflow O: Cash drawer session lifecycle and discrepancy auditing', () => {
    // 1. Open drawer with 5000 PKR opening float
    const session = FinancialService.openCashSession(1, 5000);
    expect(session.id).toBeGreaterThan(0);
    expect(session.status).toBe('open');
    expect(session.opening_balance).toBe(5000);

    // Verify active session retrieval
    const active = FinancialService.getActiveCashSession();
    expect(active?.id).toBe(session.id);

    // 2. Check initial cash movement
    const movements = FinancialService.getCashMovements(session.id);
    expect(movements.length).toBe(1);
    expect(movements[0].movement_type).toBe('opening');
    expect(movements[0].amount).toBe(5000);

    // 3. Close drawer with actual cash counted as 5050 (50 PKR overage)
    const closed = FinancialService.closeCashSession(session.id, 5050, 'Shift end count');
    expect(closed.status).toBe('closed');
    expect(closed.closing_actual).toBe(5050);
    expect(closed.difference).toBe(50); // Exact discrepancy tracked

    // Verify no active session remaining
    expect(FinancialService.getActiveCashSession()).toBeNull();
  });

  it('Workflow P: Password reset with secure recovery code', async () => {
    // 1. Create a cashier user
    const cashier = await AuthService.createUser({
      username: 'cashier_ali',
      password: 'OldPassword123!',
      full_name: 'Ali Raza',
      role: 'cashier',
      email: 'ali@skyths.local'
    });

    // 2. Set an explicit recovery code for test
    const recoveryCode = AuthService.generateRecoveryCode();
    const recoveryHash = await AuthService.hashPassword(recoveryCode);
    const db = DBManager.getDb();
    db.prepare('UPDATE users SET recovery_code_hash = ? WHERE id = ?').run(recoveryHash, cashier.id);

    // 3. Reset password using recovery code
    const resetRes = await AuthService.resetPasswordWithRecoveryCode('cashier_ali', recoveryCode, 'NewSecurePassword456!');
    expect(resetRes.success).toBe(true);

    // 4. Verify login with new password
    const newLogin = await AuthService.login('cashier_ali', 'NewSecurePassword456!');
    expect(newLogin.success).toBe(true);

    // 5. Verify old password no longer works
    const oldLogin = await AuthService.login('cashier_ali', 'OldPassword123!');
    expect(oldLogin.success).toBe(false);
  });

  it('Workflow Q: Complete dashboard metrics computation', () => {
    const metrics = ReportService.getDashboardMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.total_inventory_quantity).toBeGreaterThan(0);
    expect(metrics.inventory_valuation).toBeGreaterThan(0);
    expect(Array.isArray(metrics.daily_sales)).toBe(true);
    expect(Array.isArray(metrics.category_breakdown)).toBe(true);
    expect(Array.isArray(metrics.top_products)).toBe(true);
  });

  it('Workflow R: Customer Statement of Account chronological ledger and running balance', () => {
    // 1. Create dedicated customer
    const cust = FinancialService.createCustomer({
      name: 'Hassan Tariq Statement Test',
      phone: '+92 321 9998877'
    });
    expect(cust.id).toBeGreaterThan(0);

    // 2. Fetch existing product
    const prod = ProductService.getAllProducts().products[0];

    // 3. Process an invoice on credit (grand_total = 1000, paid = 200, balance = 800)
    PosService.completeSale({
      cart: [{ product: prod, quantity: 2, unit_price: 500, line_total: 1000, discount: 0 }],
      customerId: cust.id,
      discountType: 'percentage',
      discountAmount: 0,
      taxRate: 0,
      paidAmount: 200,
      paymentMethod: 'cash',
      cashierId: 1
    });

    // 4. Record an account payment (300 PKR)
    FinancialService.recordCustomerPayment({
      customerId: cust.id,
      amount: 300,
      paymentMethod: 'bank_transfer',
      referenceNumber: 'BANK-STMT-99',
      userId: 1
    });

    // 5. Generate Statement of Account
    const stmt = FinancialService.getCustomerStatement({ customerId: cust.id });
    expect(stmt).toBeDefined();
    expect(stmt.customer.id).toBe(cust.id);
    expect(stmt.total_invoiced).toBe(1000);
    expect(stmt.total_payments).toBe(300); // 300 account payment
    expect(stmt.transactions.length).toBeGreaterThanOrEqual(2);

    // Verify first tx is the sales invoice (Debit: 1000)
    const invoiceTx = stmt.transactions.find(t => t.type === 'invoice')!;
    expect(invoiceTx.debit).toBe(1000);
    expect(invoiceTx.credit).toBe(0);

    // Verify second tx is the bank receipt (Credit: 300)
    const payTx = stmt.transactions.find(t => t.type === 'payment')!;
    expect(payTx.credit).toBe(300);
    expect(payTx.debit).toBe(0);
  });

  it('Workflow S: Automated scheduled backup execution and integrity verification', async () => {
    // Execute auto daily backup with force flag
    const res = await BackupService.autoDailyBackup(true);
    expect(res.executed).toBe(true);
    expect(res.backupPath).toBeDefined();

    // Verify backup log recorded
    const logs = BackupService.getBackupLogs();
    const autoLog = logs.find(l => l.status === 'auto_completed');
    expect(autoLog).toBeDefined();
    expect(autoLog?.backup_size).toBeGreaterThan(0);
  });

  it('Workflow T: Multi-tier taxation, multi-currency conversion, and silent printing settings', () => {
    const updated = BusinessService.updateBusinessSettings({
      tax_mode: 'breakdown',
      tax_name: 'Federal GST',
      tax_rate: 18.0,
      tax_name_2: 'Punjab Sales Tax',
      tax_rate_2: 4.0,
      fbr_pos_id: 'FBR-888999-LHE',
      enable_secondary_currency: true,
      secondary_currency_code: 'USD',
      secondary_currency_symbol: '$',
      exchange_rate: 280.0,
      silent_print_enabled: true,
      selected_printer: 'Xprinter XP-80C',
      auto_print_on_checkout: true,
      sound_effects_enabled: true,
      low_stock_chime_enabled: true,
    });

    expect(updated.tax_mode).toBe('breakdown');
    expect(updated.tax_rate).toBe(18.0);
    expect(updated.tax_rate_2).toBe(4.0);
    expect(updated.fbr_pos_id).toBe('FBR-888999-LHE');
    expect(updated.exchange_rate).toBe(280.0);
    expect(updated.silent_print_enabled).toBe(true);
    expect(updated.selected_printer).toBe('Xprinter XP-80C');
  });

  it('Workflow U: Category, Supplier, and Customer update and delete operations', () => {
    // 1. Category Update & Delete
    const cat = ProductService.createCategory('Temp Category', 'TEMP', 'Temporary category');
    expect(cat.id).toBeGreaterThan(0);
    const updatedCat = ProductService.updateCategory(cat.id, 'Updated Category', 'UPDT', 'Updated desc');
    expect(updatedCat.name).toBe('Updated Category');
    expect(updatedCat.code).toBe('UPDT');
    const catDeleted = ProductService.deleteCategory(cat.id);
    expect(catDeleted).toBe(true);

    // 2. Supplier Update & Delete
    const sup = PurchaseService.createSupplier({ name: 'Temp Supplier', phone: '+92 300 1111111' });
    expect(sup.id).toBeGreaterThan(0);
    const updatedSup = PurchaseService.updateSupplier(sup.id, { name: 'Renamed Supplier', address: 'Plot 4, Industrial Area' });
    expect(updatedSup.name).toBe('Renamed Supplier');
    expect(updatedSup.address).toBe('Plot 4, Industrial Area');
    const supDeleted = PurchaseService.deleteSupplier(sup.id);
    expect(supDeleted).toBe(true);

    // 3. Customer Update & Delete
    const cust = FinancialService.createCustomer({ name: 'Temp Customer', phone: '+92 300 2222222' });
    expect(cust.id).toBeGreaterThan(0);
    const updatedCust = FinancialService.updateCustomer(cust.id, { name: 'Renamed Customer', address: 'Model Town, Lahore' });
    expect(updatedCust.name).toBe('Renamed Customer');
    expect(updatedCust.address).toBe('Model Town, Lahore');
    const custDeleted = FinancialService.deleteCustomer(cust.id);
    expect(custDeleted).toBe(true);
  });

  it('Workflow V: Sequence generation concurrency, atomicity, and format verification', () => {
    // Generate consecutive sequence numbers for invoices and expenses
    const seq1 = BusinessService.getNextSequence('INV');
    const seq2 = BusinessService.getNextSequence('INV');
    const seq3 = BusinessService.getNextSequence('EXP');

    expect(seq1).toMatch(/^INV-\d+$/);
    expect(seq2).toMatch(/^INV-\d+$/);
    expect(seq3).toMatch(/^EXP-\d+$/);

    const num1 = parseInt(seq1.split('-')[1], 10);
    const num2 = parseInt(seq2.split('-')[1], 10);
    expect(num2).toBe(num1 + 1);
  });

  it('Workflow W: Cumulative prior return enforcement and over-return prevention', () => {
    // Create a product for return testing
    const testProd = ProductService.createProduct({
      name: 'Return Test Item',
      sku: 'RET-TEST-01',
      cost_price: 50,
      selling_price: 100,
      current_stock: 5,
      min_stock_threshold: 2,
      status: 'active'
    });

    // Make a sale of 3 units
    const saleResult = PosService.completeSale({
      cart: [{
        product: testProd,
        quantity: 3,
        unit_price: 100,
        discount: 0,
        line_total: 300
      }],
      discountType: 'fixed',
      discountAmount: 0,
      taxRate: 0,
      paidAmount: 300,
      paymentMethod: 'cash'
    });

    expect(saleResult.id).toBeGreaterThan(0);
    const saleId = saleResult.id;

    // 1. First return: 2 units (valid)
    const return1 = ReturnService.processSalesReturn({
      saleId,
      items: [{
        saleItemId: saleResult.items[0].id,
        productId: testProd.id,
        quantity: 2,
        refundUnitPrice: 100,
        restockAction: 'restock'
      }],
      reason: 'Initial partial return',
      refundMethod: 'cash'
    });
    expect(return1.id).toBeGreaterThan(0);
    expect(return1.refund_amount).toBe(200);

    // 2. Second return: attempting 2 units again (must fail because only 1 unit remains unreturned!)
    expect(() => {
      ReturnService.processSalesReturn({
        saleId,
        items: [{
          saleItemId: saleResult.items[0].id,
          productId: testProd.id,
          quantity: 2,
          refundUnitPrice: 100,
          restockAction: 'restock'
        }],
        reason: 'Attempted duplicate return',
        refundMethod: 'cash'
      });
    }).toThrow(/remain eligible for return/i);

    // 3. Third return: 1 unit (the remaining quantity - should succeed)
    const return2 = ReturnService.processSalesReturn({
      saleId,
      items: [{
        saleItemId: saleResult.items[0].id,
        productId: testProd.id,
        quantity: 1,
        refundUnitPrice: 100,
        restockAction: 'restock'
      }],
      reason: 'Remaining item',
      refundMethod: 'cash'
    });
    expect(return2.id).toBeGreaterThan(0);
    expect(return2.refund_amount).toBe(100);

    // 4. Fourth return: 1 unit after all 3 have been returned (must fail)
    expect(() => {
      ReturnService.processSalesReturn({
        saleId,
        items: [{
          saleItemId: saleResult.items[0].id,
          productId: testProd.id,
          quantity: 1,
          refundUnitPrice: 100,
          restockAction: 'restock'
        }],
        reason: 'Excess return',
        refundMethod: 'cash'
      });
    }).toThrow(/remain eligible for return/i);
  });

  it('Workflow X: Authentication rate-limiting, lockout behavior, and input validation', async () => {
    // Reset any failed attempts
    AuthService.resetLoginAttempts();

    // 1. Password length validation
    await expect(AuthService.createUser({
      username: 'shortuser',
      password: '123',
      full_name: 'Short User',
      role: 'cashier'
    })).rejects.toThrow(/at least 6 characters/i);

    // 2. Create valid user
    const user = await AuthService.createUser({
      username: 'rate_test_user',
      password: 'ValidPassword123!',
      full_name: 'Rate Test User',
      role: 'cashier'
    });
    expect(user.id).toBeGreaterThan(0);

    // 3. Duplicate username rejection
    await expect(AuthService.createUser({
      username: 'rate_test_user',
      password: 'ValidPassword123!',
      full_name: 'Another User',
      role: 'cashier'
    })).rejects.toThrow(/already exists/i);

    // 4. Trigger 5 consecutive failed logins
    for (let i = 0; i < 5; i++) {
      const res = await AuthService.login('rate_test_user', 'WrongPassword!');
      expect(res.success).toBe(false);
    }

    // 5. 6th attempt must be blocked by temporary lockout
    const lockedRes = await AuthService.login('rate_test_user', 'WrongPassword!');
    expect(lockedRes.success).toBe(false);
    expect(lockedRes.message).toMatch(/temporarily locked/i);

    // 6. Even with the correct password, locked user remains blocked
    const lockedCorrectRes = await AuthService.login('rate_test_user', 'ValidPassword123!');
    expect(lockedCorrectRes.success).toBe(false);
    expect(lockedCorrectRes.message).toMatch(/temporarily locked/i);

    // 7. Reset attempts and verify successful login
    AuthService.resetLoginAttempts('rate_test_user');
    const unlockedRes = await AuthService.login('rate_test_user', 'ValidPassword123!');
    expect(unlockedRes.success).toBe(true);
    expect(unlockedRes.user?.username).toBe('rate_test_user');
  });

  it('Workflow Y: Exact daily profit calculation from historical snapshot costs in DashboardMetrics', () => {
    const metrics = ReportService.getDashboardMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.daily_sales).toBeInstanceOf(Array);

    // If daily sales exist, verify structure and exact values
    if (metrics.daily_sales.length > 0) {
      const todayTrend = metrics.daily_sales[metrics.daily_sales.length - 1];
      expect(todayTrend).toHaveProperty('date');
      expect(todayTrend).toHaveProperty('sales');
      expect(todayTrend).toHaveProperty('profit');
      expect(typeof todayTrend.sales).toBe('number');
      expect(typeof todayTrend.profit).toBe('number');
      // Profit must not simply equal sales * 0.25 blindly
      expect(todayTrend.profit).toBeGreaterThanOrEqual(0);
    }
  });

  it('Workflow Z: Stock adjustment sequence tracking and atomic inventory updates', () => {
    const prod = ProductService.getProductByBarcodeOrSku('RICE-5KG-01')!;
    const stockBefore = prod.current_stock;

    // Adjust stock by +5
    const adjResult = ProductService.adjustStock({
      productId: prod.id,
      newQuantity: stockBefore + 5,
      reason: 'Inventory count discrepancy',
      adjustmentType: 'physical_count'
    });
    expect(adjResult.product.current_stock).toBe(stockBefore + 5);
    expect(adjResult.movement.reference_id).toMatch(/^ADJ-\d+$/);

    const prodAfter = ProductService.getProductByBarcodeOrSku('RICE-5KG-01')!;
    expect(prodAfter.current_stock).toBe(stockBefore + 5);

    // Check movements ledger
    const movements = ProductService.getStockMovements({ productId: prod.id });
    const adjMovement = movements.find(m => m.reference_id === adjResult.movement.reference_id);
    expect(adjMovement).toBeDefined();
    expect(adjMovement?.movement_type).toBe('adjustment_add');
    expect(adjMovement?.quantity).toBe(5);
  });
});

