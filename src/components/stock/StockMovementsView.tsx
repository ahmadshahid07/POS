import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { StockMovement } from '../../types';
import { ArrowLeftRight, RefreshCw, Search, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const StockMovementsView: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadMovements = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const rows = await (window as any).skythsAPI.getStockMovements({ limit: 100 });
        setMovements(rows || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const filtered = movements.filter((m) => {
    const matchesSearch =
      !search.trim() ||
      m.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.sku?.toLowerCase().includes(search.toLowerCase()) ||
      m.reference_id?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || m.movement_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ArrowLeftRight size={20} /> Stock Movements Ledger
          </h1>
          <p className="text-xs text-[#ACADB1]">
            Comprehensive transactional record of all inventory additions, deductions, sales, and corrections.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          onClick={loadMovements}
        >
          Refresh Ledger
        </Button>
      </div>

      <GlassCard className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#706F70]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, SKU, invoice or PO#..."
              className="w-full bg-[#0E0E0F] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#706F70] focus:outline-none focus:border-white/30"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#0E0E0F] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
          >
            <option value="">All Movement Types</option>
            <option value="sale">Sales Checkouts</option>
            <option value="purchase_receipt">Supplier Purchase Receipts</option>
            <option value="sale_return">Customer Returns</option>
            <option value="adjustment_add">Audit Quantity Addition (+)</option>
            <option value="adjustment_sub">Audit Quantity Deduction (-)</option>
            <option value="opening_stock">Opening Initial Stock</option>
          </select>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D4D8DF]">
            <thead className="bg-white/5 text-[#ACADB1] uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4 text-center">Movement Type</th>
                <th className="py-3 px-4 text-center">Change Qty</th>
                <th className="py-3 px-4 text-center">Stock Before → After</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((m) => {
                const isPositive = m.quantity > 0;
                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#ACADB1]">
                      {m.created_at.slice(0, 10)} {m.created_at.slice(11, 16)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{m.product_name}</div>
                      <div className="text-[10px] text-[#706F70] font-mono">{m.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          m.movement_type === 'purchase_receipt' || m.movement_type === 'sale_return'
                            ? 'success'
                            : m.movement_type === 'sale'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {m.movement_type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          isPositive ? 'text-[#4ADE80]' : 'text-[#F87171]'
                        }`}
                      >
                        {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[11px]">
                      <span className="text-[#ACADB1]">{m.previous_stock}</span>
                      <span className="text-[#706F70] mx-1.5">→</span>
                      <span className="font-bold text-white">{m.new_stock}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-white">
                      {m.reference_id || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#ACADB1]">
                      {m.reason || 'Standard operation'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && !loading && (
            <div className="py-16 text-center text-xs text-[#706F70]">
              No stock movements found.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
