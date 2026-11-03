import { DBManager } from '../db/connection';
import { ProfitAndLossReport, DashboardMetrics, Product } from '../../src/types';

export class ReportService {
  static getProfitAndLoss(startDate: string, endDate: string): ProfitAndLossReport {
    const db = DBManager.getDb();

    // 1. Gross sales, discounts from completed sales in the period
    const salesAgg = db.prepare(`
      SELECT 
        COALESCE(SUM(subtotal), 0) as gross_sales,
        COALESCE(SUM(discount_amount), 0) as sales_discounts
      FROM sales 
      WHERE status != 'voided'
        AND date(sale_date) >= date(?) 
        AND date(sale_date) <= date(?)
    `).get(startDate, endDate);

    // 2. Sales returns refunded in the period
    const returnsAgg = db.prepare(`
      SELECT COALESCE(SUM(refund_amount), 0) as sales_returns
      FROM sales_returns
      WHERE date(return_date) >= date(?)
        AND date(return_date) <= date(?)
    `).get(startDate, endDate);

    const grossSales = Number(salesAgg.gross_sales || 0);
    const discounts = Number(salesAgg.sales_discounts || 0);
    const returns = Number(returnsAgg.sales_returns || 0);

    // Net Sales = Gross Sales - Discounts - Returns
    const netSales = Math.max(0, Math.round((grossSales - discounts - returns) * 100) / 100);

    // 3. Cost of Goods Sold (COGS) based on historical cost snapshots on sale items
    const cogsAgg = db.prepare(`
      SELECT 
        COALESCE(SUM(si.quantity * si.cost_price_snapshot), 0) as total_cogs
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status != 'voided'
        AND date(s.sale_date) >= date(?)
        AND date(s.sale_date) <= date(?)
    `).get(startDate, endDate);

    // Returned items COGS reversal (for items restocked)
    const returnCogsAgg = db.prepare(`
      SELECT 
        COALESCE(SUM(sri.quantity * sri.cost_price), 0) as returned_cogs
      FROM sales_return_items sri
      JOIN sales_returns sr ON sri.return_id = sr.id
      WHERE sri.restock_action = 'restock'
        AND date(sr.return_date) >= date(?)
        AND date(sr.return_date) <= date(?)
    `).get(startDate, endDate);

    const rawCogs = Number(cogsAgg.total_cogs || 0);
    const returnedCogs = Number(returnCogsAgg.returned_cogs || 0);
    const cogs = Math.max(0, Math.round((rawCogs - returnedCogs) * 100) / 100);

    // Gross Profit = Net Sales - COGS
    const grossProfit = Math.round((netSales - cogs) * 100) / 100;
    const grossProfitMargin = netSales > 0 ? Math.round((grossProfit / netSales) * 10000) / 100 : 0;

    // 4. Operating Expenses
    const expensesAgg = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
      WHERE date(expense_date) >= date(?)
        AND date(expense_date) <= date(?)
    `).get(startDate, endDate);

    const operatingExpenses = Math.round(Number(expensesAgg.total_expenses || 0) * 100) / 100;

    // Net Operating Profit = Gross Profit - Operating Expenses
    const netProfit = Math.round((grossProfit - operatingExpenses) * 100) / 100;
    const netProfitMargin = netSales > 0 ? Math.round((netProfit / netSales) * 10000) / 100 : 0;

    return {
      gross_sales: grossSales,
      sales_discounts: discounts,
      sales_returns: returns,
      net_sales: netSales,
      cost_of_goods_sold: cogs,
      gross_profit: grossProfit,
      gross_profit_margin: grossProfitMargin,
      operating_expenses: operatingExpenses,
      net_operating_profit: netProfit,
      net_profit_margin: netProfitMargin,
      start_date: startDate,
      end_date: endDate,
      cogs,
      discounts,
      returns,
      net_profit: netProfit,
      gross_margin_pct: grossProfitMargin,
      net_margin_pct: netProfitMargin
    };
  }

  static getDashboardMetrics(): DashboardMetrics {
    const db = DBManager.getDb();
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = today.slice(0, 7) + '-01';

    // Sales Today
    const todaySalesRow = db.prepare(`
      SELECT 
        COALESCE(SUM(grand_total), 0) as total,
        COALESCE(SUM(subtotal - discount_amount), 0) as net
      FROM sales 
      WHERE status != 'voided' AND date(sale_date) = date(?)
    `).get(today);

    // Sales This Month
    const monthSalesRow = db.prepare(`
      SELECT COALESCE(SUM(grand_total), 0) as total
      FROM sales 
      WHERE status != 'voided' AND date(sale_date) >= date(?)
    `).get(firstDayOfMonth);

    // Payments Collected Today
    const todayPayRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE transaction_type IN ('sale_payment', 'customer_receipt')
        AND date(payment_date) = date(?)
    `).get(today);

