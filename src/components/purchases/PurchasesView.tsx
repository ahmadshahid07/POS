import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { NewPurchaseModal } from './NewPurchaseModal';
import { PurchaseOrder, Product, Supplier } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { ShoppingBag, Plus, RefreshCw, FileText } from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const { businessSettings } = useAppStore();
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const loadData = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const poRes = await (window as any).skythsAPI.getPurchases();
        const prodRes = await (window as any).skythsAPI.getProducts({ status: 'active' });
        const supRes = await (window as any).skythsAPI.getSuppliers();
        setPurchases(poRes.purchases || []);
        setProducts(prodRes.products || []);
        setSuppliers(supRes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShoppingBag size={20} /> Purchases & Stock Receiving
          </h1>
          <p className="text-xs text-[#ACADB1]">
            Record supplier orders, receive physical goods, and manage payables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadData}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => setIsModalOpen(true)}
          >
            Receive Stock
          </Button>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D4D8DF]">
            <thead className="bg-white/5 text-[#ACADB1] uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Supplier Inv #</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Payable Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {purchases.map((po) => (
                <tr key={po.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">{po.po_number}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#ACADB1]">
                    {po.purchase_date.slice(0, 10)}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{po.supplier_name}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#706F70]">
                    {po.invoice_reference || '—'}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{po.items_count || 1}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {currencySymbol} {po.total_amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#4ADE80]">
                    {currencySymbol} {po.paid_amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span className={po.balance_amount > 0 ? 'text-[#FBBF24] font-bold' : 'text-[#706F70]'}>
                      {currencySymbol} {po.balance_amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="success" size="sm">
                      {po.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {purchases.length === 0 && !loading && (
            <div className="py-16 text-center text-xs text-[#706F70]">
              No purchase orders recorded yet. Click "Receive Stock" to record incoming supplier goods.
            </div>
          )}
        </div>
      </GlassCard>

      <NewPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        products={products}
        suppliers={suppliers}
        businessSettings={businessSettings}
        onSaved={loadData}
      />
    </div>
  );
};
