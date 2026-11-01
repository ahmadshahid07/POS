import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { DashboardMetrics } from '../../types';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  Plus,
  ShoppingBag,
  Wallet,
  BarChart3,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { setActiveView, businessSettings } = useAppStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const data = await (window as any).skythsAPI.getDashboardMetrics();
        setMetrics(data);
      } else {
        // Fallback demo data for browser preview
        setMetrics({
          sales_today: 18500,
          sales_this_month: 245000,
          net_sales_today: 18000,
          payments_collected_today: 16500,
          payments_outstanding: 28000,
          gross_profit_month: 72000,
          net_profit_month: 51000,
          total_inventory_quantity: 840,
          inventory_valuation: 345000,
          low_stock_count: 3,
          out_of_stock_count: 1,
          operating_expenses_month: 21000,
          daily_sales: [
            { date: '10-20', sales: 12000, profit: 3200 },
            { date: '10-21', sales: 15400, profit: 4100 },
            { date: '10-22', sales: 14200, profit: 3800 },
            { date: '10-23', sales: 18900, profit: 5400 },
            { date: '10-24', sales: 22000, profit: 6200 },
            { date: '10-25', sales: 18500, profit: 4900 },
          ],
          category_breakdown: [
            { name: 'Groceries', value: 95000 },
            { name: 'Electronics', value: 78000 },
            { name: 'Apparel', value: 42000 },
            { name: 'General', value: 30000 },
          ],
          top_products: [
            { id: 1, name: 'Basmati Rice Premium 5KG', sku: 'RICE-01', sold_qty: 45, revenue: 9000 },
            { id: 2, name: 'Cooking Oil Pure 1L', sku: 'OIL-01', sold_qty: 38, revenue: 19000 },
            { id: 3, name: 'Organic Wheat Flour 10KG', sku: 'FLOUR-10', sold_qty: 24, revenue: 14400 },
          ],
          low_stock_items: [],
          payment_method_breakdown: [
            { method: 'cash', total: 140000, count: 85 },
            { method: 'easypaisa', total: 45000, count: 22 },
            { method: 'card', total: 60000, count: 18 },
          ],
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const COLORS = ['#FFFFFF', '#D4D8DF', '#ACADB1', '#706F70', '#353536'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Business Overview</h1>
          <p className="text-xs text-[#ACADB1]">
            Live operational figures and financial health calculated directly from local SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchMetrics}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<ShoppingCart size={14} />}
            onClick={() => setActiveView('pos')}
          >
            New Sale (F2)
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus size={14} />}
            onClick={() => setActiveView('products')}
          >
            Add Product
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<ShoppingBag size={14} />}
            onClick={() => setActiveView('purchases')}
          >
            Receive Stock
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Wallet size={14} />}
            onClick={() => setActiveView('expenses')}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* KPI Headline Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Sales Today */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#ACADB1] uppercase tracking-wider">Sales Today</span>
            <div className="p-2 rounded-lg bg-white/5 text-white">
              <Receipt size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {currencySymbol} {metrics?.sales_today.toLocaleString() || '0'}
            </span>
            <div className="text-[11px] text-[#4ADE80] mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Today's Completed Invoices
            </div>
          </div>
        </GlassCard>

        {/* Sales This Month */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#ACADB1] uppercase tracking-wider">Sales (Month)</span>
            <div className="p-2 rounded-lg bg-white/5 text-white">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {currencySymbol} {metrics?.sales_this_month.toLocaleString() || '0'}
            </span>
            <span className="text-[11px] text-[#ACADB1] block mt-1">Calendar Month Gross</span>
          </div>
        </GlassCard>

        {/* Net Profit This Month */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#ACADB1] uppercase tracking-wider">Net Profit (Month)</span>
            <div className="p-2 rounded-lg bg-[#16A34A]/10 text-[#4ADE80]">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-[#4ADE80]">
              {currencySymbol} {metrics?.net_profit_month.toLocaleString() || '0'}
            </span>
            <span className="text-[11px] text-[#ACADB1] block mt-1">Net Sales − COGS − Expenses</span>
          </div>
        </GlassCard>

        {/* Inventory Valuation */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#ACADB1] uppercase tracking-wider">Inventory Value</span>
            <div className="p-2 rounded-lg bg-white/5 text-white">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {currencySymbol} {metrics?.inventory_valuation.toLocaleString() || '0'}
            </span>
            <span className="text-[11px] text-[#ACADB1] block mt-1">
              {metrics?.total_inventory_quantity || 0} Units in Stock
            </span>
          </div>
        </GlassCard>

        {/* Payments Collected Today */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#ACADB1] uppercase tracking-wider">Collected Today</span>
            <span className="text-xs text-[#ACADB1]">Settled</span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono text-white">
              {currencySymbol} {metrics?.payments_collected_today.toLocaleString() || '0'}
            </span>
            <span className="text-[11px] text-[#ACADB1] block mt-1">Cash / Electronic Payments</span>
          </div>
        </GlassCard>

        {/* Outstanding Receivables */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#ACADB1] uppercase tracking-wider">Customer Receivables</span>
            <span className="text-xs text-[#FBBF24]">Credit Due</span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono text-[#FBBF24]">
              {currencySymbol} {metrics?.payments_outstanding.toLocaleString() || '0'}
            </span>
            <span className="text-[11px] text-[#ACADB1] block mt-1">Pending Customer Balances</span>
          </div>
        </GlassCard>

        {/* Operating Expenses Month */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#ACADB1] uppercase tracking-wider">Expenses (Month)</span>
            <span className="text-xs text-[#ACADB1]">Overhead</span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono text-white">
              {currencySymbol} {metrics?.operating_expenses_month.toLocaleString() || '0'}
            </span>
            <span className="text-[11px] text-[#ACADB1] block mt-1">Rent, Utilities, Supplies</span>
          </div>
        </GlassCard>

        {/* Stock Alerts */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#ACADB1] uppercase tracking-wider">Stock Alerts</span>
            <div className="p-1.5 rounded-lg bg-[#DC2626]/10 text-[#F87171]">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-[#F87171]">
              {metrics?.low_stock_count || 0}
            </span>
            <span className="text-xs text-[#ACADB1]">Low Stock</span>
            <span className="text-xs text-[#706F70]">|</span>
            <span className="text-xs font-mono text-white font-semibold">
              {metrics?.out_of_stock_count || 0}
            </span>
            <span className="text-xs text-[#ACADB1]">Out</span>
          </div>
        </GlassCard>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Trend Chart (2 columns) */}
        <GlassCard className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Sales & Revenue Trend</h3>
              <p className="text-[11px] text-[#ACADB1]">Past 14 days recorded volume</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<BarChart3 size={14} />}
              onClick={() => setActiveView('reports')}
            >
              Detailed Reports
            </Button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.daily_sales || []}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#706F70" fontSize={11} tickLine={false} />
                <YAxis stroke="#706F70" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141415',
                    borderColor: 'rgba(212, 216, 223, 0.15)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#EBEDF1',
                  }}
                  formatter={(val: any) => [`${currencySymbol} ${Number(val).toLocaleString()}`, 'Sales']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#EBEDF1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Category Revenue Breakdown Donut (1 column) */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Sales by Category</h3>
          <p className="text-[11px] text-[#ACADB1] mb-3">Volume distribution</p>

          <div className="h-48 w-full flex items-center justify-center">
            {metrics?.category_breakdown && metrics.category_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.category_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {metrics.category_breakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141415',
                      borderColor: 'rgba(212, 216, 223, 0.15)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`${currencySymbol} ${Number(val).toLocaleString()}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-[#706F70] text-center">No sales recorded yet.</div>
            )}
          </div>

          <div className="mt-2 space-y-1.5 text-xs">
            {metrics?.category_breakdown.slice(0, 4).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-[#D4D8DF]">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span>{cat.name}</span>
                </div>
                <span className="font-mono text-white">{currencySymbol} {cat.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Top Products & Low Stock Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Top Selling Products</h3>
            <span className="text-[11px] text-[#ACADB1]">By Units Sold</span>
          </div>

          <div className="divide-y divide-white/5">
            {metrics?.top_products && metrics.top_products.length > 0 ? (
              metrics.top_products.map((item, idx) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-mono font-bold text-[#706F70]">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-[10px] text-[#706F70] font-mono">{item.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-white">
                      {currencySymbol} {item.revenue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#ACADB1]">{item.sold_qty} units sold</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-[#706F70]">
                No completed sales yet. Use the POS to process your first invoice.
              </div>
            )}
          </div>
        </GlassCard>

        {/* Low Stock Alerts */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={15} className="text-[#F87171]" /> Critical Stock Alerts
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveView('purchases')}
            >
              Order Stock
            </Button>
          </div>

          <div className="divide-y divide-white/5">
            {metrics?.low_stock_items && metrics.low_stock_items.length > 0 ? (
              metrics.low_stock_items.map((prod) => (
                <div key={prod.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-white">{prod.name}</div>
                    <div className="text-[10px] text-[#706F70] font-mono">{prod.sku}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-mono font-bold text-[#F87171]">
                        {prod.current_stock}
                      </span>
                      <span className="text-[10px] text-[#706F70] block">Min: {prod.min_stock_threshold}</span>
                    </div>
                    <Badge variant={prod.current_stock <= 0 ? 'danger' : 'warning'} size="sm">
                      {prod.current_stock <= 0 ? 'Out' : 'Low'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-[#4ADE80]">
                ✓ All items currently above minimum stock thresholds.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
