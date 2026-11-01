// ============================================================================
// SKYTHS Desktop Management System — Core Type Definitions
// ============================================================================

export type UserRole = 'admin' | 'manager' | 'cashier';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  email?: string | null;
  phone?: string | null;
  status: UserStatus;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  business_name: string;
  owner_name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  currency_symbol: string;
  date_format: string;
  tax_rate: number;
  tax_name: string;
  receipt_header: string;
  receipt_footer: string;
  receipt_size: '58mm' | '80mm' | 'a4';
  low_stock_threshold: number;
  invoice_prefix: string;
  logo_url?: string;
  return_policy?: string;
  // Printing & Hardware
  silent_print_enabled?: boolean;
  selected_printer?: string;
  auto_print_on_checkout?: boolean;
  // Sound & Alerts
  sound_effects_enabled?: boolean;
  low_stock_chime_enabled?: boolean;
  // Multi-tier Tax / FBR POS Readiness
  tax_mode?: 'single' | 'breakdown' | 'exempt';
  tax_rate_2?: number;
  tax_name_2?: string;
  fbr_pos_id?: string;
  // Multi-Currency
  enable_secondary_currency?: boolean;
  secondary_currency_code?: string;
  secondary_currency_symbol?: string;
  exchange_rate?: number;
  // Backup Automations
  auto_backup_on_drawer_close?: boolean;
  [key: string]: any;
}

export interface AppSettings {
  db_path: string;
  theme: 'light' | 'dark' | 'system';
  reduced_motion: boolean;
  density: 'comfortable' | 'compact';
  auto_backup_enabled: boolean;
  auto_backup_interval_hours: number;
  last_backup_date?: string;
  [key: string]: any;
}

export interface ProductCategory {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  created_at: string;
  product_count?: number;
}

export interface ProductUnit {
  id: number;
  name: string;
  abbreviation: string;
}

export type ProductStatus = 'active' | 'inactive' | 'discontinued';

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  brand?: string | null;
  description?: string | null;
  image_url?: string | null;
  cost_price: number;
  selling_price: number;
  wholesale_price?: number | null;
  min_selling_price?: number | null;
  current_stock: number;
  min_stock_threshold: number;
  min_stock_level?: number;
  unit_id?: number | null;
  unit_name?: string | null;
  unit_abbreviation?: string | null;
  supplier_id?: number | null;
  supplier_name?: string | null;
  tax_rate: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_number?: string | null;
  notes?: string | null;
  total_purchases: number;
  total_paid: number;
  balance_payable: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  total_purchases: number;
  total_paid: number;
  balance_receivable: number;
  total_returns?: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number; // fixed discount per line
  line_total: number;
}

export type SaleStatus = 'completed' | 'returned' | 'partially_returned' | 'voided';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'pending_cod';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'cod' | 'split';

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  sale_date: string;
  status: SaleStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  paid_amount: number;
  change_due: number;
  balance_due: number;
  payment_method: PaymentMethod;
  cashier_id?: number | null;
  cashier_name?: string | null;
  notes?: string | null;
  items_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  cost_price_snapshot: number;
  discount: number;
  line_total: number;
}

export interface SaleDetail extends Sale {
  items: SaleItem[];
  payments: Payment[];
  returns?: SalesReturn[];
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name?: string | null;
  invoice_reference?: string | null;
  purchase_date: string;
  status: 'draft' | 'confirmed' | 'received' | 'cancelled';
  subtotal: number;
  discount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_method: string;
  notes?: string | null;
  created_by?: number | null;
  creator_name?: string | null;
  items_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  received_quantity: number;
  unit_cost: number;
  discount: number;
  tax_rate: number;
  line_total: number;
}

export interface PurchaseDetail extends PurchaseOrder {
  items: PurchaseItem[];
}

export interface Payment {
  id: number;
  transaction_type: 'sale_payment' | 'purchase_payment' | 'customer_receipt' | 'supplier_payout' | 'refund';
  sale_id?: number | null;
  purchase_id?: number | null;
  customer_id?: number | null;
  customer_name?: string | null;
  supplier_id?: number | null;
  supplier_name?: string | null;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  payment_date: string;
  status: string;
  notes?: string | null;
  cashier_id?: number | null;
  created_at: string;
}

