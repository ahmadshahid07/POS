import fs from 'fs';
import path from 'path';
import { DBManager } from './connection';

export interface Migration {
  version: number;
  name: string;
  up: (db: any) => void;
}

export function runMigrations(schemaFilePath?: string): void {
  const db = DBManager.getDb();

  // Create migrations table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS database_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db.prepare('SELECT version FROM database_migrations ORDER BY version ASC').all();
  const appliedVersions = new Set(appliedRows.map((r: any) => r.version));

  // Migration 1: Base Schema
  if (!appliedVersions.has(1)) {
    const resolvedPath = schemaFilePath || path.join(__dirname, 'schema.sql');
    let sqlContent = '';
    if (fs.existsSync(resolvedPath)) {
      sqlContent = fs.readFileSync(resolvedPath, 'utf-8');
    } else {
      // Fallback relative to project root or dist
      const altPath = path.join(process.cwd(), 'electron', 'db', 'schema.sql');
      if (fs.existsSync(altPath)) {
        sqlContent = fs.readFileSync(altPath, 'utf-8');
      } else {
        throw new Error(`Schema file not found at ${resolvedPath} or ${altPath}`);
      }
    }

    db.exec(sqlContent);

    // Seed default roles if not present
    const existingRoles = db.prepare('SELECT COUNT(*) as count FROM roles').get();
    if (existingRoles.count === 0) {
      const now = new Date().toISOString();
      const insertRole = db.prepare('INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)');
      insertRole.run('admin', 'Full Administrator Access', JSON.stringify(['all']));
      insertRole.run('manager', 'Manager Operations & Reports', JSON.stringify([
        'pos', 'products_manage', 'inventory_manage', 'purchases_manage', 
        'sales_view', 'returns_manage', 'customers_manage', 'suppliers_manage', 
        'expenses_manage', 'cash_manage', 'reports_view'
      ]));
      insertRole.run('cashier', 'Cashier POS & Sales Processing', JSON.stringify([
        'pos', 'sales_view', 'customers_view'
      ]));
    }

    // Seed default product units
    const existingUnits = db.prepare('SELECT COUNT(*) as count FROM product_units').get();
    if (existingUnits.count === 0) {
      const insertUnit = db.prepare('INSERT INTO product_units (name, abbreviation) VALUES (?, ?)');
      insertUnit.run('Pieces', 'pcs');
      insertUnit.run('Kilograms', 'kg');
      insertUnit.run('Grams', 'g');
      insertUnit.run('Liters', 'L');
      insertUnit.run('Boxes', 'box');
      insertUnit.run('Packs', 'pk');
    }

    // Seed default categories
    const existingCats = db.prepare('SELECT COUNT(*) as count FROM product_categories').get();
    if (existingCats.count === 0) {
      const now = new Date().toISOString();
      const insertCat = db.prepare('INSERT INTO product_categories (name, code, description, created_at) VALUES (?, ?, ?, ?)');
      insertCat.run('General', 'GEN', 'General merchandise and products', now);
      insertCat.run('Groceries & Food', 'GROC', 'Food, staples, beverages, and household goods', now);
      insertCat.run('Electronics & Hardware', 'ELEC', 'Electronics, devices, parts, and accessories', now);
      insertCat.run('Clothing & Apparel', 'APPA', 'Garments, textiles, and fashion items', now);
    }

    // Seed default expense categories
    const existingExp = db.prepare('SELECT COUNT(*) as count FROM expense_categories').get();
    if (existingExp.count === 0) {
      const now = new Date().toISOString();
      const insertExp = db.prepare('INSERT INTO expense_categories (name, description, created_at) VALUES (?, ?, ?)');
      insertExp.run('Rent', 'Shop or warehouse rent', now);
      insertExp.run('Utilities & Electricity', 'Electricity, water, gas bills', now);
      insertExp.run('Salaries & Wages', 'Staff payroll and wages', now);
      insertExp.run('Internet & Phone', 'Communications and office connectivity', now);
      insertExp.run('Transport & Logistics', 'Shipping, freight, and travel', now);
      insertExp.run('Packaging & Supplies', 'Bags, boxes, tape, and printing paper', now);
      insertExp.run('Repairs & Maintenance', 'Store maintenance and repairs', now);
      insertExp.run('Other Operating Expense', 'Miscellaneous general business expense', now);
    }

    // Initialize invoice sequence
    const existingSeq = db.prepare('SELECT COUNT(*) as count FROM invoice_sequences WHERE prefix = ?').get('INV');
    if (existingSeq.count === 0) {
      db.prepare('INSERT INTO invoice_sequences (prefix, current_number, updated_at) VALUES (?, ?, ?)').run('INV', 1000, new Date().toISOString());
    }

    // Record migration 1
    db.prepare('INSERT INTO database_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
      1,
      'base_schema_v1',
      new Date().toISOString()
    );
  }

  // Migration 2: Column alignment for customer returns & purchase returns
  if (!appliedVersions.has(2)) {
    // 1. Ensure total_returns exists in customers
    const custCols = db.prepare('PRAGMA table_info(customers)').all();
    const hasTotalReturns = custCols.some((c: any) => c.name === 'total_returns');
    if (!hasTotalReturns) {
      db.exec('ALTER TABLE customers ADD COLUMN total_returns REAL NOT NULL DEFAULT 0.0;');
    }

    // 2. Ensure purchase_returns has purchase_order_id, total_amount, refund_method
    const prCols = db.prepare('PRAGMA table_info(purchase_returns)').all();
    const hasPurchaseOrderId = prCols.some((c: any) => c.name === 'purchase_order_id');
    if (!hasPurchaseOrderId) {
      db.exec('ALTER TABLE purchase_returns ADD COLUMN purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL;');
    }
    const hasTotalAmount = prCols.some((c: any) => c.name === 'total_amount');
    if (!hasTotalAmount) {
      db.exec('ALTER TABLE purchase_returns ADD COLUMN total_amount REAL NOT NULL DEFAULT 0.0;');
    }
    const hasRefundMethod = prCols.some((c: any) => c.name === 'refund_method');
    if (!hasRefundMethod) {
      db.exec("ALTER TABLE purchase_returns ADD COLUMN refund_method TEXT DEFAULT 'credit_adjustment';");
    }

    // 3. Ensure purchase_return_items has subtotal
    const priCols = db.prepare('PRAGMA table_info(purchase_return_items)').all();
    const hasSubtotal = priCols.some((c: any) => c.name === 'subtotal');
    if (!hasSubtotal) {
      db.exec('ALTER TABLE purchase_return_items ADD COLUMN subtotal REAL NOT NULL DEFAULT 0.0;');
    }

    db.prepare('INSERT INTO database_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
      2,
      'schema_alignment_v2',
      new Date().toISOString()
    );
  }
}