    // Total Outstanding Receivables
    const outstandingRow = db.prepare(`
      SELECT COALESCE(SUM(balance_receivable), 0) as total
      FROM customers
    `).get();

    // Inventory totals
    const invRow = db.prepare(`
      SELECT 
        COALESCE(SUM(current_stock), 0) as total_qty,
        COALESCE(SUM(current_stock * cost_price), 0) as total_valuation,
        SUM(CASE WHEN current_stock <= min_stock_threshold AND current_stock > 0 THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock
      FROM products
      WHERE status = 'active'
    `).get();

    // Expenses This Month
    const monthExpRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date(expense_date) >= date(?)
    `).get(firstDayOfMonth);

    // Monthly Profit & Loss for Gross & Net Profit this month
    const pnlMonth = this.getProfitAndLoss(firstDayOfMonth, today);

    // Daily Sales & Exact Profit Trend (past 14 days)
    const dailySalesRows = db.prepare(`
      SELECT 
        date(s.sale_date) as d,
        COALESCE(SUM(s.grand_total), 0) as sales,
        COALESCE(SUM((s.subtotal - s.discount_amount) - COALESCE(items.cogs, 0)), 0) as profit
      FROM sales s
      LEFT JOIN (
        SELECT sale_id, SUM(quantity * cost_price_snapshot) as cogs
        FROM sale_items
        GROUP BY sale_id
      ) items ON items.sale_id = s.id
      WHERE s.status != 'voided' AND date(s.sale_date) >= date('now', '-14 days')
      GROUP BY date(s.sale_date)
      ORDER BY date(s.sale_date) ASC
    `).all();

    const dailySales = dailySalesRows.map((r: any) => ({
      date: r.d,
      sales: Math.round(Number(r.sales || 0) * 100) / 100,
      profit: Math.round(Number(r.profit || 0) * 100) / 100
    }));

    // Category Breakdown
    const catRows = db.prepare(`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as name,
        COALESCE(SUM(si.line_total), 0) as value
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      LEFT JOIN product_categories c ON p.category_id = c.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status != 'voided'
      GROUP BY c.id
      ORDER BY value DESC
      LIMIT 6
    `).all();

    // Top Selling Products
    const topProdRows = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(SUM(si.quantity), 0) as sold_qty,
        COALESCE(SUM(si.line_total), 0) as revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status != 'voided'
      GROUP BY p.id
      ORDER BY sold_qty DESC
      LIMIT 5
    `).all();

    // Low stock items list
    const lowStockItems = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.status = 'active' AND p.current_stock <= p.min_stock_threshold
      ORDER BY p.current_stock ASC
      LIMIT 5
    `).all();

    // Payment method breakdown
    const payMethodRows = db.prepare(`
      SELECT 
        payment_method as method,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM payments
      WHERE transaction_type IN ('sale_payment', 'customer_receipt')
      GROUP BY payment_method
    `).all();

    return {
      sales_today: Number(todaySalesRow.total || 0),
      sales_this_month: Number(monthSalesRow.total || 0),
      net_sales_today: Number(todaySalesRow.net || 0),
      payments_collected_today: Number(todayPayRow.total || 0),
      payments_outstanding: Number(outstandingRow.total || 0),
      gross_profit_month: pnlMonth.gross_profit,
      net_profit_month: pnlMonth.net_operating_profit,
      total_inventory_quantity: Number(invRow.total_qty || 0),
      inventory_valuation: Math.round(Number(invRow.total_valuation || 0) * 100) / 100,
      low_stock_count: Number(invRow.low_stock || 0),
      out_of_stock_count: Number(invRow.out_of_stock || 0),
      operating_expenses_month: Number(monthExpRow.total || 0),
      daily_sales: dailySales,
      category_breakdown: catRows,
      top_products: topProdRows,
      low_stock_items: lowStockItems as Product[],
      payment_method_breakdown: payMethodRows
    };
  }
}