export interface SalesReturn {
  id: number;
  return_number: string;
  sale_id: number;
  invoice_number?: string;
  customer_id?: number | null;
  customer_name?: string | null;
  return_date: string;
  refund_amount: number;
  refund_method: string;
  reason: string;
  status: string;
  authorized_by?: number | null;
  authorizer_name?: string | null;
  created_at: string;
  items?: SalesReturnItem[];
}

export interface SalesReturnItem {
  id: number;
  return_id: number;
  sale_item_id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  refund_subtotal: number;
  restock_action: 'restock' | 'damaged' | 'scrap';
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  movement_type: 'sale' | 'purchase_receipt' | 'sale_return' | 'purchase_return' | 'adjustment_add' | 'adjustment_sub' | 'opening_stock' | 'damage';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string | null;
  reference_type?: string | null;
  reason?: string | null;
  created_by?: number | null;
  creator_name?: string | null;
  created_at: string;
}

export interface StockAdjustment {
  id: number;
  adjustment_number: string;
  product_id: number;
  product_name?: string;
  sku?: string;
  adjustment_type: 'physical_count' | 'damage' | 'loss' | 'correction';
  quantity: number;
  reason: string;
  authorized_by?: number | null;
  authorizer_name?: string | null;
  created_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Expense {
  id: number;
  expense_number: string;
  category_id?: number | null;
  category_name?: string | null;
  expense_date: string;
  amount: number;
  payment_method: string;
  payee?: string | null;
  reference?: string | null;
  notes?: string | null;
  created_by?: number | null;
  creator_name?: string | null;
  created_at: string;
}

export interface CashSession {
  id: number;
  user_id: number;
  user_name?: string;
  opened_at: string;
  closed_at?: string | null;
  opening_balance: number;
  closing_expected: number;
  closing_actual?: number | null;
  difference?: number | null;
  status: 'open' | 'closed';
  closing_notes?: string | null;
}

export interface CashMovement {
  id: number;
  session_id: number;
  movement_type: 'opening' | 'sale' | 'refund' | 'expense' | 'drop' | 'payout' | 'adjustment';
  amount: number;
  reason: string;
  reference_id?: string | null;
  created_by?: number | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  username?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details_json?: string | null;
  created_at: string;
}

export interface BackupLog {
  id: number;
  backup_path: string;
  backup_size: number;
  status: string;
  created_at: string;
}

// Financial Report Interfaces
export interface ProfitAndLossReport {
  gross_sales: number;
  sales_discounts: number;
  sales_returns: number;
  net_sales: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  gross_profit_margin: number;
  operating_expenses: number;
  net_operating_profit: number;
  net_profit_margin: number;
  start_date: string;
  end_date: string;
  cogs: number;
  discounts: number;
  returns: number;
  net_profit: number;
  gross_margin_pct: number;
  net_margin_pct: number;
}

export interface DashboardMetrics {
  sales_today: number;
  sales_this_month: number;
  net_sales_today: number;
  payments_collected_today: number;
  payments_outstanding: number;
  gross_profit_month: number;
  net_profit_month: number;
  total_inventory_quantity: number;
  inventory_valuation: number;
  low_stock_count: number;
  out_of_stock_count: number;
  operating_expenses_month: number;
  daily_sales: { date: string; sales: number; profit: number }[];
  category_breakdown: { name: string; value: number }[];
  top_products: { id: number; name: string; sku: string; sold_qty: number; revenue: number }[];
  low_stock_items: Product[];
  payment_method_breakdown: { method: string; total: number; count: number }[];
}

export interface AssistantAnswer {
  reply: string;
  suggestions?: string[];
  dataPreview?: any;
  actionRoute?: string;
}

export interface CustomerStatementTransaction {
  id: string;
  date: string;
  type: 'invoice' | 'payment' | 'return';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  running_balance: number;
}

export interface CustomerStatement {
  customer: Customer;
  start_date: string;
  end_date: string;
  opening_balance: number;
  total_invoiced: number;
  total_payments: number;
  total_returns: number;
  closing_balance: number;
  transactions: CustomerStatementTransaction[];
}

export interface PrinterDevice {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

declare global {
  interface Window {
    skythsAPI: any;
  }
}
