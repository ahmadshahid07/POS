import React, { useState, useEffect } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import { useAppStore } from '../../store/useAppStore';
import { SaleDetail } from '../../types';
import {
  Search,
  Download,
  Filter,
  Eye,
  ChevronRight,
  ShoppingBag,
  RotateCcw,
  Printer,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  customer: string;
  channel: 'Online' | 'In store';
  itemsCount: number;
  total: number;
  status: 'Completed' | 'Processing' | 'Shipped' | 'Cancelled';
  date: string;
}

const DEMO_ORDERS: OrderItem[] = [
  { id: '1', orderNumber: '#ORD-8821', customer: 'Sophia Bennett', channel: 'Online', itemsCount: 3, total: 245.00, status: 'Completed', date: 'Oct 28, 2026' },
  { id: '2', orderNumber: '#ORD-8820', customer: 'Liam Henderson', channel: 'In store', itemsCount: 1, total: 89.50, status: 'Completed', date: 'Oct 28, 2026' },
  { id: '3', orderNumber: '#ORD-8819', customer: 'Emma Watson', channel: 'Online', itemsCount: 4, total: 412.00, status: 'Processing', date: 'Oct 27, 2026' },
  { id: '4', orderNumber: '#ORD-8818', customer: 'Noah Campbell', channel: 'Online', itemsCount: 2, total: 156.80, status: 'Shipped', date: 'Oct 27, 2026' },
  { id: '5', orderNumber: '#ORD-8817', customer: 'Olivia Miller', channel: 'In store', itemsCount: 5, total: 630.00, status: 'Completed', date: 'Oct 26, 2026' },
  { id: '6', orderNumber: '#ORD-8816', customer: 'James Wilson', channel: 'Online', itemsCount: 1, total: 45.00, status: 'Processing', date: 'Oct 26, 2026' },
  { id: '7', orderNumber: '#ORD-8815', customer: 'Ava Garcia', channel: 'Online', itemsCount: 3, total: 310.20, status: 'Completed', date: 'Oct 25, 2026' },
  { id: '8', orderNumber: '#ORD-8814', customer: 'Ethan Brooks', channel: 'In store', itemsCount: 2, total: 118.00, status: 'Completed', date: 'Oct 25, 2026' },
];

