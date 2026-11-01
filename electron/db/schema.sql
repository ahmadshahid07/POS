-- ============================================================================
-- SKYTHS Offline Desktop Business Management System — SQLite Schema
-- Version: 1.0.0
-- Includes all 32 required core business tables, indexes, and constraints
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  recovery_code_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Roles
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT NOT NULL -- JSON array of permission strings
);

-- 3. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 4. Business Settings
CREATE TABLE IF NOT EXISTS business_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 5. App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 7. Product Categories (created before products for foreign key)
CREATE TABLE IF NOT EXISTS product_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL COLLATE NOCASE,
  code TEXT UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL
);

-- 8. Product Units
CREATE TABLE IF NOT EXISTS product_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  abbreviation TEXT UNIQUE NOT NULL
);

-- 10. Suppliers (created before products for foreign key)
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_number TEXT,
  notes TEXT,
  total_purchases REAL NOT NULL DEFAULT 0.0,
  total_paid REAL NOT NULL DEFAULT 0.0,
  balance_payable REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 11. Customers
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  total_purchases REAL NOT NULL DEFAULT 0.0,
  total_paid REAL NOT NULL DEFAULT 0.0,
  balance_receivable REAL NOT NULL DEFAULT 0.0,
  total_returns REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 6. Products
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL COLLATE NOCASE,
  barcode TEXT UNIQUE,
  category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
  brand TEXT,
  description TEXT,
  image_url TEXT,
  cost_price REAL NOT NULL DEFAULT 0.0,
  selling_price REAL NOT NULL DEFAULT 0.0,
  wholesale_price REAL,
  min_selling_price REAL,
  current_stock REAL NOT NULL DEFAULT 0.0,
  min_stock_threshold REAL NOT NULL DEFAULT 5.0,
  unit_id INTEGER REFERENCES product_units(id) ON DELETE SET NULL,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  tax_rate REAL NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 9. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT,
  cost_price REAL NOT NULL,
  selling_price REAL NOT NULL,
  stock_quantity REAL NOT NULL DEFAULT 0.0
);

-- 12. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  invoice_reference TEXT,
  purchase_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('draft', 'confirmed', 'received', 'cancelled')),
  subtotal REAL NOT NULL DEFAULT 0.0,
  discount REAL NOT NULL DEFAULT 0.0,
  tax_amount REAL NOT NULL DEFAULT 0.0,
  total_amount REAL NOT NULL DEFAULT 0.0,
  paid_amount REAL NOT NULL DEFAULT 0.0,
  balance_amount REAL NOT NULL DEFAULT 0.0,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 13. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity REAL NOT NULL,
  received_quantity REAL NOT NULL,
  unit_cost REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0.0,
  tax_rate REAL NOT NULL DEFAULT 0.0,
  line_total REAL NOT NULL
);

-- 14. Purchase Payments
CREATE TABLE IF NOT EXISTS purchase_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  reference_no TEXT,
  payment_date TEXT NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- 15. Sales
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  sale_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'returned', 'partially_returned', 'voided')),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'partial', 'unpaid', 'pending_cod')),
  subtotal REAL NOT NULL DEFAULT 0.0,
  discount_type TEXT NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_amount REAL NOT NULL DEFAULT 0.0,
  tax_rate REAL NOT NULL DEFAULT 0.0,
  tax_amount REAL NOT NULL DEFAULT 0.0,
  grand_total REAL NOT NULL DEFAULT 0.0,
  paid_amount REAL NOT NULL DEFAULT 0.0,
  change_due REAL NOT NULL DEFAULT 0.0,
  balance_due REAL NOT NULL DEFAULT 0.0,
  payment_method TEXT NOT NULL,
  cashier_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 16. Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  cost_price_snapshot REAL NOT NULL, -- Exact historical unit cost for bulletproof COGS
  discount REAL NOT NULL DEFAULT 0.0,
  line_total REAL NOT NULL
);

