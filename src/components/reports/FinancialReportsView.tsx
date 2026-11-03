import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ProfitAndLossReport, Product } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Layers,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

export const FinancialReportsView: React.FC = () => {
  const { businessSettings, addNotification } = useAppStore();
  const currency = businessSettings?.currency || '₨';

  // Date filters
  const [dateRangePreset, setDateRangePreset] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Tab
  const [activeTab, setActiveTab] = useState<'pnl' | 'inventory'>('pnl');

  const [pnl, setPnl] = useState<ProfitAndLossReport | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (window.skythsAPI) {
        // Fetch P&L
        const startIso = `${startDate}T00:00:00.000Z`;
        const endIso = `${endDate}T23:59:59.999Z`;
        const pnlRes = await window.skythsAPI.getPnLReport(startIso, endIso);
        setPnl(pnlRes);

        // Fetch Products for Inventory Valuation
        const prodRes = await window.skythsAPI.getProducts();
        setProducts(Array.isArray(prodRes) ? prodRes : (prodRes?.products || []));
      }
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      addNotification({ title: 'Report Error', message: err.message, type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handlePresetChange = (preset: 'today' | 'week' | 'month' | 'year' | 'custom') => {
    setDateRangePreset(preset);
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start = end;

    if (preset === 'today') {
      start = end;
    } else if (preset === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else if (preset === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      start = d.toISOString().split('T')[0];
    } else if (preset === 'year') {
      const d = new Date(now.getFullYear(), 0, 1);
      start = d.toISOString().split('T')[0];
    }

    if (preset !== 'custom') {
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleExportCSV = () => {
    if (!pnl) return;
    const csvRows = [
      ['SKYTHS Business Management — Financial Report'],
      [`Period: ${startDate} to ${endDate}`],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['FINANCIAL LINE ITEM', 'AMOUNT (' + currency + ')'],
      ['Gross Sales', pnl.gross_sales.toFixed(2)],
      ['Discounts', (-pnl.discounts).toFixed(2)],
      ['Customer Returns', (-pnl.returns).toFixed(2)],
      ['Net Sales Revenue', pnl.net_sales.toFixed(2)],
      ['Cost of Goods Sold (COGS)', (-pnl.cogs).toFixed(2)],
      ['Gross Profit', pnl.gross_profit.toFixed(2)],
      ['Gross Profit Margin (%)', pnl.gross_margin_pct.toFixed(2) + '%'],
      ['Operating Expenses', (-pnl.operating_expenses).toFixed(2)],
      ['Net Operating Profit', pnl.net_profit.toFixed(2)],
      ['Net Profit Margin (%)', pnl.net_margin_pct.toFixed(2) + '%'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((r) => r.join(',')).join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `financial_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Inventory valuation totals
  const totalStockQty = products.reduce((acc, p) => acc + (p.current_stock || 0), 0);
  const totalCostValuation = products.reduce((acc, p) => acc + (p.current_stock || 0) * (p.cost_price || 0), 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + (p.current_stock || 0) * (p.selling_price || 0), 0);
  const potentialGrossMargin = totalRetailValuation - totalCostValuation;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#353536] to-[#080808] border border-white/20">
              <BarChart3 className="text-white" size={20} />
            </div>
            Financial & Inventory Reports
          </h1>
          <p className="text-xs text-[#ACADB1] mt-0.5">
            Audit-ready Profit & Loss, Cost of Goods Sold, and live stock valuation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchReports}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={14} />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={14} />
            Print Report
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-4 border-white/10">
        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          {(['today', 'week', 'month', 'year', 'custom'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                dateRangePreset === preset
                  ? 'bg-white text-[#080808] shadow-glass-sm font-semibold'
                  : 'text-[#ACADB1] hover:text-white'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar size={15} className="text-[#ACADB1]" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setDateRangePreset('custom');
            }}
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-[#0E0E0F] text-white font-mono text-xs focus:outline-none focus:border-white/30"
          />
          <span className="text-[#706F70] font-mono">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setDateRangePreset('custom');
            }}
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-[#0E0E0F] text-white font-mono text-xs focus:outline-none focus:border-white/30"
          />
        </div>
      </GlassCard>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'pnl' ? 'bg-white text-[#080808] shadow-glass-sm' : 'text-[#ACADB1] hover:text-white hover:bg-white/5'
          }`}
        >
          <DollarSign size={14} />
          Profit & Loss Statement
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'inventory' ? 'bg-white text-[#080808] shadow-glass-sm' : 'text-[#ACADB1] hover:text-white hover:bg-white/5'
          }`}
        >
          <Package size={14} />
          Inventory Valuation
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-[#706F70]">Calculating financial figures...</div>
      ) : activeTab === 'pnl' && pnl ? (
        /* TAB 1: PROFIT & LOSS STATEMENT */
        <div className="space-y-6">
          {/* Headline Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="p-4 border-white/10">
              <span className="text-[11px] font-medium text-[#ACADB1] uppercase font-mono">Net Sales Revenue</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {currency} {pnl.net_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Gross − Discounts − Returns</span>
            </GlassCard>

            <GlassCard className="p-4 border-white/10">
              <span className="text-[11px] font-medium text-[#ACADB1] uppercase font-mono">Cost of Goods Sold (COGS)</span>
              <div className="text-xl font-bold font-mono text-[#D4D8DF] mt-1">
                {currency} {pnl.cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Inventory acquisition costs</span>
            </GlassCard>

            <GlassCard className="p-4 border-white/10">
              <span className="text-[11px] font-medium text-[#ACADB1] flex items-center justify-between uppercase font-mono">
                <span>Gross Profit</span>
                <span className="font-mono text-emerald-400 text-[10px] font-bold">{pnl.gross_margin_pct.toFixed(1)}%</span>
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {currency} {pnl.gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Net Sales − COGS</span>
            </GlassCard>

            <GlassCard className="p-4 border-white/10">
              <span className="text-[11px] font-medium text-[#ACADB1] flex items-center justify-between uppercase font-mono">
                <span>Net Operating Profit</span>
                <span className={`font-mono text-[10px] font-bold ${pnl.net_profit >= 0 ? 'text-emerald-400' : 'text-[#F87171]'}`}>
                  {pnl.net_margin_pct.toFixed(1)}%
                </span>
              </span>
              <div className={`text-xl font-bold font-mono mt-1 ${pnl.net_profit >= 0 ? 'text-emerald-400' : 'text-[#F87171]'}`}>
                {currency} {pnl.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Gross Profit − Expenses</span>
            </GlassCard>
          </div>

          {/* Detailed Statement Table */}
          <GlassCard className="overflow-hidden border-white/10">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Statement of Financial Performance</h3>
                <p className="text-[11px] text-[#ACADB1]">Traceable financial summary for {startDate} through {endDate}</p>
              </div>
              <Badge variant="outline">Verified Formula</Badge>
            </div>

            <div className="divide-y divide-white/5 text-xs font-sans">
              {/* Revenue Section */}
              <div className="p-3 bg-white/[0.02] font-semibold text-white uppercase text-[10px] tracking-wider font-mono">
                1. Revenue & Sales
              </div>
              <div className="px-6 py-2.5 flex justify-between">
                <span className="text-[#D4D8DF]">Gross Sales Revenue</span>
                <span className="font-mono text-white font-medium">{currency} {pnl.gross_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="px-6 py-2.5 flex justify-between text-[#ACADB1]">
                <span>Less: Sales Discounts</span>
                <span className="font-mono text-amber-400">- {currency} {pnl.discounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="px-6 py-2.5 flex justify-between text-[#ACADB1]">
                <span>Less: Customer Returns & Refunds</span>
                <span className="font-mono text-amber-400">- {currency} {pnl.returns.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="px-6 py-3 flex justify-between bg-white/[0.04] font-bold border-t border-white/10">
                <span className="text-white">Net Sales Revenue</span>
                <span className="font-mono text-white">{currency} {pnl.net_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              {/* COGS Section */}
              <div className="p-3 bg-white/[0.02] font-semibold text-white uppercase text-[10px] tracking-wider font-mono">
                2. Cost of Goods Sold
              </div>
              <div className="px-6 py-2.5 flex justify-between">
                <span className="text-[#D4D8DF]">Product Acquisition Cost (COGS)</span>
                <span className="font-mono text-[#ACADB1]">- {currency} {pnl.cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="px-6 py-3 flex justify-between bg-emerald-500/10 font-bold border-t border-white/10">
                <span className="text-emerald-400">Gross Profit (Margin: {pnl.gross_margin_pct.toFixed(2)}%)</span>
                <span className="font-mono text-emerald-400">{currency} {pnl.gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Operating Expenses Section */}
              <div className="p-3 bg-white/[0.02] font-semibold text-white uppercase text-[10px] tracking-wider font-mono">
                3. Operating Expenses
              </div>
              <div className="px-6 py-2.5 flex justify-between">
                <span className="text-[#D4D8DF]">Total Business Operating Expenses</span>
                <span className="font-mono text-[#F87171]">- {currency} {pnl.operating_expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Net Profit Final */}
              <div className={`px-6 py-4 flex justify-between font-bold text-sm border-t-2 border-white/20 ${
                pnl.net_profit >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-[#F87171]'
              }`}>
                <span>Net Operating Profit (Margin: {pnl.net_margin_pct.toFixed(2)}%)</span>
                <span className="font-mono">{currency} {pnl.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : activeTab === 'inventory' ? (
        /* TAB 2: INVENTORY VALUATION */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="p-4 border-white/10">
              <span className="text-[11px] font-medium text-[#ACADB1] uppercase font-mono">Total Units in Stock</span>
              <div className="text-xl font-bold font-mono text-white mt-1">{totalStockQty.toLocaleString()} units</div>
              <span className="text-[10px] text-[#706F70]">Across {products.length} products</span>
            </GlassCard>

            <GlassCard className="p-4 border-white/10">
              <span className="text-[11px] font-medium text-[#ACADB1] uppercase font-mono">Inventory Cost Value</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {currency} {totalCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Sum of (Stock × Cost Price)</span>
            </GlassCard>

            <GlassCard className="p-4 border-white/10">
              <span className="text-[11px] font-medium text-[#ACADB1] uppercase font-mono">Inventory Retail Value</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {currency} {totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Sum of (Stock × Selling Price)</span>
            </GlassCard>

            <GlassCard className="p-4 border-white/10">
              <span className="text-[11px] font-medium text-emerald-400 uppercase font-mono">Potential Gross Margin</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {currency} {potentialGrossMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Projected profit when sold</span>
            </GlassCard>
          </div>

          <GlassCard className="overflow-hidden border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product-Wise Valuation Ledger</h3>
                <p className="text-[11px] text-[#ACADB1]">Live valuation calculated using active unit purchase costs</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-wider text-[#ACADB1]">
                    <th className="py-2.5 px-4">Product Name</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4 text-right">Available Stock</th>
                    <th className="py-2.5 px-4 text-right">Cost Price</th>
                    <th className="py-2.5 px-4 text-right">Selling Price</th>
                    <th className="py-2.5 px-4 text-right">Total Cost Value</th>
                    <th className="py-2.5 px-4 text-right">Total Retail Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((p) => {
                    const costVal = p.current_stock * p.cost_price;
                    const retailVal = p.current_stock * p.selling_price;
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2 px-4 font-medium text-white">{p.name}</td>
                        <td className="py-2 px-4 font-mono text-[#ACADB1]">{p.sku}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold">
                          {p.current_stock <= (p.min_stock_threshold || 5) ? (
                            <span className="text-amber-400">{p.current_stock}</span>
                          ) : (
                            <span className="text-white">{p.current_stock}</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-[#ACADB1]">{currency} {p.cost_price.toLocaleString()}</td>
                        <td className="py-2 px-4 text-right font-mono text-white">{currency} {p.selling_price.toLocaleString()}</td>
                        <td className="py-2 px-4 text-right font-mono font-medium text-[#D4D8DF]">
                          {currency} {costVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-semibold text-white">
                          {currency} {retailVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
};
