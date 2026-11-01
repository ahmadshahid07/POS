import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { SalesReturn, Sale, SaleDetail } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Undo2, Plus, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const SalesReturnsView: React.FC = () => {
  const { businessSettings, user } = useAppStore();
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Return Form State
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [searchedSale, setSearchedSale] = useState<SaleDetail | null>(null);
  const [returnItems, setReturnItems] = useState<{
    saleItemId: number;
    productId: number;
    productName: string;
    maxQty: number;
    quantity: number;
    unitPrice: number;
    restockAction: 'restock' | 'damaged' | 'scrap';
  }[]>([]);
  const [reason, setReason] = useState('Customer exchange / return');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const loadReturns = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const rows = await (window as any).skythsAPI.getSalesReturns();
        setReturns(rows || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const handleSearchSale = async () => {
    setError(null);
    setSearchedSale(null);
    if (!invoiceQuery.trim()) return;

    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const historyRes = await (window as any).skythsAPI.getSalesHistory({ search: invoiceQuery.trim(), limit: 1 });
        if (historyRes.sales && historyRes.sales.length > 0) {
          const detail = await (window as any).skythsAPI.getSaleDetail(historyRes.sales[0].id);
          setSearchedSale(detail);
          setReturnItems(
            detail.items.map((i: any) => ({
              saleItemId: i.id,
              productId: i.product_id,
              productName: i.product_name,
              maxQty: i.quantity,
              quantity: 0,
              unitPrice: i.unit_price,
              restockAction: 'restock',
            }))
          );
        } else {
          setError(`Invoice '${invoiceQuery}' not found.`);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totalRefund = returnItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedSale) return;
    setError(null);

    const activeItems = returnItems.filter((i) => i.quantity > 0);
    if (activeItems.length === 0) {
      setError('Please specify a return quantity of at least 1 item.');
      return;
    }

    setSubmitting(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        await (window as any).skythsAPI.processSalesReturn({
          saleId: searchedSale.id,
          items: activeItems.map((i) => ({
            saleItemId: i.saleItemId,
            productId: i.productId,
            quantity: i.quantity,
            refundUnitPrice: i.unitPrice,
            restockAction: i.restockAction,
          })),
          reason,
          refundMethod,
          userId: user?.id || null,
        });
      }
      setIsModalOpen(false);
      setSearchedSale(null);
      setInvoiceQuery('');
      loadReturns();
    } catch (err: any) {
      setError(err.message || 'Failed to process sales return.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Undo2 size={20} /> Sales Returns & Refunds
          </h1>
          <p className="text-xs text-[#ACADB1]">
            Process customer item returns, restitution refunds, and restock/damaged goods disposition.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadReturns}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => setIsModalOpen(true)}
          >
            Process Return
          </Button>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D4D8DF]">
            <thead className="bg-white/5 text-[#ACADB1] uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
              <tr>
                <th className="py-3 px-4">Return #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Original Invoice</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Refund Amount</th>
                <th className="py-3 px-4">Refund Channel</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">{ret.return_number}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#ACADB1]">
                    {ret.return_date.slice(0, 10)}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-white">{ret.invoice_number}</td>
                  <td className="py-3 px-4 text-white">{ret.customer_name || 'Walk-in'}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#F87171]">
                    - {currencySymbol} {ret.refund_amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-mono uppercase text-[11px] text-[#ACADB1]">
                    {ret.refund_method}
                  </td>
                  <td className="py-3 px-4 text-[#D4D8DF]">{ret.reason}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="warning" size="sm">
                      {ret.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {returns.length === 0 && !loading && (
            <div className="py-16 text-center text-xs text-[#706F70]">
              No sales returns recorded yet.
            </div>
          )}
        </div>
      </GlassCard>

      {/* Process Return Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Sales Return & Customer Refund"
        subtitle="Lookup original transaction and specify restock or damaged classification"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitReturn} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#F87171]">
              {error}
            </div>
          )}

          {/* Invoice Search Bar */}
          <div className="flex gap-2">
            <Input
              label="Original Invoice Number *"
              value={invoiceQuery}
              onChange={(e) => setInvoiceQuery(e.target.value)}
              placeholder="e.g. INV-1001"
              autoFocus
            />
            <Button
              type="button"
              variant="secondary"
              className="mt-6"
              onClick={handleSearchSale}
            >
              Locate Sale
            </Button>
          </div>

          {searchedSale && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-white font-semibold">Found Invoice: {searchedSale.invoice_number}</span>
                  <span className="text-[#ACADB1] block mt-0.5">Customer: {searchedSale.customer_name || 'Walk-in'} • Date: {searchedSale.sale_date.slice(0, 10)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#706F70] block">Original Total</span>
                  <span className="font-mono font-bold text-white">
                    {currencySymbol} {searchedSale.grand_total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items to Return */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-white">Select Items & Quantities to Return</span>
                <div className="divide-y divide-white/5 border border-white/10 rounded-xl bg-[#0E0E0F] overflow-hidden">
                  {returnItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex-1">
                        <div className="font-medium text-white">{item.productName}</div>
                        <div className="text-[10px] text-[#706F70]">
                          Purchased: {item.maxQty} units @ {currencySymbol} {item.unitPrice}
                        </div>
                      </div>

                      {/* Return Qty */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#ACADB1]">Return Qty:</span>
                        <input
                          type="number"
                          min="0"
                          max={item.maxQty}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.min(item.maxQty, Math.max(0, Number(e.target.value)));
                            const updated = [...returnItems];
                            updated[idx].quantity = val;
                            setReturnItems(updated);
                          }}
                          className="w-16 bg-[#141415] border border-white/10 rounded px-2 py-1 text-center font-mono font-bold text-white text-xs"
                        />
                      </div>

                      {/* Restock Action Toggle */}
                      <select
                        value={item.restockAction}
                        onChange={(e) => {
                          const updated = [...returnItems];
                          updated[idx].restockAction = e.target.value as any;
                          setReturnItems(updated);
                        }}
                        className="bg-[#141415] border border-white/10 rounded px-2 py-1 text-[11px] text-white"
                      >
                        <option value="restock">Restock to Sellable Inventory</option>
                        <option value="damaged">Damaged / Non-sellable</option>
                        <option value="scrap">Scrap</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#ACADB1]">Refund Channel</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="rounded-xl bg-[#0E0E0F]/80 border border-white/10 px-3 py-2 text-xs text-white"
                  >
                    <option value="cash">Cash Refund (Deducts from Cash Drawer)</option>
                    <option value="original">Original Payment Channel</option>
                    <option value="credit">Customer Account Credit</option>
                  </select>
                </div>

                <Input
                  label="Reason for Return *"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Defective or customer change of mind"
                  required
                />
              </div>

              {/* Total Refund Summary */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <span className="text-[#ACADB1]">Total Refund to Customer:</span>
                <span className="text-base font-bold font-mono text-[#F87171]">
                  {currencySymbol} {totalRefund.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!searchedSale || totalRefund <= 0}
              isLoading={submitting}
              leftIcon={<Undo2 size={15} />}
            >
              Confirm Return & Refund
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
