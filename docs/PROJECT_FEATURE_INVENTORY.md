# SKYTHS — Complete Feature Inventory

## 1. Feature Matrix by Business Module

| Module ID | Module Name | Primary Components | IPC Channels | Status |
| :--- | :--- | :--- | :--- | :--- |
| **MOD-01** | **Setup & Initial Onboarding** | `SplashScreen.tsx`, `SetupWizard.tsx` | `config:get`, `dialog:selectDirectory`, `config:validateDir`, `config:initDb` | Fully Functional |
| **MOD-02** | **Authentication & Security** | `LoginScreen.tsx`, `PasswordRecoveryModal.tsx` | `auth:login`, `auth:resetPassword` | Fully Functional |
| **MOD-03** | **Product & Stock Management** | `ProductListView.tsx`, `ProductFormModal.tsx`, `BarcodeLabelModal.tsx`, `CategoriesView.tsx` | `products:*`, `categories:*`, `units:*` | Fully Functional |
| **MOD-04** | **Master Inventory Ledger** | `StockMovementsView.tsx`, `StockAdjustmentModal.tsx` | `products:adjustStock`, `products:getMovements` | Fully Functional |
| **MOD-05** | **Point of Sale (POS) Checkout** | `PosView.tsx`, `ReceiptModal.tsx`, `useCartStore.ts` | `pos:checkout`, `products:getByCode` | Fully Functional |
| **MOD-06** | **Sales History & Invoicing** | `SalesHistoryView.tsx`, `SaleDetailModal.tsx`, `InvoicePrintCenter.tsx` | `pos:getHistory`, `pos:getDetail`, `printer:*` | Fully Functional |
| **MOD-07** | **Procurement & Purchases** | `PurchasesView.tsx`, `NewPurchaseModal.tsx`, `SuppliersView.tsx` | `purchases:*`, `suppliers:*` | Fully Functional |
| **MOD-08** | **Returns & Credit Notes** | `SalesReturnsView.tsx`, `PurchaseReturnsView.tsx` | `returns:sales`, `returns:purchase`, `returns:*` | Fully Functional |
| **MOD-09** | **Customer Accounts & Credit** | `CustomersView.tsx`, `CustomerStatementModal.tsx` | `customers:*`, `customers:getStatement` | Fully Functional |
| **MOD-10** | **Cash Drawer & Finance** | `CashManagementView.tsx`, `ExpensesView.tsx`, `PaymentsView.tsx` | `cash:*`, `expenses:*`, `payments:*` | Fully Functional |
| **MOD-11** | **Financial Reporting & P&L** | `FinancialReportsView.tsx`, `DashboardView.tsx` | `reports:getPnL`, `reports:getDashboard` | Fully Functional |
| **MOD-12** | **User Management & RBAC** | `UserManagementView.tsx` | `auth:getUsers`, `auth:createUser`, `auth:updateUser` | Fully Functional |
| **MOD-13** | **System & Hardware Settings** | `SettingsView.tsx` | `business:*`, `app:*`, `printer:getPrinters` | Fully Functional |
| **MOD-14** | **Backup & Disaster Recovery** | `BackupRecoveryView.tsx` | `backup:create`, `backup:restore`, `backup:getLogs` | Fully Functional |
| **MOD-15** | **Immutable Audit Trail** | `AuditLogsView.tsx` | `audit:getLogs` | Fully Functional |
| **MOD-16** | **Offline Help Assistant** | `SkythsAssistant.tsx`, `AssistantView.tsx` | `assistant:query` | Fully Functional |
| **MOD-17** | **Corbel Modern Console** | `CorbelLayout.tsx`, `CorbelDashboardView.tsx`, `CorbelAnalyticsView.tsx`, `CorbelWorkspaceView.tsx`, etc. | `reports:getDashboard`, `products:getAll`, `pos:getHistory` | Fully Integrated |

---

## 2. Detailed Feature Breakdown

