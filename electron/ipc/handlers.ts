import { ipcMain, dialog, BrowserWindow } from 'electron';
import { ConfigService } from '../services/configService';
import { DBManager } from '../db/connection';
import { runMigrations } from '../db/migrations';
import { AuthService } from '../services/authService';
import { BusinessService } from '../services/businessService';
import { ProductService } from '../services/productService';
import { PosService } from '../services/posService';
import { PurchaseService } from '../services/purchaseService';
import { ReturnService } from '../services/returnService';
import { FinancialService } from '../services/financialService';
import { ReportService } from '../services/reportService';
import { BackupService } from '../services/backupService';
import { AssistantService } from '../services/assistantService';
import { AuditService } from '../services/auditService';

export function registerIpcHandlers(mainWindow?: BrowserWindow): void {
  // Configuration & Directory Selection
  ipcMain.handle('config:get', async () => {
    return ConfigService.getConfig();
  });

  ipcMain.handle('dialog:selectDirectory', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Folder for SKYTHS Local Database',
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle('dialog:selectBackupFile', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select SKYTHS Database Backup to Restore',
      filters: [
        { name: 'SQLite Database / Backup', extensions: ['db', 'bak', 'sqlite'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle('config:validateDir', async (_, dirPath: string) => {
    return ConfigService.validateDirectory(dirPath);
  });

  ipcMain.handle('config:initDb', async (_, { dirPath, businessProfile, adminData }) => {
    const val = ConfigService.validateDirectory(dirPath);
    if (!val.valid || !val.fullDbPath) {
      throw new Error(val.message);
    }

    // 1. Initialize SQLite connection
    DBManager.initDatabase(val.fullDbPath);

    // 2. Run migrations (schema, tables, seed data)
    runMigrations();

    // 3. Save config
    ConfigService.saveConfig({
      db_path: val.fullDbPath,
      is_configured: true
    });

    // 4. Update initial business settings
    if (businessProfile) {
      BusinessService.updateBusinessSettings(businessProfile);
    }

    // 5. Create administrator
    let recoveryCode = '';
    if (adminData) {
      const adminRes = await AuthService.createAdminUser(adminData);
      recoveryCode = adminRes.recoveryCode;
      AuditService.log({
        action: 'SETUP_INITIALIZED',
        entityType: 'system',
        details: { adminUsername: adminData.username, dbPath: val.fullDbPath }
      });
    }

    return {
      success: true,
      dbPath: val.fullDbPath,
      recoveryCode
    };
  });

  // Authentication
  ipcMain.handle('auth:login', async (_, { username, password }) => {
    const res = await AuthService.login(username, password);
    if (res.success && res.user) {
      AuditService.log({
        userId: res.user.id,
        username: res.user.username,
        action: 'USER_LOGIN',
        entityType: 'user',
        entityId: res.user.id
      });
    }
    return res;
  });

  ipcMain.handle('auth:resetPassword', async (_, { username, recoveryCode, newPassword }) => {
    return AuthService.resetPasswordWithRecoveryCode(username, recoveryCode, newPassword);
  });

  ipcMain.handle('auth:getUsers', async () => {
    return AuthService.getUsers();
  });

  ipcMain.handle('auth:createUser', async (_, data) => {
    const user = await AuthService.createUser(data);
    AuditService.log({
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: user.id,
      details: { username: user.username, role: user.role }
    });
    return user;
  });

  ipcMain.handle('auth:updateUser', async (_, { id, data }) => {
    AuthService.updateUser(id, data);
    AuditService.log({
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: id,
      details: data
    });
    return { success: true };
  });

  // Business & App Settings
  ipcMain.handle('business:getSettings', async () => {
    return BusinessService.getBusinessSettings();
  });

  ipcMain.handle('business:updateSettings', async (_, settings) => {
    const res = BusinessService.updateBusinessSettings(settings);
    AuditService.log({
      action: 'SETTINGS_UPDATED',
      entityType: 'business_settings',
      details: settings
    });
    return res;
  });

  ipcMain.handle('app:getSettings', async () => {
    return BusinessService.getAppSettings();
  });

  ipcMain.handle('app:updateSettings', async (_, settings) => {
    return BusinessService.updateAppSettings(settings);
  });

  // Products & Inventory
  ipcMain.handle('products:getAll', async (_, options) => {
    return ProductService.getAllProducts(options);
  });

  ipcMain.handle('products:getById', async (_, id: number) => {
    return ProductService.getProductById(id);
  });

  ipcMain.handle('products:getByCode', async (_, code: string) => {
    return ProductService.getProductByBarcodeOrSku(code);
  });

  ipcMain.handle('products:create', async (_, { product, userId }) => {
    const p = ProductService.createProduct(product, userId);
    AuditService.log({
      userId,
      action: 'PRODUCT_CREATED',
      entityType: 'product',
      entityId: p.id,
      details: { name: p.name, sku: p.sku, price: p.selling_price }
    });
    return p;
  });

  ipcMain.handle('products:update', async (_, { id, data, userId }) => {
    const p = ProductService.updateProduct(id, data, userId);
    AuditService.log({
      userId,
      action: 'PRODUCT_UPDATED',
      entityType: 'product',
      entityId: id,
      details: data
    });
    return p;
  });

  ipcMain.handle('products:adjustStock', async (_, params) => {
    const res = ProductService.adjustStock(params);
    AuditService.log({
      userId: params.userId,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'product',
      entityId: params.productId,
      details: { newStock: params.newQuantity, reason: params.reason }
    });
    return res;
  });

  ipcMain.handle('products:getMovements', async (_, options) => {
    return ProductService.getStockMovements(options);
  });

  ipcMain.handle('categories:getAll', async () => {
    return ProductService.getCategories();
  });

  ipcMain.handle('categories:create', async (_, { name, code, description }) => {
    return ProductService.createCategory(name, code, description);
  });

  ipcMain.handle('units:getAll', async () => {
    return ProductService.getUnits();
  });

  // Point of Sale & Checkout
  ipcMain.handle('pos:checkout', async (_, params) => {
    const sale = PosService.completeSale(params);
    AuditService.log({
      userId: params.cashierId,
      action: 'SALE_COMPLETED',
      entityType: 'sale',
      entityId: sale.id,
      details: { invoice: sale.invoice_number, total: sale.grand_total, method: sale.payment_method }
    });
    return sale;
  });

  ipcMain.handle('pos:getHistory', async (_, options) => {
    return PosService.getSalesHistory(options);
  });

  ipcMain.handle('pos:getDetail', async (_, id: number) => {
    return PosService.getSaleDetail(id);
  });

  // Purchases & Suppliers
  ipcMain.handle('purchases:create', async (_, params) => {
    const po = PurchaseService.createAndReceivePurchase(params);
    AuditService.log({
      userId: params.userId,
      action: 'PURCHASE_RECEIVED',
      entityType: 'purchase_order',
      entityId: po.id,
      details: { poNumber: po.po_number, total: po.total_amount, supplierId: po.supplier_id }
    });
    return po;
  });

  ipcMain.handle('purchases:getAll', async (_, options) => {
    return PurchaseService.getPurchases(options);
  });

  ipcMain.handle('suppliers:getAll', async () => {
    return PurchaseService.getSuppliers();
  });

  ipcMain.handle('suppliers:create', async (_, data) => {
    return PurchaseService.createSupplier(data);
  });

  // Returns
  ipcMain.handle('returns:sales', async (_, params) => {
    const ret = ReturnService.processSalesReturn(params);
    AuditService.log({
      userId: params.userId,
      action: 'SALES_RETURN_PROCESSED',
      entityType: 'sales_return',
      entityId: ret.id,
      details: { returnNumber: ret.return_number, saleId: ret.sale_id, refund: ret.refund_amount }
    });
    return ret;
  });

  ipcMain.handle('returns:getSalesReturns', async (_, options) => {
    return ReturnService.getSalesReturns(options);
  });

  ipcMain.handle('returns:purchase', async (_, params) => {
    const ret = ReturnService.processPurchaseReturn(params);
    AuditService.log({
      userId: params.userId,
      action: 'PURCHASE_RETURN_PROCESSED',
      entityType: 'purchase_return',
      entityId: ret.id,
      details: { returnNumber: ret.return_number, supplierId: ret.supplier_id, total: ret.total_amount }
    });
    return ret;
  });

  ipcMain.handle('returns:getPurchaseReturns', async (_, options) => {
    return ReturnService.getPurchaseReturns(options);
  });

  // Customers & Financials
  ipcMain.handle('customers:getAll', async () => {
    return FinancialService.getCustomers();
  });

  ipcMain.handle('customers:create', async (_, data) => {
    return FinancialService.createCustomer(data);
  });

  ipcMain.handle('customers:recordPayment', async (_, params) => {
    const pay = FinancialService.recordCustomerPayment(params);
    AuditService.log({
      userId: params.userId,
      action: 'CUSTOMER_PAYMENT_RECORDED',
      entityType: 'payment',
      entityId: pay.id,
      details: { customerId: params.customerId, amount: params.amount }
    });
    return pay;
  });

  // Expenses
  ipcMain.handle('expenses:getAll', async (_, options) => {
    return FinancialService.getExpenses(options);
  });

  ipcMain.handle('expenses:create', async (_, params) => {
    const exp = FinancialService.createExpense(params);
    AuditService.log({
      userId: params.userId,
      action: 'EXPENSE_RECORDED',
      entityType: 'expense',
      entityId: exp.id,
      details: { amount: exp.amount, category: exp.category_name }
    });
    return exp;
  });

  ipcMain.handle('expenses:getCategories', async () => {
    return FinancialService.getExpenseCategories();
  });

  // Cash Drawer Management
  ipcMain.handle('cash:getActiveSession', async () => {
    return FinancialService.getActiveCashSession();
  });

  ipcMain.handle('cash:openSession', async (_, { userId, openingBalance }) => {
    const s = FinancialService.openCashSession(userId, openingBalance);
    AuditService.log({
      userId,
      action: 'CASH_SESSION_OPENED',
      entityType: 'cash_session',
      entityId: s.id,
      details: { openingBalance }
    });
    return s;
  });

  ipcMain.handle('cash:closeSession', async (_, { sessionId, actualCash, closingNotes, userId }) => {
    const s = FinancialService.closeCashSession(sessionId, actualCash, closingNotes);
    AuditService.log({
      userId,
      action: 'CASH_SESSION_CLOSED',
      entityType: 'cash_session',
      entityId: s.id,
      details: { expected: s.closing_expected, actual: s.closing_actual, difference: s.difference }
    });
    return s;
  });

  ipcMain.handle('cash:getMovements', async (_, sessionId: number) => {
    return FinancialService.getCashMovements(sessionId);
  });

  // Reports
  ipcMain.handle('reports:getPnL', async (_, { startDate, endDate }) => {
    return ReportService.getProfitAndLoss(startDate, endDate);
  });

  ipcMain.handle('reports:getDashboard', async () => {
    return ReportService.getDashboardMetrics();
  });

  // Payments Ledger
  ipcMain.handle('payments:getAll', async (_, options) => {
    return FinancialService.getPayments(options);
  });

  // Backup & Restore
  ipcMain.handle('backup:create', async (_, customDir?: string) => {
    return BackupService.createBackup(customDir);
  });

  ipcMain.handle('backup:restore', async (_, backupPath: string) => {
    return BackupService.restoreBackup(backupPath);
  });

  ipcMain.handle('backup:getLogs', async () => {
    return BackupService.getBackupLogs();
  });

  // Offline Assistant
  ipcMain.handle('assistant:query', async (_, question: string) => {
    return AssistantService.query(question);
  });

  // Audit Logs
  ipcMain.handle('audit:getLogs', async (_, options) => {
    return AuditService.getLogs(options);
  });

  // Printing & Hardware
  ipcMain.handle('printer:getPrinters', async () => {
    if (!mainWindow) return [];
    return mainWindow.webContents.getPrintersAsync();
  });

  ipcMain.handle('printer:printSilent', async (_, { htmlContent, printerName, pageSize }) => {
    return new Promise((resolve) => {
      try {
        const printWin = new BrowserWindow({
          show: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          }
        });

        const fullHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <style>
              @page {
                margin: 0;
                size: ${pageSize === '58mm' ? '58mm auto' : pageSize === 'a4' ? 'A4' : '80mm auto'};
              }
              body {
                margin: 0;
                padding: 4px;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                color: #000;
                background: #fff;
                width: ${pageSize === '58mm' ? '56mm' : pageSize === 'a4' ? '100%' : '78mm'};
              }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `;

        printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);

        printWin.webContents.on('did-finish-load', () => {
          const printOptions: any = {
            silent: true,
            printBackground: true,
            margins: { marginType: 'none' }
          };

          if (printerName && printerName.trim()) {
            printOptions.deviceName = printerName.trim();
          }

          if (pageSize === '58mm') {
            printOptions.pageSize = { width: 58000, height: 250000 };
          } else if (pageSize === '80mm') {
            printOptions.pageSize = { width: 80000, height: 350000 };
          }

          printWin.webContents.print(printOptions, (success, errorType) => {
            printWin.close();
            if (!success && errorType && errorType !== 'cancelled') {
              resolve({ success: false, error: errorType });
            } else {
              resolve({ success: true });
            }
          });
        });

        printWin.webContents.on('did-fail-load', (_, errCode, errDesc) => {
          printWin.close();
          resolve({ success: false, error: errDesc });
        });
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  });

  // Customer Statement of Account
  ipcMain.handle('customers:getStatement', async (_, params) => {
    return FinancialService.getCustomerStatement(params);
  });

  // Automated Backup
  ipcMain.handle('backup:autoDaily', async (_, force?: boolean) => {
    return BackupService.autoDailyBackup(force);
  });

  // Window Controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });
}
