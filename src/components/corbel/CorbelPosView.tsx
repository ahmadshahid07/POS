import React, { useEffect, useState, useRef } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { useAppStore } from '../../store/useAppStore';
import { useCorbelStore } from '../../store/useCorbelStore';
import { Product, Customer, ProductCategory, SaleDetail, PaymentMethod } from '../../types';
import { playBarcodeBeep, playCheckoutSuccessSound, playLowStockAlertSound } from '../../utils/audioAlerts';
import {
  Barcode,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  UserPlus,
  CreditCard,
  Banknote,
  Smartphone,
  Truck,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Printer,
  X,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

export const CorbelPosView: React.FC = () => {
  const { theme } = useCorbelStore();
  const { user, businessSettings, addNotification } = useAppStore();
  const isDark = theme === 'dark';

  const {
    items,
    selectedCustomer,
    discountType,
    discountAmount,
    taxRate,
    paymentMethod,
    tenderedAmount,
    notes,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setSelectedCustomer,
    setDiscountType,
    setDiscountAmount,
    setTaxRate,
    setPaymentMethod,
    setTenderedAmount,
    setNotes,
    getSubtotal,
    getOrderDiscount,
    getTaxAmount,
    getGrandTotal,
    getChangeDue,
    getBalanceDue,
  } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Completed sale receipt modal
  const [completedSale, setCompletedSale] = useState<SaleDetail | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Quick Customer Creation Modal
  const [isQuickCustOpen, setIsQuickCustOpen] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');
  const [quickCustLoading, setQuickCustLoading] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const currencySymbol = businessSettings?.currency_symbol || '$';

  const loadData = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && window.skythsAPI) {
        const prodRes = await window.skythsAPI.getProducts({ status: 'active' });
        const catRes = await window.skythsAPI.getCategories?.() || [];
        const custRes = await window.skythsAPI.getCustomers();
        setProducts(prodRes?.products || prodRes || []);
        setCategories(catRes || []);
        setCustomers(custRes || []);
      }
    } catch (err: any) {
      setError(`Failed to load POS catalog: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    barcodeInputRef.current?.focus();
  }, []);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const code = barcodeInput.trim().toLowerCase();
    const match = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === code) ||
        (p.sku && p.sku.toLowerCase() === code)
    );

    if (match) {
      if (match.current_stock <= 0) {
        if (businessSettings?.sound_effects_enabled) playLowStockAlertSound();
        setError(`Product "${match.name}" is currently out of stock.`);
        return;
      }
      if (businessSettings?.sound_effects_enabled) playBarcodeBeep();
      addItem(match);
      setBarcodeInput('');
      setError(null);
    } else {
      setError(`No product found with barcode/SKU: "${barcodeInput}"`);
    }
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim()) return;
    setQuickCustLoading(true);
    try {
      if (window.skythsAPI) {
        const newCust = await window.skythsAPI.createCustomer({
          name: quickCustName.trim(),
          phone: quickCustPhone.trim() || null,
        });
        setCustomers((prev) => [newCust, ...prev]);
        setSelectedCustomer(newCust);
        setIsQuickCustOpen(false);
        setQuickCustName('');
        setQuickCustPhone('');
      }
    } catch (err: any) {
      alert(`Customer error: ${err.message}`);
    } finally {
      setQuickCustLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckoutLoading(true);
    setError(null);

    try {
      if (!window.skythsAPI) {
        throw new Error('Desktop API bridge unavailable');
      }

      const saleData = await window.skythsAPI.completeSale({
        cart: items,
        customerId: selectedCustomer?.id || null,
        discountType,
        discountAmount,
        taxRate,
        paidAmount: Number(tenderedAmount) || getGrandTotal(),
        paymentMethod,
        notes,
        cashierId: user?.id || null,
      });

      if (businessSettings?.sound_effects_enabled) {
        playCheckoutSuccessSound();
      }

      setCompletedSale(saleData);
      setIsReceiptOpen(true);
      clearCart();
      await loadData();

      addNotification({
        title: 'Checkout Completed',
        message: `Invoice #${saleData.invoice_number} created successfully.`,
        type: 'success',
      });
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const subtotal = getSubtotal();
  const discountVal = getOrderDiscount();
  const taxVal = getTaxAmount();
  const grandTotal = getGrandTotal();
  const changeDue = getChangeDue();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Point of Sale
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live barcode scanning, express register & billing</p>
        </div>

        {/* Quick Search & Barcode inputs */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <Barcode size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode / SKU..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className={`pl-9 pr-4 py-1.5 rounded-full text-xs font-mono border outline-none transition-all ${
                isDark
                  ? 'bg-[#15181D] border-emerald-500/30 text-white focus:border-emerald-500'
                  : 'bg-white border-emerald-500/40 text-slate-900 focus:border-emerald-600'
              }`}
            />
          </form>

          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 pr-4 py-1.5 rounded-full text-xs border outline-none transition-all ${
                isDark
                  ? 'bg-[#15181D] border-white/10 text-white focus:border-white/30'
                  : 'bg-white border-slate-200 text-slate-900 focus:border-slate-400'
              }`}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded-full">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Main Grid: Products Catalog (Left) + Cart Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Selection */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? isDark ? 'bg-white text-black font-bold shadow-md' : 'bg-[#121316] text-white font-bold shadow-sm'
                  : isDark ? 'bg-[#15181D] text-slate-400 hover:text-white border border-white/5' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? isDark ? 'bg-white text-black font-bold shadow-md' : 'bg-[#121316] text-white font-bold shadow-sm'
                    : isDark ? 'bg-[#15181D] text-slate-400 hover:text-white border border-white/5' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.current_stock <= 0;
              const isLowStock = p.current_stock > 0 && p.current_stock <= p.min_stock_threshold;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (isOutOfStock) {
                      if (businessSettings?.sound_effects_enabled) playLowStockAlertSound();
                      setError(`"${p.name}" is out of stock.`);
                      return;
                    }
                    if (businessSettings?.sound_effects_enabled) playBarcodeBeep();
                    addItem(p);
                    setError(null);
                  }}
                  className={`p-4 rounded-3xl border transition-all duration-150 cursor-pointer flex flex-col justify-between group active:scale-95 select-none ${
                    isOutOfStock
                      ? isDark ? 'bg-[#15181D]/50 border-white/5 opacity-40 cursor-not-allowed' : 'bg-slate-100 border-slate-200 opacity-40 cursor-not-allowed'
                      : isDark
                      ? 'bg-[#15181D] border-white/10 hover:border-emerald-500/40 shadow-lg'
                      : 'bg-white border-slate-200/90 hover:border-emerald-500/50 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="font-mono text-slate-400">{p.sku}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full font-bold text-[9px] ${
                          isOutOfStock
                            ? 'bg-red-500/20 text-red-400'
                            : isLowStock
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-500'
                        }`}
                      >
                        {p.current_stock} left
                      </span>
                    </div>

                    <h4 className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-emerald-500 transition-colors">
                      {p.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <span className="font-mono font-black text-sm">
                      {currencySymbol}{p.selling_price.toFixed(2)}
                    </span>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                      <Plus size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cart & Checkout Panel */}
        <div className={`lg:col-span-5 xl:col-span-4 p-5 rounded-3xl border shadow-xl flex flex-col gap-4 sticky top-6 ${
          isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-emerald-500" />
              <h3 className="font-bold text-sm">Current Order ({items.length})</h3>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                const found = customers.find((c) => c.id === id);
                setSelectedCustomer(found || null);
              }}
              className={`flex-1 px-3 py-1.5 rounded-full text-xs border outline-none ${
                isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsQuickCustOpen(true)}
              className={`p-2 rounded-full border text-xs transition-colors ${
                isDark ? 'bg-[#22272F] border-white/10 hover:bg-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
              }`}
              title="Add Customer"
            >
              <UserPlus size={13} />
            </button>
          </div>

          {/* Cart Line Items */}
          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Scan barcode or select products to start billing
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#1D2128] border-white/5' : 'bg-slate-50 border-slate-150'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <h5 className="font-bold truncate">{item.product.name}</h5>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currencySymbol}{item.unit_price.toFixed(2)} × {item.quantity}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-5 h-5 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 hover:bg-red-500/20 text-current"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-5 h-5 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 hover:bg-emerald-500/20 text-current"
                    >
                      <Plus size={10} />
                    </button>
                    <span className="font-mono font-bold w-14 text-right">
                      {currencySymbol}{item.line_total.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1 text-slate-400 hover:text-red-400 ml-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discount & Calculations */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-black/5 dark:border-white/10 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-current">{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount selector */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Discount</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setDiscountType(discountType === 'percentage' ? 'fixed' : 'percentage')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  {discountType === 'percentage' ? '%' : currencySymbol}
                </button>
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className={`w-16 px-2 py-0.5 text-right font-mono rounded text-xs border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Tax ({taxRate}%)</span>
              <span className="font-mono text-current">{currencySymbol}{taxVal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/10 text-base font-black">
              <span>Grand Total</span>
              <span className="font-mono text-emerald-500 text-lg">
                {currencySymbol}{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Pills */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'bank_transfer', label: 'Bank', icon: Truck },
                  { id: 'easypaisa', label: 'EasyPaisa', icon: Smartphone },
                  { id: 'jazzcash', label: 'JazzCash', icon: Smartphone },
                  { id: 'cod', label: 'COD', icon: Truck },
                ] as const
              ).map((pm) => {
                const Icon = pm.icon;
                const active = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      active
                        ? isDark ? 'bg-white text-black font-bold shadow-md border-white' : 'bg-[#121316] text-white font-bold shadow-sm border-black'
                        : isDark ? 'bg-[#1D2128] border-white/5 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-black'
                    }`}
                  >
                    <Icon size={12} />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Cash, tendered amount & change calculation */}
          {paymentMethod === 'cash' && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-[#1D2128] border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-[10px] text-slate-400 block">Tendered</span>
                <input
                  type="number"
                  value={tenderedAmount || ''}
                  onChange={(e) => setTenderedAmount(Number(e.target.value))}
                  placeholder={grandTotal.toFixed(2)}
                  className={`w-24 px-2 py-1 rounded font-mono font-bold text-xs border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Change Due</span>
                <span className="font-mono font-bold text-sm text-emerald-500">
                  {currencySymbol}{changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Complete Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={items.length === 0 || checkoutLoading}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
              items.length === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-500 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
            }`}
          >
            <CheckCircle size={16} />
            <span>{checkoutLoading ? 'Processing Checkout...' : `Complete Sale (${currencySymbol}${grandTotal.toFixed(2)})`}</span>
          </button>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {isQuickCustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <h4 className="font-bold text-sm">Add New Customer</h4>
              <button onClick={() => setIsQuickCustOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleQuickAddCustomer} className="flex flex-col gap-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Name</label>
                <input
                  required
                  type="text"
                  value={quickCustName}
                  onChange={(e) => setQuickCustName(e.target.value)}
                  placeholder="e.g. Liam Henderson"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={quickCustPhone}
                  onChange={(e) => setQuickCustPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsQuickCustOpen(false)}
                  className="px-4 py-1.5 rounded-full font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickCustLoading}
                  className="px-5 py-1.5 rounded-full font-bold bg-emerald-500 hover:bg-emerald-400 text-black"
                >
                  {quickCustLoading ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completed Sale Receipt Modal */}
      {isReceiptOpen && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl flex flex-col gap-4 ${
            isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-500" />
                <h3 className="font-bold text-base">Sale Completed Successfully</h3>
              </div>
              <button onClick={() => setIsReceiptOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X size={16} />
              </button>
            </div>

            {/* Receipt Summary Card */}
            <div className={`p-4 rounded-2xl border font-mono text-xs flex flex-col gap-2 ${
              isDark ? 'bg-[#1D2128] border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-center font-bold pb-2 border-b border-black/10 dark:border-white/10">
                <h4 className="text-sm font-black">{businessSettings?.business_name || 'Corbel Supply Co.'}</h4>
                <p className="text-[10px] text-slate-400 font-sans">{businessSettings?.address || 'Inventory & POS Operations'}</p>
                <p className="text-[11px] mt-1 text-emerald-400">Invoice: {completedSale.invoice_number}</p>
              </div>

              <div className="flex flex-col gap-1 py-1">
                {completedSale.items.map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span className="truncate pr-2">{it.quantity}x {it.product_name}</span>
                    <span>{currencySymbol}{it.line_total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-black/10 dark:border-white/10 flex flex-col gap-0.5">
                <div className="flex justify-between">
                  <span>Grand Total</span>
                  <span className="font-bold">{currencySymbol}{completedSale.grand_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Paid ({completedSale.payment_method})</span>
                  <span>{currencySymbol}{completedSale.paid_amount.toFixed(2)}</span>
                </div>
                {completedSale.change_due > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Change Due</span>
                    <span>{currencySymbol}{completedSale.change_due.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border ${
                  isDark ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Printer size={13} />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="px-5 py-2 rounded-full text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md"
              >
                Done / Next Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

