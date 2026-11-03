import { contextBridge, ipcRenderer } from 'electron';

export const skythsAPI = {
  // Config & Folder
  getConfig: () => ipcRenderer.invoke('config:get'),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  validateDirectory: (dirPath: string) => ipcRenderer.invoke('config:validateDir', dirPath),
  initDatabase: (params: any) => ipcRenderer.invoke('config:initDb', params),

  // Auth & Users
  login: (credentials: any) => ipcRenderer.invoke('auth:login', credentials),
  resetPassword: (params: any) => ipcRenderer.invoke('auth:resetPassword', params),
  getUsers: () => ipcRenderer.invoke('auth:getUsers'),
  createUser: (data: any) => ipcRenderer.invoke('auth:createUser', data),
  updateUser: (id: number, data: any) => ipcRenderer.invoke('auth:updateUser', { id, data }),

  // Settings
  getBusinessSettings: () => ipcRenderer.invoke('business:getSettings'),
  updateBusinessSettings: (settings: any) => ipcRenderer.invoke('business:updateSettings', settings),
  getAppSettings: () => ipcRenderer.invoke('app:getSettings'),
  updateAppSettings: (settings: any) => ipcRenderer.invoke('app:updateSettings', settings),

  // Products & Inventory
  getProducts: (options?: any) => ipcRenderer.invoke('products:getAll', options),
  getProductById: (id: number) => ipcRenderer.invoke('products:getById', id),
  getProductByCode: (code: string) => ipcRenderer.invoke('products:getByCode', code),
  createProduct: (product: any, userId?: number) => ipcRenderer.invoke('products:create', { product, userId }),
  updateProduct: (id: number, data: any, userId?: number) => ipcRenderer.invoke('products:update', { id, data, userId }),
  adjustStock: (params: any) => ipcRenderer.invoke('products:adjustStock', params),
  getStockMovements: (options?: any) => ipcRenderer.invoke('products:getMovements', options),

  // Categories & Units
  getCategories: () => ipcRenderer.invoke('categories:getAll'),
  createCategory: (data: any) => ipcRenderer.invoke('categories:create', data),
  updateCategory: (params: any) => ipcRenderer.invoke('categories:update', params),
  deleteCategory: (id: number) => ipcRenderer.invoke('categories:delete', id),
  getUnits: () => ipcRenderer.invoke('units:getAll'),

  // POS & Sales
  checkout: (params: any) => ipcRenderer.invoke('pos:checkout', params),
  getSalesHistory: (options?: any) => ipcRenderer.invoke('pos:getHistory', options),
  getSaleDetail: (id: number) => ipcRenderer.invoke('pos:getDetail', id),

  // Purchases & Suppliers
  createPurchase: (params: any) => ipcRenderer.invoke('purchases:create', params),
  getPurchases: (options?: any) => ipcRenderer.invoke('purchases:getAll', options),
  getSuppliers: () => ipcRenderer.invoke('suppliers:getAll'),
  createSupplier: (data: any) => ipcRenderer.invoke('suppliers:create', data),
  updateSupplier: (id: number, data: any) => ipcRenderer.invoke('suppliers:update', { id, data }),
  deleteSupplier: (id: number) => ipcRenderer.invoke('suppliers:delete', id),

  // Returns
  processSalesReturn: (params: any) => ipcRenderer.invoke('returns:sales', params),
  getSalesReturns: (options?: any) => ipcRenderer.invoke('returns:getSalesReturns', options),
  processPurchaseReturn: (params: any) => ipcRenderer.invoke('returns:purchase', params),
  getPurchaseReturns: (options?: any) => ipcRenderer.invoke('returns:getPurchaseReturns', options),

  // Customers & Financials
  getCustomers: () => ipcRenderer.invoke('customers:getAll'),
  createCustomer: (data: any) => ipcRenderer.invoke('customers:create', data),
  updateCustomer: (id: number, data: any) => ipcRenderer.invoke('customers:update', { id, data }),
  deleteCustomer: (id: number) => ipcRenderer.invoke('customers:delete', id),
  recordCustomerPayment: (params: any) => ipcRenderer.invoke('customers:recordPayment', params),

  // Expenses
  getExpenses: (options?: any) => ipcRenderer.invoke('expenses:getAll', options),
  createExpense: (params: any) => ipcRenderer.invoke('expenses:create', params),
  getExpenseCategories: () => ipcRenderer.invoke('expenses:getCategories'),

  // Cash Drawer
  getActiveCashSession: () => ipcRenderer.invoke('cash:getActiveSession'),
  openCashSession: (params: any) => ipcRenderer.invoke('cash:openSession', params),
  closeCashSession: (params: any) => ipcRenderer.invoke('cash:closeSession', params),
  getCashMovements: (sessionId: number) => ipcRenderer.invoke('cash:getMovements', sessionId),

  // Reports
  getPnLReport: (startDate: string, endDate: string) => ipcRenderer.invoke('reports:getPnL', { startDate, endDate }),
  getDashboardMetrics: () => ipcRenderer.invoke('reports:getDashboard'),
  getPayments: (options?: any) => ipcRenderer.invoke('payments:getAll', options),

  // Backup & Recovery
  createBackup: (customDir?: string) => ipcRenderer.invoke('backup:create', customDir),
  restoreBackup: (backupPath: string) => ipcRenderer.invoke('backup:restore', backupPath),
  getBackupLogs: () => ipcRenderer.invoke('backup:getLogs'),
  selectBackupFile: () => ipcRenderer.invoke('dialog:selectBackupFile'),
  triggerAutoDailyBackup: (force?: boolean) => ipcRenderer.invoke('backup:autoDaily', force),

  // Printing & Hardware
  getPrinters: () => ipcRenderer.invoke('printer:getPrinters'),
  printSilent: (params: { htmlContent: string; printerName?: string; pageSize?: string }) =>
    ipcRenderer.invoke('printer:printSilent', params),

  // Customer Statement
  getCustomerStatement: (params: { customerId: number; startDate?: string; endDate?: string }) =>
    ipcRenderer.invoke('customers:getStatement', params),

  // Offline Assistant
  queryAssistant: (question: string) => ipcRenderer.invoke('assistant:query', question),

  // Audit Logs
  getAuditLogs: (options?: any) => ipcRenderer.invoke('audit:getLogs', options),

  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
};

contextBridge.exposeInMainWorld('skythsAPI', skythsAPI);
