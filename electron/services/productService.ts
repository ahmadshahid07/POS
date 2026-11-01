import { DBManager } from '../db/connection';
import { Product, ProductCategory, ProductUnit, StockMovement, StockAdjustment } from '../../src/types';

export class ProductService {
  static getAllProducts(options?: {
    search?: string;
    categoryId?: number;
    status?: string;
    lowStockOnly?: boolean;
    limit?: number;
    offset?: number;
  }): { products: Product[]; total: number } {
    const db = DBManager.getDb();
    let whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (options?.search) {
      const q = `%${options.search.trim()}%`;
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.brand LIKE ?)');
      params.push(q, q, q, q);
    }

    if (options?.categoryId) {
      whereClauses.push('p.category_id = ?');
      params.push(options.categoryId);
    }

    if (options?.status) {
      whereClauses.push('p.status = ?');
      params.push(options.status);
    }

    if (options?.lowStockOnly) {
      whereClauses.push('p.current_stock <= p.min_stock_threshold');
    }

    const where = whereClauses.join(' AND ');

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM products p WHERE ${where}`).get(...params);
    const total = countRow ? countRow.total : 0;

    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation,
        s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_units u ON p.unit_id = u.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE ${where}
      ORDER BY p.name ASC
    `;

    if (options?.limit) {
      query += ` LIMIT ${options.limit} OFFSET ${options.offset || 0}`;
    }

