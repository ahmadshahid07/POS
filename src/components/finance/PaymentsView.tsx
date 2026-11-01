import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Payment } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { CreditCard, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const { businessSettings } = useAppStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const loadPayments = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const rows = await (window as any).skythsAPI.getPayments({ limit: 100 });
        setPayments(rows || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard size={20} /> Payments & Financial Transactions Ledger
          </h1>
          <p className="text-xs text-[#ACADB1]">
            Unified accounting ledger of customer receipts, supplier settlements, and authorized refunds.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          onClick={loadPayments}
        >
          Refresh
        </Button>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D4D8DF]">
            <thead className="bg-white/5 text-[#ACADB1] uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Transaction Nature</th>
                <th className="py-3 px-4">Party (Customer / Vendor)</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference / Slip #</th>
                <th className="py-3 px-4 text-right">Settled Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((p) => {
                const isInflow = p.transaction_type === 'sale_payment' || p.transaction_type === 'customer_receipt';
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#ACADB1]">
                      {p.payment_date.slice(0, 10)} {p.payment_date.slice(11, 16)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-white capitalize">
                        {p.transaction_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">
                      {p.customer_name || p.supplier_name || 'Counter Sale'}
                    </td>
                    <td className="py-3 px-4 font-mono uppercase text-[11px] text-[#ACADB1]">
                      {p.payment_method}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#706F70]">
                      {p.reference_number || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isInflow ? 'text-[#4ADE80]' : 'text-[#F87171]'
                        }`}
                      >
                        {isInflow ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {currencySymbol} {p.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="success" size="sm">
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {payments.length === 0 && !loading && (
            <div className="py-16 text-center text-xs text-[#706F70]">
              No payment transactions recorded yet.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