### A. Authentication & Onboarding
- **First-Run Setup Wizard**: Guides the user to pick an offline database directory, validates write permissions, runs database migrations, configures business identity, and provisions the root administrative user.
- **Credential Verification**: Verifies username and salted bcrypt hash.
- **Account Status Guard**: Checks account status (`active`, `inactive`, `suspended`) and blocks disabled accounts.
- **Emergency Password Recovery**: Authenticates 16-character recovery codes (`SKYTHS-XXXXXX-XXXXXX`) to reset administrative access without external internet or email connectivity.

### B. Product Catalog & Inventory
- **Product Entity Lifecycle**: Full CRUD operations with auto-generation of unique SKUs and barcodes.
- **Barcode & Label Generator**: Supports on-demand printing of printable Code-128 barcode labels with item name, SKU, and retail price.
- **Category & Unit Organization**: Custom categories with auto-computed product counts and standard metric/imperial units.
- **Dual Stock Movement Tracking**: Real-time stock increments and decrements backed by a complete historical ledger (`stock_movements`).
- **Physical Count Stock Adjustments**: Discrepancy reconciliation with reason codes (`physical_count`, `damage`, `loss`, `correction`).

### C. Point of Sale (POS) Billing
- **High-Speed Barcode Scanning**: Instant lookup with audio feedback chime on detection.
- **Dynamic Cart Calculations**: Subtotal, percentage or fixed order discounts, multi-tiered taxation, and tender balance calculations.
- **Oversell Prevention**: Built-in validation prevents adding or selling quantities greater than available physical stock.
- **Flexible Payment Methods**: Supported workflows for Cash, Card, Bank Transfer, Cash on Delivery (COD), Easypaisa, and JazzCash.
- **Atomic Stock Deduction**: Automatically deducts inventory upon checkout within an isolated SQLite database transaction.
- **Change Calculation**: Real-time change return calculator preventing manual cashier arithmetic errors.

### D. Invoice & Receipt Printing
- **Hardware Integration**: Communicates directly with installed thermal printers via Electron print API.
- **Multi-Format Receipt Sizing**: Pre-formatted stylesheets for 58mm thermal rolls, 80mm thermal rolls, and standard A4 formal commercial invoices.
- **Silent Print Engine**: Headless background printing for uninterrupted counter operations.

### E. Procurement & Accounts Payable
- **Purchase Order Receiving**: Full itemized PO receiving flow.
- **Weighted Average Cost (WAC)**: Automatically recomputes product unit cost based on previous stock value and incoming purchase invoice cost.
- **Supplier Ledger**: Tracks cumulative supplier billings, payments, and outstanding balances payable.

### F. Returns & Customer Credit
- **Sales Return Processing**: Validates original purchase item, prevents duplicate/excess returns, routes inventory back to active stock or damage scrap, and adjusts customer credit balance.
- **Purchase Return / Debit Notes**: Decrements supplier balance payable and removes inventory with appropriate debit note documentation.
- **Customer Statement of Account**: Chronological debit/credit running ledger detailing historical invoices, payments, and credit notes.

### G. Financial Accounting & Executive Reporting
- **Profit and Loss Statement (P&L)**:
  - Gross Sales - Discounts - Returns = Net Sales
  - Historical Snapshot Cost of Goods Sold (COGS)
  - Gross Profit & Gross Margin Percentage
  - Itemized Operating Expenses by Category
  - Net Operating Profit & Net Profit Margin
- **Executive Dashboard**: Real-time sales today, sales this month, inventory total valuation, low-stock alerts, 14-day daily sales trend, and payment method distribution.

### H. Data Protection & System Maintenance
- **Hot SQLite Backups**: Live online backups using SQLite `VACUUM INTO` ensuring consistency without database lockouts.
- **Automated Daily Backups**: Daily background backup on cash drawer close with 14-backup retention rotation.
- **Safe Database Restoration**: Automatic pre-restoration safety snapshot, integrity verification (`PRAGMA integrity_check`), and automatic rollback on failure.
- **Immutable Audit Logging**: Records administrative and operational activities with timestamp, user ID, entity type, and serialized metadata.