    const rows = db.prepare(query).all(...params);
    return {
      products: rows.map(this.mapProduct),
      total
    };
  }

  static getProductById(id: number): Product | null {
    const db = DBManager.getDb();
    const row = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation,
        s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_units u ON p.unit_id = u.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `).get(id);

    return row ? this.mapProduct(row) : null;
  }

  static getProductByBarcodeOrSku(code: string): Product | null {
    const db = DBManager.getDb();
    const cleanCode = code.trim();
    const row = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation,
        s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_units u ON p.unit_id = u.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.barcode = ? OR p.sku = ? COLLATE NOCASE
      LIMIT 1
    `).get(cleanCode, cleanCode);

    return row ? this.mapProduct(row) : null;
  }

  static createProduct(productData: Partial<Product>, userId?: number): Product {
    const db = DBManager.getDb();
    const now = new Date().toISOString();

    if (!productData.name || !productData.sku) {
      throw new Error('Product name and SKU are required.');
    }

    const existingSku = db.prepare('SELECT id FROM products WHERE sku = ? COLLATE NOCASE').get(productData.sku.trim());
    if (existingSku) {
      throw new Error(`SKU '${productData.sku}' already exists.`);
    }

    if (productData.barcode) {
      const existingBarcode = db.prepare('SELECT id FROM products WHERE barcode = ?').get(productData.barcode.trim());
      if (existingBarcode) {
        throw new Error(`Barcode '${productData.barcode}' is already assigned to another product.`);
      }
    }

    return db.transaction(() => {
      const initialStock = Number(productData.current_stock || 0);

      const stmt = db.prepare(`
        INSERT INTO products (
          name, sku, barcode, category_id, brand, description, image_url,
          cost_price, selling_price, wholesale_price, min_selling_price,
          current_stock, min_stock_threshold, unit_id, supplier_id, tax_rate,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        productData.name!.trim(),
        productData.sku!.trim().toUpperCase(),
        productData.barcode ? productData.barcode.trim() : null,
        productData.category_id || null,
        productData.brand ? productData.brand.trim() : null,
        productData.description ? productData.description.trim() : null,
        productData.image_url || null,
        Number(productData.cost_price || 0),
        Number(productData.selling_price || 0),
        productData.wholesale_price ? Number(productData.wholesale_price) : null,
        productData.min_selling_price ? Number(productData.min_selling_price) : null,
        initialStock,
        Number(productData.min_stock_threshold || 5),
        productData.unit_id || null,
        productData.supplier_id || null,
        Number(productData.tax_rate || 0),
        productData.status || 'active',
        now,
        now
      );

      const productId = Number(result.lastInsertRowid);

      // If initial stock provided, log opening stock movement
      if (initialStock > 0) {
        db.prepare(`
          INSERT INTO stock_movements (
            product_id, movement_type, quantity, previous_stock, new_stock,
            reference_id, reference_type, reason, created_by, created_at
          ) VALUES (?, 'opening_stock', ?, 0, ?, 'INITIAL', 'opening_stock', 'Initial Opening Stock Entry', ?, ?)
        `).run(productId, initialStock, initialStock, userId || null, now);
      }

      return this.getProductById(productId)!;
    })();
  }

  static updateProduct(id: number, data: Partial<Product>, userId?: number): Product {
    const db = DBManager.getDb();
    const current = this.getProductById(id);
    if (!current) {
      throw new Error(`Product with ID ${id} not found.`);
    }

    if (data.sku && data.sku.trim().toUpperCase() !== current.sku) {
      const existingSku = db.prepare('SELECT id FROM products WHERE sku = ? COLLATE NOCASE AND id != ?').get(data.sku.trim(), id);
      if (existingSku) {
        throw new Error(`SKU '${data.sku}' already exists.`);
      }
    }

    if (data.barcode && data.barcode.trim() !== current.barcode) {
      const existingBarcode = db.prepare('SELECT id FROM products WHERE barcode = ? AND id != ?').get(data.barcode.trim(), id);
      if (existingBarcode) {
        throw new Error(`Barcode '${data.barcode}' is already in use.`);
      }
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE products SET
        name = ?,
        sku = ?,
        barcode = ?,
        category_id = ?,
        brand = ?,
        description = ?,
        image_url = ?,
        cost_price = ?,
        selling_price = ?,
        wholesale_price = ?,
        min_selling_price = ?,
        min_stock_threshold = ?,
        unit_id = ?,
        supplier_id = ?,
        tax_rate = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      data.name !== undefined ? data.name.trim() : current.name,
      data.sku !== undefined ? data.sku.trim().toUpperCase() : current.sku,
      data.barcode !== undefined ? (data.barcode ? data.barcode.trim() : null) : current.barcode,
      data.category_id !== undefined ? data.category_id : current.category_id,
      data.brand !== undefined ? (data.brand ? data.brand.trim() : null) : current.brand,
      data.description !== undefined ? data.description : current.description,
      data.image_url !== undefined ? data.image_url : current.image_url,
      data.cost_price !== undefined ? Number(data.cost_price) : current.cost_price,
      data.selling_price !== undefined ? Number(data.selling_price) : current.selling_price,
      data.wholesale_price !== undefined ? (data.wholesale_price ? Number(data.wholesale_price) : null) : current.wholesale_price,
      data.min_selling_price !== undefined ? (data.min_selling_price ? Number(data.min_selling_price) : null) : current.min_selling_price,
      data.min_stock_threshold !== undefined ? Number(data.min_stock_threshold) : current.min_stock_threshold,
      data.unit_id !== undefined ? data.unit_id : current.unit_id,
      data.supplier_id !== undefined ? data.supplier_id : current.supplier_id,
      data.tax_rate !== undefined ? Number(data.tax_rate) : current.tax_rate,
      data.status !== undefined ? data.status : current.status,
      now,
      id
    );

    return this.getProductById(id)!;
  }

  static adjustStock(params: {
    productId: number;
    newQuantity: number;
    reason: string;
    adjustmentType: 'physical_count' | 'damage' | 'loss' | 'correction';
    userId?: number;
  }): { product: Product; movement: StockMovement } {
    const db = DBManager.getDb();
    const product = this.getProductById(params.productId);
    if (!product) {
      throw new Error(`Product ${params.productId} not found.`);
    }

    const previousStock = product.current_stock;
    const targetStock = Number(params.newQuantity);
    const diff = targetStock - previousStock;

    if (diff === 0) {
      throw new Error('Stock adjustment quantity matches current stock. No change needed.');
    }

    const now = new Date().toISOString();

    return db.transaction(() => {
      // 1. Update product stock
      db.prepare('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?')
        .run(targetStock, now, product.id);

      // 2. Insert stock adjustment record
      const adjNum = `ADJ-${Date.now().toString().slice(-6)}`;
      db.prepare(`
        INSERT INTO stock_adjustments (adjustment_number, product_id, adjustment_type, quantity, reason, authorized_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(adjNum, product.id, params.adjustmentType, Math.abs(diff), params.reason, params.userId || null, now);

      // 3. Insert stock movement record
      const movementType = diff > 0 ? 'adjustment_add' : 'adjustment_sub';
      const moveRes = db.prepare(`
        INSERT INTO stock_movements (product_id, movement_type, quantity, previous_stock, new_stock, reference_id, reference_type, reason, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'adjustments', ?, ?, ?)
      `).run(product.id, movementType, diff, previousStock, targetStock, adjNum, params.reason, params.userId || null, now);

      const updated = this.getProductById(product.id)!;
      const movement: StockMovement = {
        id: Number(moveRes.lastInsertRowid),
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        movement_type: movementType,
        quantity: diff,
        previous_stock: previousStock,
        new_stock: targetStock,
        reference_id: adjNum,
        reference_type: 'adjustments',
        reason: params.reason,
        created_at: now
      };

      return { product: updated, movement };
    })();
  }

  static getStockMovements(options?: { productId?: number; limit?: number; offset?: number }): StockMovement[] {
    const db = DBManager.getDb();
    let query = `
      SELECT 
        sm.*,
        p.name as product_name,
        p.sku as sku,
        u.username as creator_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
    `;
    const params: any[] = [];
    if (options?.productId) {
      query += ' WHERE sm.product_id = ?';
      params.push(options.productId);
    }
    query += ' ORDER BY sm.created_at DESC';
    if (options?.limit) {
      query += ` LIMIT ${options.limit} OFFSET ${options.offset || 0}`;
    }

    const rows = db.prepare(query).all(...params);
    return rows.map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name,
      sku: r.sku,
      movement_type: r.movement_type,
      quantity: r.quantity,
      previous_stock: r.previous_stock,
      new_stock: r.new_stock,
      reference_id: r.reference_id,
      reference_type: r.reference_type,
      reason: r.reason,
      created_by: r.created_by,
      creator_name: r.creator_name,
      created_at: r.created_at
    }));
  }

  // Categories
  static getCategories(): ProductCategory[] {
    const db = DBManager.getDb();
    const rows = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM product_categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      created_at: r.created_at,
      product_count: r.product_count || 0
    }));
  }

  static createCategory(name: string, code?: string, description?: string): ProductCategory {
    const db = DBManager.getDb();
    const now = new Date().toISOString();
    const res = db.prepare('INSERT INTO product_categories (name, code, description, created_at) VALUES (?, ?, ?, ?)')
      .run(name.trim(), code ? code.trim() : null, description ? description.trim() : null, now);

    return {
      id: Number(res.lastInsertRowid),
      name: name.trim(),
      code: code || null,
      description: description || null,
      created_at: now,
      product_count: 0
    };
  }

  // Units
  static getUnits(): ProductUnit[] {
    const db = DBManager.getDb();
    return db.prepare('SELECT * FROM product_units ORDER BY name ASC').all();
  }

  // Helper
  private static mapProduct(r: any): Product {
    return {
      id: r.id,
      name: r.name,
      sku: r.sku,
      barcode: r.barcode,
      category_id: r.category_id,
      category_name: r.category_name,
      brand: r.brand,
      description: r.description,
      image_url: r.image_url,
      cost_price: r.cost_price,
      selling_price: r.selling_price,
      wholesale_price: r.wholesale_price,
      min_selling_price: r.min_selling_price,
      current_stock: r.current_stock,
      min_stock_threshold: r.min_stock_threshold,
      unit_id: r.unit_id,
      unit_name: r.unit_name,
      unit_abbreviation: r.unit_abbreviation,
      supplier_id: r.supplier_id,
      supplier_name: r.supplier_name,
      tax_rate: r.tax_rate,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at
    };
  }
}