-- 17. Payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale_payment', 'purchase_payment', 'customer_receipt', 'supplier_payout', 'refund')),
  sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  purchase_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  payment_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  cashier_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- 18. Payment Allocations
CREATE TABLE IF NOT EXISTS payment_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  purchase_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  allocated_amount REAL NOT NULL,
  created_at TEXT NOT NULL
);

-- 19. Sales Returns
CREATE TABLE IF NOT EXISTS sales_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_number TEXT UNIQUE NOT NULL,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  customer_id INTEGER REFERENCES customers(id),
  return_date TEXT NOT NULL,
  refund_amount REAL NOT NULL,
  refund_method TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  authorized_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- 20. Sales Return Items
CREATE TABLE IF NOT EXISTS sales_return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
  sale_item_id INTEGER NOT NULL REFERENCES sale_items(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  cost_price REAL NOT NULL,
  refund_subtotal REAL NOT NULL,
  restock_action TEXT NOT NULL DEFAULT 'restock' CHECK (restock_action IN ('restock', 'damaged', 'scrap'))
);

-- 21. Purchase Returns
CREATE TABLE IF NOT EXISTS purchase_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_number TEXT UNIQUE NOT NULL,
  purchase_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
  purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  return_date TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0.0,
  refund_amount REAL NOT NULL DEFAULT 0.0,
  refund_method TEXT DEFAULT 'credit_adjustment',
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  authorized_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- 22. Purchase Return Items
CREATE TABLE IF NOT EXISTS purchase_return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
  purchase_item_id INTEGER REFERENCES purchase_items(id) ON DELETE SET NULL,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity REAL NOT NULL,
  unit_cost REAL NOT NULL,
  line_total REAL NOT NULL DEFAULT 0.0,
  subtotal REAL NOT NULL DEFAULT 0.0
);

-- 23. Stock Movements (Master Inventory Ledger)
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'purchase_receipt', 'sale_return', 'purchase_return', 'adjustment_add', 'adjustment_sub', 'opening_stock', 'damage')),
  quantity REAL NOT NULL, -- Positive for stock increase, negative for decrease
  previous_stock REAL NOT NULL,
  new_stock REAL NOT NULL,
  reference_id TEXT, -- Invoice number or PO number
  reference_type TEXT, -- 'sales', 'purchases', 'adjustments', 'returns'
  reason TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- 24. Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adjustment_number TEXT UNIQUE NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('physical_count', 'damage', 'loss', 'correction')),
  quantity REAL NOT NULL,
  reason TEXT NOT NULL,
  authorized_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- 26. Expense Categories (created before expenses for foreign key)
CREATE TABLE IF NOT EXISTS expense_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL COLLATE NOCASE,
  description TEXT,
  created_at TEXT NOT NULL
);

-- 25. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_number TEXT UNIQUE NOT NULL,
  category_id INTEGER REFERENCES expense_categories(id) ON DELETE SET NULL,
  expense_date TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payee TEXT,
  reference TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- 27. Cash Sessions
CREATE TABLE IF NOT EXISTS cash_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  opening_balance REAL NOT NULL DEFAULT 0.0,
  closing_expected REAL DEFAULT 0.0,
  closing_actual REAL,
  difference REAL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closing_notes TEXT
);

-- 28. Cash Movements
CREATE TABLE IF NOT EXISTS cash_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('opening', 'sale', 'refund', 'expense', 'drop', 'payout', 'adjustment')),
  amount REAL NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- 29. Invoice Sequences
CREATE TABLE IF NOT EXISTS invoice_sequences (
  prefix TEXT PRIMARY KEY,
  current_number INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

-- 30. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  username TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details_json TEXT,
  created_at TEXT NOT NULL
);

-- 31. Backup Logs
CREATE TABLE IF NOT EXISTS backup_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_path TEXT NOT NULL,
  backup_size INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 32. Database Migrations
CREATE TABLE IF NOT EXISTS database_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

-- ============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE & SEARCH SPEED
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchase_orders(purchase_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
