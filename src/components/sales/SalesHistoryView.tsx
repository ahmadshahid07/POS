import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { SaleDetailModal } from './SaleDetailModal';
import { Sale, SaleDetail } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Receipt, Search, RefreshCw, Eye, Calendar, Printer } from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const { businessSettings, setActiveView } = useAppStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<SaleDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const loadSales = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const res = await (window as any).skythsAPI.getSalesHistory({
          search: search.trim() || undefined,
          paymentStatus: statusFilter || undefined,
          limit: 100,
        });
        setSales(res.sales || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [search, statusFilter]);

  const handleOpenDetail = async (saleId: number) => {
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const detail = await (window as any).skythsAPI.getSaleDetail(saleId);
        setSelectedSaleDetail(detail);
        setIsDetailOpen(true);
      }
    } catch (err: any) {
      alert(`Could not load transaction: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt size={20} /> Sales History & Invoice Archive
          </h1>
          <p className="text-xs text-[#ACADB1]">
            Permanent historical transaction records, receipts, and customer invoice audit logs.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          onClick={loadSales}
        >
          Refresh History
        </Button>
      </div>

      <GlassCard className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#706F70]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number, customer name..."
              className="w-full bg-[#0E0E0F] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#706F70] focus:outline-none focus:border-white/30"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0E0E0F] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
          >
            <option value="">All Payment Statuses</option>
            <option value="paid">Fully Settled (Paid)</option>
            <option value="partial">Partially Paid</option>
            <option value="unpaid">Unpaid Credit</option>
            <option value="pending_cod">Pending COD Collection</option>
          </select>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D4D8DF]">
            <thead className="bg-white/5 text-[#ACADB1] uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">{s.invoice_number}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#ACADB1]">
                    {s.sale_date.slice(0, 10)} {s.sale_date.slice(11, 16)}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{s.customer_name || 'Walk-in'}</td>
                  <td className="py-3 px-4 text-xs text-[#ACADB1]">{s.cashier_name || 'admin'}</td>
                  <td className="py-3 px-4 text-center font-mono">{s.items_count || 1}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {currencySymbol} {s.grand_total.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#4ADE80]">
                    {currencySymbol} {s.paid_amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span className={s.balance_due > 0 ? 'text-[#FBBF24] font-bold' : 'text-[#706F70]'}>
                      {currencySymbol} {s.balance_due.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={
                        s.status === 'completed'
                          ? 'success'
                          : s.status === 'returned'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {s.payment_status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Eye size={13} />}
                      onClick={() => handleOpenDetail(s.id)}
                    >
                      Inspect / Reprint
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sales.length === 0 && !loading && (
            <div className="py-16 text-center text-xs text-[#706F70]">
              No sales transactions recorded yet. Completed sales will appear here permanently.
            </div>
          )}
        </div>
      </GlassCard>

      <SaleDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        sale={selectedSaleDetail}
        businessSettings={businessSettings}
        onInitiateReturn={(sale) => {
          setActiveView('sales_returns');
        }}
      />
    </div>
  );
};