export const CorbelOrdersView: React.FC = () => {
  const { theme } = useCorbelStore();
  const { businessSettings, addNotification } = useAppStore();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'All' | 'Online' | 'In store'>('All');
  const [orders, setOrders] = useState<OrderItem[]>(DEMO_ORDERS);

  // Selected Order Detail
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<SaleDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Return Processing Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnItem, setReturnItem] = useState<any>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnAction, setReturnAction] = useState<'restock' | 'discard'>('restock');
  const [returnMethod, setReturnMethod] = useState<'cash' | 'card' | 'customer_balance'>('cash');
  const [returnReason, setReturnReason] = useState('Customer exchange / return');
  const [returnLoading, setReturnLoading] = useState(false);

  const isDark = theme === 'dark';
  const currencySymbol = businessSettings?.currency_symbol || '$';

  const loadOrders = async () => {
    try {
      if (window.skythsAPI && typeof window.skythsAPI.getSalesHistory === 'function') {
        const liveSales = await window.skythsAPI.getSalesHistory({ limit: 50 });
        const salesList = liveSales?.sales || liveSales || [];
        if (Array.isArray(salesList) && salesList.length > 0) {
          const mapped: OrderItem[] = salesList.map((s: any) => ({
            id: String(s.id),
            orderNumber: s.invoice_number,
            customer: s.customer_name || 'Walk-in Customer',
            channel: s.payment_method?.includes('online') || s.payment_method?.includes('easypaisa') || s.payment_method?.includes('jazzcash') ? 'Online' : 'In store',
            itemsCount: s.items_count || 1,
            total: Number(s.grand_total || 0),
            status: s.status === 'completed' ? 'Completed' : s.status === 'voided' ? 'Cancelled' : 'Processing',
            date: s.sale_date ? new Date(s.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
          }));
          setOrders(mapped);
        }
      }
    } catch (err) {
      console.warn('Using demo orders fallback:', err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenDetail = async (orderId: string) => {
    try {
      if (window.skythsAPI && typeof window.skythsAPI.getSaleDetail === 'function') {
        const detail = await window.skythsAPI.getSaleDetail(Number(orderId));
        if (detail) {
          setSelectedSaleDetail(detail);
          setIsDetailOpen(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not fetch sale detail from DB:', err);
    }

    // Fallback mock detail
    const o = orders.find(x => x.id === orderId);
    if (o) {
      setSelectedSaleDetail({
        id: Number(o.id),
        invoice_number: o.orderNumber,
        customer_name: o.customer,
        sale_date: o.date,
        status: 'completed',
        payment_status: 'paid',
        subtotal: o.total,
        discount_type: 'fixed',
        discount_amount: 0,
        tax_rate: 0,
        tax_amount: 0,
        grand_total: o.total,
        paid_amount: o.total,
        change_due: 0,
        balance_due: 0,
        payment_method: 'cash',
        items: [
          {
            id: 1,
            sale_id: Number(o.id),
            product_id: 1,
            product_name: 'Catalog Item',
            sku: 'ITEM-01',
            quantity: o.itemsCount,
            unit_price: o.total / (o.itemsCount || 1),
            cost_price_snapshot: (o.total / (o.itemsCount || 1)) * 0.5,
            discount: 0,
            line_total: o.total,
          }
        ],
        payments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setIsDetailOpen(true);
    }
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleDetail || !returnItem) return;
    setReturnLoading(true);

    try {
      if (window.skythsAPI) {
        await window.skythsAPI.processSalesReturn({
          saleId: selectedSaleDetail.id,
          items: [
            {
              saleItemId: returnItem.id,
              productId: returnItem.product_id,
              quantity: Number(returnQty),
              refundUnitPrice: Number(returnItem.unit_price),
              restockAction: returnAction,
            },
          ],
          reason: returnReason,
          refundMethod: returnMethod,
        });

        addNotification({
          title: 'Return Processed',
          message: `Returned ${returnQty} unit(s) of ${returnItem.product_name}.`,
          type: 'success',
        });

        setIsReturnModalOpen(false);
        setIsDetailOpen(false);
        await loadOrders();
      }
    } catch (err: any) {
      alert(`Return rejected: ${err.message}`);
    } finally {
      setReturnLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchChannel = channelFilter === 'All' || o.channel === channelFilter;
    return matchSearch && matchChannel;
  });

  const exportCSV = () => {
    const headers = ['Order', 'Customer', 'Channel', 'Items', 'Total', 'Status', 'Date'];
    const rows = filtered.map(o => [o.orderNumber, `"${o.customer}"`, o.channel, o.itemsCount, o.total, o.status, `"${o.date}"`]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Subheader */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Orders & Sales
          </h1>
          <p className="text-xs text-slate-400 mt-1">{orders.length} total sales records tracked</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders, customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 pr-4 py-1.5 rounded-full text-xs border outline-none transition-all ${
                isDark
                  ? 'bg-[#15181D] border-white/10 text-white focus:border-white/30'
                  : 'bg-white border-slate-200 text-slate-900 focus:border-slate-400'
              }`}
            />
          </div>

          <div
            className={`flex items-center p-1 rounded-full border ${
              isDark ? 'bg-[#15181D] border-white/10' : 'bg-slate-200/70 border-slate-300/40'
            }`}
          >
            {(['All', 'Online', 'In store'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  channelFilter === ch
                    ? isDark ? 'bg-white text-black shadow-sm font-bold' : 'bg-white text-slate-900 shadow-sm font-bold'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold shadow-sm transition-all ${
              isDark ? 'bg-[#15181D] border-white/10 text-slate-200 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div
        className={`p-5 rounded-3xl border transition-all duration-200 ${
          isDark
            ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
            : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                <th className="py-3 px-4 font-semibold">Order</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Channel</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold">Total</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className={`group transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {order.orderNumber}
                  </td>
                  <td className="py-3.5 px-4 font-medium">{order.customer}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        order.channel === 'Online'
                          ? isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-50 text-sky-700'
                          : isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {order.channel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{order.itemsCount} pcs</td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'Completed'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : order.status === 'Processing'
                          ? 'bg-amber-500/15 text-amber-500'
                          : order.status === 'Shipped'
                          ? 'bg-blue-500/15 text-blue-500'
                          : 'bg-red-500/15 text-red-500'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{order.date}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenDetail(order.id)}
                      className={`p-1.5 rounded-full transition-colors ${
                        isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-black'
                      }`}
                      title="View Details"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Order Details & Returns */}
      {isDetailOpen && selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl flex flex-col gap-4 ${
            isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>Invoice #{selectedSaleDetail.invoice_number}</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                    {selectedSaleDetail.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customer: {selectedSaleDetail.customer_name || 'Walk-in'} • {selectedSaleDetail.sale_date}
                </p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X size={16} />
              </button>
            </div>

            {/* Line Items List */}
            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
              {selectedSaleDetail.items.map((it) => (
                <div
                  key={it.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#1D2128] border-white/5' : 'bg-slate-50 border-slate-150'
                  }`}
                >
                  <div>
                    <h5 className="font-bold">{it.product_name}</h5>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SKU: {it.sku} • {it.quantity} units @ ${it.unit_price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold">${it.line_total.toFixed(2)}</span>
                    <button
                      onClick={() => {
                        setReturnItem(it);
                        setReturnQty(it.quantity);
                        setIsReturnModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 flex items-center gap-1 transition-colors"
                      title="Initiate Return"
                    >
                      <RotateCcw size={10} />
                      <span>Return</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="p-3 rounded-2xl border border-black/5 dark:border-white/5 font-mono text-xs flex flex-col gap-1">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>${selectedSaleDetail.subtotal.toFixed(2)}</span>
              </div>
              {selectedSaleDetail.discount_amount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Discount</span>
                  <span>-${selectedSaleDetail.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black pt-1 border-t border-black/5 dark:border-white/5">
                <span>Grand Total</span>
                <span className="text-emerald-500">${selectedSaleDetail.grand_total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border ${
                  isDark ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Printer size={13} />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200 shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Process Sales Return */}
      {isReturnModalOpen && returnItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#15181D] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-bold text-base mb-1">Customer Sales Return</h3>
            <p className="text-xs text-slate-400 mb-4 pb-2 border-b border-black/10 dark:border-white/10">
              Returning: {returnItem.product_name}
            </p>

            <form onSubmit={handleProcessReturn} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Return Quantity</label>
                <input
                  required
                  type="number"
                  min="1"
                  max={returnItem.quantity}
                  value={returnQty}
                  onChange={(e) => setReturnQty(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-mono font-bold ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Inventory Action</label>
                <select
                  value={returnAction}
                  onChange={(e) => setReturnAction(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="restock">Restock to active inventory</option>
                  <option value="discard">Discard / Damaged (do not restock)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Refund Method</label>
                <select
                  value={returnMethod}
                  onChange={(e) => setReturnMethod(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="cash">Cash Refund</option>
                  <option value="card">Card Refund</option>
                  <option value="customer_balance">Store Credit / Customer Account</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Return Reason</label>
                <input
                  required
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Size mismatch"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-1.5 rounded-full text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnLoading}
                  className="px-5 py-1.5 rounded-full font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg"
                >
                  {returnLoading ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
