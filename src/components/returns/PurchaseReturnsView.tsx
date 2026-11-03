import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Supplier, Product } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  RotateCcw,
  Plus,
  Search,
  Truck,
  Package,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign
} from 'lucide-react';

interface PurchaseReturnRecord {
  id: number;
  return_number: string;
  supplier_id: number;
  supplier_name: string;
  total_amount: number;
  return_date: string;
  reason: string;
  authorizer_name?: string;
  items?: {
    id: number;
    product_name: string;
    sku: string;
    quantity: number;
    unit_cost: number;
    subtotal: number;
  }[];
}

export const PurchaseReturnsView: React.FC = () => {
  const { user, businessSettings, addNotification } = useAppStore();
  const currency = businessSettings?.currency || '₨';

  const [returns, setReturns] = useState<PurchaseReturnRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Purchase Return Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [returnQty, setReturnQty] = useState('1');
  const [unitCost, setUnitCost] = useState('0');
  const [reason, setReason] = useState('Defective / Damaged goods on delivery');
  const [submitting, setSubmitting] = useState(false);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      if (window.skythsAPI) {
        const rets = await window.skythsAPI.getPurchaseReturns();
        setReturns(rets || []);
        const sups = await window.skythsAPI.getSuppliers();
        setSuppliers(sups || []);
        const prods = await window.skythsAPI.getProducts();
        setProducts(Array.isArray(prods) ? prods : (prods?.products || []));
      }
    } catch (err: any) {
      console.error('Failed to load purchase returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleProductChange = (productId: number) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setUnitCost(prod.cost_price.toString());
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !selectedProductId) {
      addNotification({ title: 'Missing Info', message: 'Select supplier and product.', type: 'danger' });
      return;
    }

    const qty = parseFloat(returnQty);
    const cost = parseFloat(unitCost);

    if (isNaN(qty) || qty <= 0 || isNaN(cost) || cost < 0) {
      addNotification({ title: 'Invalid Values', message: 'Enter valid quantity and cost.', type: 'danger' });
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (prod && prod.current_stock < qty) {
      addNotification({
        title: 'Insufficient Inventory',
        message: `Cannot return ${qty} units. Only ${prod.current_stock} currently in stock.`,
        type: 'danger'
      });
      return;
    }

    try {
      setSubmitting(true);
      if (window.skythsAPI) {
        const res = await window.skythsAPI.processPurchaseReturn({
          supplierId: Number(selectedSupplierId),
          items: [
            {
              productId: Number(selectedProductId),
              quantity: qty,
              unitCost: cost
            }
          ],
          reason,
          userId: user?.id
        });

        addNotification({
          title: 'Purchase Return Processed',
          message: `Debit Note #${res.return_number} issued to supplier. Inventory stock reduced by ${qty}.`,
          type: 'success'
        });

        setIsModalOpen(false);
        setSelectedSupplierId('');
        setSelectedProductId('');
        setReturnQty('1');
        setReason('Defective / Damaged goods on delivery');
        await fetchReturns();
      }
    } catch (err: any) {
      addNotification({ title: 'Return Failed', message: err.message, type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = returns.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.return_number.toLowerCase().includes(q) ||
      (r.supplier_name && r.supplier_name.toLowerCase().includes(q)) ||
      r.reason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <RotateCcw className="text-[#ACADB1]" size={22} />
            Purchase Returns & Supplier Debit Notes
          </h1>
          <p className="text-xs text-[#ACADB1]">
            Return damaged or incorrect stock to suppliers, issue debit notes, and adjust payables.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={15} />
          Issue Supplier Debit Note
        </Button>
      </div>

      {/* Search / Filter Bar */}
      <GlassCard className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[#706F70]" size={15} />
          <input
            type="text"
            placeholder="Search by debit note number, supplier, or return reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-[#706F70] focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>
      </GlassCard>

      {/* Returns Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <span className="text-xs font-bold uppercase tracking-wider text-white">Supplier Returns Ledger</span>
          <span className="text-[11px] font-mono text-[#ACADB1]">{filtered.length} debit notes recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-wider text-[#ACADB1]">
                <th className="py-2.5 px-4">Debit Note #</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Supplier</th>
                <th className="py-2.5 px-4">Items Returned</th>
                <th className="py-2.5 px-4">Reason</th>
                <th className="py-2.5 px-4 text-right">Debit Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#ACADB1]">
                    Loading supplier returns...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-[#ACADB1]">
                    No purchase returns recorded yet. Click "Issue Supplier Debit Note" to return defective stock.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{r.return_number}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#ACADB1]">
                      {new Date(r.return_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{r.supplier_name}</td>
                    <td className="py-3 px-4 text-[#D4D8DF]">
                      {r.items && r.items.length > 0 ? (
                        <div className="space-y-0.5">
                          {r.items.map((itm) => (
                            <div key={itm.id} className="text-[11px]">
                              {itm.product_name} <span className="font-mono text-[#ACADB1]">({itm.quantity} units @ {itm.unit_cost})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#ACADB1] max-w-xs truncate">{r.reason}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {currency} {r.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* New Purchase Return Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Supplier Return & Debit Note"
        maxWidth="md"
      >
        <form onSubmit={handleCreateReturn} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#ACADB1] mb-1">Target Supplier</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(Number(e.target.value) || '')}
              className="w-full text-xs p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              required
            >
              <option value="" className="bg-[#141415] text-white">Select a supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#141415] text-white">
                  {s.name} (Payable: {currency} {s.balance_payable.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#ACADB1] mb-1">Product to Return</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(Number(e.target.value))}
              className="w-full text-xs p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              required
            >
              <option value="" className="bg-[#141415] text-white">Select product to return...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#141415] text-white">
                  {p.name} — Current Stock: {p.current_stock} (Cost: {currency} {p.cost_price})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity to Return"
              type="number"
              step="any"
              min="1"
              value={returnQty}
              onChange={(e) => setReturnQty(e.target.value)}
              required
            />

            <Input
              label={`Unit Cost / Debit (${currency})`}
              type="number"
              step="any"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#ACADB1] mb-1">Return Reason / Damage Report</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-[#706F70] focus:outline-none focus:ring-1 focus:ring-white/20"
              placeholder="e.g. Expired batch, physical transit damage, wrong specifications"
              required
            />
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs flex justify-between font-medium">
            <span className="text-[#ACADB1]">Total Debit Note Value:</span>
            <span className="font-mono font-bold text-white">
              {currency} {((parseFloat(returnQty) || 0) * (parseFloat(unitCost) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              <RotateCcw size={14} />
              {submitting ? 'Processing Return...' : 'Confirm Return & Reduce Stock'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
