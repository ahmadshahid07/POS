import React, { useState, useEffect } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import { useAppStore } from '../../store/useAppStore';
import { Supplier, PurchaseOrder, Product } from '../../types';
import {
  Truck,
  Plus,
  Search,
  CheckCircle,
  PackageCheck,
  Building2,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  X,
  FileText,
} from 'lucide-react';

export const CorbelPurchasesView: React.FC = () => {
  const { theme } = useCorbelStore();
  const { businessSettings, addNotification } = useAppStore();
  const isDark = theme === 'dark';
  const currencySymbol = businessSettings?.currency_symbol || '$';

  const [subtab, setSubtab] = useState<'orders' | 'suppliers'>('orders');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isPaySupplierOpen, setIsPaySupplierOpen] = useState(false);
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<Supplier | null>(null);
  const [payoutAmount, setPayoutAmount] = useState(0);

  // Forms
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  });

  const [newPurchase, setNewPurchase] = useState({
    supplier_id: 0,
    product_id: 0,
    quantity: 1,
    unit_cost: 0,
    payment_method: 'cash',
  });

  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      if (window.skythsAPI) {
        const sups = await window.skythsAPI.getSuppliers();
        const pos = await window.skythsAPI.getPurchaseOrders?.() || [];
        const prods = await window.skythsAPI.getProducts();
        setSuppliers(sups || []);
        setPurchases(pos || []);
        setProducts(prods?.products || prods || []);
      }
    } catch (err) {
      console.warn('Failed to load purchases data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;
    setIsLoading(true);

    try {
      if (window.skythsAPI) {
        await window.skythsAPI.createSupplier(newSupplier);
        await loadData();
        addNotification({
          title: 'Supplier Added',
          message: `${newSupplier.name} registered successfully.`,
          type: 'success',
        });
      }
      setIsAddSupplierOpen(false);
      setNewSupplier({ name: '', contact_person: '', phone: '', email: '', address: '' });
    } catch (err: any) {
      alert(`Error creating supplier: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurchase.supplier_id || !newPurchase.product_id || newPurchase.quantity <= 0) return;
    setIsLoading(true);

    try {
      if (window.skythsAPI) {
        // 1. Create Purchase Order
        const po = await window.skythsAPI.createPurchaseOrder({
          supplierId: newPurchase.supplier_id,
          items: [
            {
              productId: newPurchase.product_id,
              quantity: Number(newPurchase.quantity),
              unitCost: Number(newPurchase.unit_cost),
            },
          ],
        });

        // 2. Receive Purchase Order (Updates Stock and recalculates Weighted Average Cost WAC)
        await window.skythsAPI.receivePurchaseOrder(po.id, [
          {
            purchaseItemId: po.items[0].id,
            receivedQuantity: Number(newPurchase.quantity),
            unitCost: Number(newPurchase.unit_cost),
          },
        ]);

        await loadData();
        addNotification({
          title: 'Stock Received & WAC Updated',
          message: `PO #${po.po_number} received into active inventory.`,
          type: 'success',
        });
      }
      setIsNewPurchaseOpen(false);
      setNewPurchase({ supplier_id: 0, product_id: 0, quantity: 1, unit_cost: 0, payment_method: 'cash' });
    } catch (err: any) {
      alert(`Error receiving stock: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPay || payoutAmount <= 0) return;
    setIsLoading(true);

    try {
      if (window.skythsAPI) {
        await window.skythsAPI.createPayment({
          transaction_type: 'supplier_payout',
          supplier_id: selectedSupplierForPay.id,
          amount: Number(payoutAmount),
          payment_method: 'cash',
          payment_date: new Date().toISOString(),
          notes: `Payout to ${selectedSupplierForPay.name}`,
        });
        await loadData();
        addNotification({
          title: 'Supplier Payment Recorded',
          message: `Paid ${currencySymbol}${payoutAmount.toFixed(2)} to ${selectedSupplierForPay.name}.`,
          type: 'success',
        });
      }
      setIsPaySupplierOpen(false);
      setSelectedSupplierForPay(null);
      setPayoutAmount(0);
    } catch (err: any) {
      alert(`Error recording payout: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div>
            <h1 className={`text-3xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Purchases & Suppliers
            </h1>
            <p className="text-xs text-slate-400 mt-1">Stock receiving, supplier payables & PO tracking</p>
          </div>

          {/* Subtab Segmented Pill */}
          <div
            className={`flex items-center p-1 rounded-full border ${
              isDark ? 'bg-[#15181D] border-white/10' : 'bg-slate-200/70 border-slate-300/40'
            }`}
          >
            {(['orders', 'suppliers'] as const).map((tab) => {
              const active = subtab === tab;
              const labels = {
                orders: 'Purchase Orders & Receiving',
                suppliers: 'Supplier Directory',
              };
              return (
                <button
                  key={tab}
                  onClick={() => setSubtab(tab)}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                    active
                      ? isDark
                        ? 'bg-white text-black shadow-sm font-bold'
                        : 'bg-white text-slate-900 shadow-sm font-bold'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {subtab === 'orders' ? (
            <button
              onClick={() => setIsNewPurchaseOpen(true)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all ${
                isDark ? 'bg-emerald-500 text-black font-bold hover:bg-emerald-400' : 'bg-emerald-600 text-white font-bold hover:bg-emerald-700'
              }`}
            >
              <PackageCheck size={14} />
              <span>Receive Inventory (PO)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all ${
                isDark ? 'bg-white text-black font-bold hover:bg-slate-200' : 'bg-[#121316] text-white font-bold hover:bg-black'
              }`}
            >
              <Plus size={14} />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtab 1: Purchase Orders & Receiving */}
      {subtab === 'orders' && (
        <div className={`p-5 rounded-3xl border shadow-lg ${
          isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {purchases.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Truck size={28} className="text-slate-500" />
              <p>No purchase receiving orders recorded yet.</p>
              <button
                onClick={() => setIsNewPurchaseOpen(true)}
                className="mt-2 px-4 py-1.5 rounded-full bg-emerald-500 text-black font-bold text-xs"
              >
                Receive First Stock Delivery
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-150 text-slate-500'}`}>
                    <th className="py-3 px-4 font-semibold">PO Number</th>
                    <th className="py-3 px-4 font-semibold">Supplier</th>
                    <th className="py-3 px-4 font-semibold">Total Amount</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {purchases.map((po) => (
                    <tr key={po.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{po.po_number}</td>
                      <td className="py-3 px-4 font-medium">{po.supplier_name || 'Direct Supplier'}</td>
                      <td className="py-3 px-4 font-mono font-bold">{currencySymbol}{po.total_amount?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {po.purchase_date ? new Date(po.purchase_date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Supplier Directory */}
      {subtab === 'suppliers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className={`p-5 rounded-3xl border flex flex-col justify-between ${
                isDark ? 'bg-[#15181D] border-white/10 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-emerald-500" />
                    <h4 className="font-bold text-sm">{sup.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">ID: #{sup.id}</span>
                </div>

                {sup.phone && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                    <Phone size={11} /> {sup.phone}
                  </p>
                )}
                {sup.address && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin size={11} /> {sup.address}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Balance Payable</span>
                  <span className={`font-mono font-bold text-sm ${sup.balance_payable > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {currencySymbol}{sup.balance_payable?.toFixed(2) || '0.00'}
                  </span>
                </div>

                {sup.balance_payable > 0 && (
                  <button
                    onClick={() => {
                      setSelectedSupplierForPay(sup);
                      setPayoutAmount(sup.balance_payable);
                      setIsPaySupplierOpen(true);
                    }}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200 transition-colors shadow-sm"
                  >
                    Pay Supplier
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Receive Inventory */}
      {isNewPurchaseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#15181D] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-bold text-base mb-4 pb-2 border-b border-black/10 dark:border-white/10">Receive Inventory & PO</h3>
            <form onSubmit={handleReceiveStock} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Supplier</label>
                <select
                  required
                  value={newPurchase.supplier_id}
                  onChange={(e) => setNewPurchase({ ...newPurchase, supplier_id: Number(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value={0}>Select supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Select Product</label>
                <select
                  required
                  value={newPurchase.product_id}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    const prod = products.find((p) => p.id === pid);
                    setNewPurchase({
                      ...newPurchase,
                      product_id: pid,
                      unit_cost: prod ? prod.cost_price : 0,
                    });
                  }}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value={0}>Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Quantity Received</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={newPurchase.quantity}
                    onChange={(e) => setNewPurchase({ ...newPurchase, quantity: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-mono font-bold ${
                      isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Unit Cost ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={newPurchase.unit_cost}
                    onChange={(e) => setNewPurchase({ ...newPurchase, unit_cost: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-mono font-bold ${
                      isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseOpen(false)}
                  className="px-4 py-1.5 rounded-full text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-1.5 rounded-full font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                >
                  {isLoading ? 'Processing...' : 'Confirm Receiving & WAC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Supplier */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#15181D] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-bold text-base mb-4 pb-2 border-b border-black/10 dark:border-white/10">Add Supplier</h3>
            <form onSubmit={handleCreateSupplier} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Supplier Company Name</label>
                <input
                  required
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="e.g. Acme Wholesale Ltd."
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  placeholder="e.g. +1 555-0182"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  placeholder="e.g. Industrial Area, Sector 4"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-1.5 rounded-full text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-1.5 rounded-full font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Supplier */}
      {isPaySupplierOpen && selectedSupplierForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#15181D] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-bold text-base mb-1">Record Supplier Payment</h3>
            <p className="text-xs text-slate-400 mb-4 pb-2 border-b border-black/10 dark:border-white/10">
              Pay balance to {selectedSupplierForPay.name}
            </p>
            <form onSubmit={handlePaySupplier} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Payout Amount ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  max={selectedSupplierForPay.balance_payable}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-mono font-bold ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPaySupplierOpen(false)}
                  className="px-4 py-1.5 rounded-full text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-1.5 rounded-full font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
