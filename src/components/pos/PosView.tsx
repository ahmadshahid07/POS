import React, { useEffect, useState, useRef } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ReceiptModal } from './ReceiptModal';
import { Product, Customer, ProductCategory, SaleDetail, PaymentMethod } from '../../types';
import { playBarcodeBeep, playLowStockAlertSound, playCheckoutSuccessSound } from '../../utils/audioAlerts';
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
} from 'lucide-react';

export const PosView: React.FC = () => {
  const { user, businessSettings } = useAppStore();
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

  // Quick Customer Creation
  const [isQuickCustOpen, setIsQuickCustOpen] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');
  const [quickCustLoading, setQuickCustLoading] = useState(false);
  const [quickCustError, setQuickCustError] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const loadData = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const prodRes = await (window as any).skythsAPI.getProducts({ status: 'active' });
        const catRes = await (window as any).skythsAPI.getCategories();
        const custRes = await (window as any).skythsAPI.getCustomers();
        setProducts(prodRes.products || []);
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

  // Keyboard Shortcuts (F2: barcode search, F4: clear cart, Enter/F9: complete sale)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (items.length > 0 && window.confirm('Clear current cart?')) {
          clearCart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, clearCart]);

  // Audio helper for item addition & low stock detection
  const handleAddItemWithSound = (prod: Product, qty: number = 1) => {
    try {
      addItem(prod, qty);
      const isSound = businessSettings?.sound_effects_enabled !== false;
      const isLowStockSound = businessSettings?.low_stock_chime_enabled !== false;
      const threshold = prod.min_stock_threshold ?? 5;

      if (isLowStockSound && prod.current_stock <= threshold) {
        playLowStockAlertSound();
      } else if (isSound) {
        playBarcodeBeep();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle USB Barcode scan on Enter
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setError(null);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const prod = await (window as any).skythsAPI.getProductByCode(barcodeInput.trim());
        if (prod) {
          handleAddItemWithSound(prod, 1);
          setBarcodeInput('');
        } else {
          setError(`No product found with barcode/SKU: ${barcodeInput}`);
        }
      } else {
        const found = products.find(
          (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
        );
        if (found) {
          handleAddItemWithSound(found, 1);
          setBarcodeInput('');
        } else {
          setError(`Item not found: ${barcodeInput}`);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === null || p.category_id === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCat && matchesQuery;
  });

  const subtotal = getSubtotal();
  const orderDiscount = getOrderDiscount();
  const taxAmount = getTaxAmount();
  const grandTotal = getGrandTotal();
  const changeDue = getChangeDue();
  const balanceDue = getBalanceDue();

  // Quick cash buttons helper
  const handleQuickCash = (amount: number) => {
    setPaymentMethod('cash');
    setTenderedAmount(amount);
  };

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim()) return;
    setQuickCustLoading(true);
    setQuickCustError(null);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const newCust = await (window as any).skythsAPI.createCustomer({
          name: quickCustName.trim(),
          phone: quickCustPhone.trim() || undefined,
        });
        setCustomers((prev) => [...prev, newCust]);
        setSelectedCustomer(newCust);
        setQuickCustName('');
        setQuickCustPhone('');
        setIsQuickCustOpen(false);
      } else {
        const mockCust: Customer = {
          id: Date.now(),
          name: quickCustName.trim(),
          phone: quickCustPhone.trim() || null,
          email: null,
          address: null,
          notes: null,
          total_purchases: 0,
          total_paid: 0,
          balance_receivable: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCustomers((prev) => [...prev, mockCust]);
        setSelectedCustomer(mockCust);
        setQuickCustName('');
        setQuickCustPhone('');
        setIsQuickCustOpen(false);
      }
    } catch (err: any) {
      setQuickCustError(err.message || 'Failed to create customer');
    } finally {
      setQuickCustLoading(false);
    }
  };

  // Complete Sale
  const handleCompleteSale = async () => {
    setError(null);
    if (items.length === 0) {
      setError('Cart is empty. Please add items to checkout.');
      return;
    }

    setCheckoutLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const sale = await (window as any).skythsAPI.checkout({
          cart: items,
          customerId: selectedCustomer?.id || null,
          discountType,
          discountAmount,
          taxRate,
          paidAmount: paymentMethod === 'cod' ? 0 : tenderedAmount,
          paymentMethod,
          notes,
          cashierId: user?.id || null,
        });

        // Trigger audio chime (low stock alert if any item hit threshold, else success chime)
        const anyLowStock = items.some(
          (i) => i.product.current_stock - i.quantity <= (i.product.min_stock_threshold ?? 5)
        );
        if (businessSettings?.low_stock_chime_enabled !== false && anyLowStock) {
          playLowStockAlertSound();
        } else if (businessSettings?.sound_effects_enabled !== false) {
          playCheckoutSuccessSound();
        }

        setCompletedSale(sale);
        setIsReceiptOpen(true);
        clearCart();
        loadData(); // Refresh product stock counts
      } else {
        // Browser demo preview checkout
        const fakeSale: SaleDetail = {
          id: Date.now(),
          invoice_number: `INV-${Date.now().toString().slice(-4)}`,
          customer_id: selectedCustomer?.id || null,
          customer_name: selectedCustomer?.name || 'Walk-in Customer',
          sale_date: new Date().toISOString(),
          status: 'completed',
          payment_status: paymentMethod === 'cod' ? 'pending_cod' : tenderedAmount >= grandTotal ? 'paid' : 'partial',
          subtotal,
          discount_type: discountType,
          discount_amount: orderDiscount,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          grand_total: grandTotal,
          paid_amount: paymentMethod === 'cod' ? 0 : Math.min(tenderedAmount, grandTotal),
          change_due: changeDue,
          balance_due: balanceDue,
          payment_method: paymentMethod,
          cashier_id: user?.id || 1,
          cashier_name: user?.username || 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: items.map((i, idx) => ({
            id: idx + 1,
            sale_id: 1,
            product_id: i.product.id,
            product_name: i.product.name,
            sku: i.product.sku,
            quantity: i.quantity,
            unit_price: i.unit_price,
            cost_price_snapshot: i.product.cost_price,
            discount: 0,
            line_total: i.line_total,
          })),
          payments: [],
        };
        setCompletedSale(fakeSale);
        setIsReceiptOpen(true);
        clearCart();
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4 select-none animate-in fade-in duration-200">
      {/* LEFT PANEL: PRODUCT CATALOG & BARCODE SCANNER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden gap-3">
        {/* Search & Scanner Bar */}
        <GlassCard className="p-3 shrink-0 flex items-center gap-3">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Barcode size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#706F70]" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode or Type SKU (Enter to add)... [F2]"
                className="w-full bg-[#0E0E0F] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#706F70] focus:outline-none focus:border-white/30 font-mono"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Scan
            </Button>
          </form>

          {/* Text filter */}
          <div className="relative w-48 hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#706F70]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter catalog..."
              className="w-full bg-[#0E0E0F] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-[#706F70] focus:outline-none focus:border-white/30"
            />
          </div>
        </GlassCard>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === null
                ? 'bg-white text-black font-semibold shadow-glass-sm'
                : 'bg-white/5 text-[#ACADB1] hover:bg-white/10 hover:text-white'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-white text-black font-semibold shadow-glass-sm'
                  : 'bg-white/5 text-[#ACADB1] hover:bg-white/10 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {error && (
            <div className="p-3 mb-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 flex items-center gap-2 text-xs text-[#F87171]">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((prod) => {
              const isOutOfStock = prod.current_stock <= 0;
              const isLowStock = prod.current_stock > 0 && prod.current_stock <= prod.min_stock_threshold;

              return (
                <div
                  key={prod.id}
                  onClick={() => {
                    if (!isOutOfStock) {
                      handleAddItemWithSound(prod, 1);
                    }
                  }}
                  className={`relative p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between text-left select-none ${
                    isOutOfStock
                      ? 'bg-black/40 border-white/5 opacity-50 cursor-not-allowed'
                      : 'bg-[#141415]/80 hover:bg-[#1E1E20] border-white/10 hover:border-white/20 hover:scale-[1.01] cursor-pointer shadow-glass-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] text-[#706F70] font-mono truncate">{prod.sku}</span>
                      <Badge
                        variant={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'outline'}
                        size="sm"
                      >
                        {isOutOfStock ? 'Out' : isLowStock ? `${prod.current_stock} left` : 'In Stock'}
                      </Badge>
                    </div>
                    <h4 className="text-xs font-medium text-white line-clamp-2 leading-snug">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-white">
                      {currencySymbol} {prod.selling_price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#ACADB1]">
                      {prod.current_stock} {prod.unit_abbreviation || 'pcs'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && !loading && (
            <div className="py-16 text-center text-xs text-[#706F70]">
              No matching products found in this category.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CART & CHECKOUT TERMINAL */}
      <GlassCard className="w-full lg:w-96 flex flex-col h-full shrink-0 p-4 border-white/15">
        {/* Customer Selector */}
        <div className="pb-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
            <User size={15} className="text-[#ACADB1] shrink-0" />
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                const found = customers.find((c) => c.id === id);
                setSelectedCustomer(found || null);
              }}
              className="bg-[#0E0E0F] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-white/30 flex-1 min-w-0"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.balance_receivable > 0 ? `(Due: ${currencySymbol} ${c.balance_receivable})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setQuickCustError(null);
                setIsQuickCustOpen(true);
              }}
              title="Quick Add Customer"
              className="p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-[#D4D8DF] hover:text-white transition-colors shrink-0"
            >
              <UserPlus size={14} />
            </button>
          </div>

          {items.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all items from cart?')) {
                  clearCart();
                }
              }}
              title="Clear Cart (F4)"
              className="text-[#706F70] hover:text-[#F87171] p-1 rounded transition-colors text-xs flex items-center gap-1"
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>

        {/* Cart Line Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-2 divide-y divide-white/5 pr-1">
          {items.map((item) => (
            <div key={item.product.id} className="py-2 flex items-center justify-between text-xs gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{item.product.name}</div>
                <div className="text-[10px] text-[#706F70] font-mono">
                  {currencySymbol} {item.unit_price} × {item.quantity}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1.5 bg-[#0E0E0F] p-0.5 rounded-lg border border-white/10">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="p-1 rounded text-[#ACADB1] hover:text-white hover:bg-white/10"
                >
                  <Minus size={11} />
                </button>
                <span className="w-6 text-center font-mono font-bold text-white text-xs">
                  {item.quantity}
                </span>
                <button
                  onClick={() => {
                    try {
                      updateQuantity(item.product.id, item.quantity + 1);
                    } catch (err: any) {
                      setError(err.message);
                    }
                  }}
                  className="p-1 rounded text-[#ACADB1] hover:text-white hover:bg-white/10"
                >
                  <Plus size={11} />
                </button>
              </div>

              {/* Line Total */}
              <div className="w-16 text-right font-mono font-semibold text-white">
                {currencySymbol} {item.line_total.toFixed(0)}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="py-14 text-center text-xs text-[#706F70] flex flex-col items-center gap-2">
              <ShoppingCart size={28} className="opacity-40" />
              <span>Cart is empty. Scan barcode or click items to add.</span>
            </div>
          )}
        </div>

        {/* Financial Totals & Discounts Breakdown */}
        <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-[#ACADB1]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono text-white">{currencySymbol} {subtotal.toFixed(2)}</span>
          </div>

          {/* Discount Bar */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px]">Discount:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-16 bg-[#0E0E0F] border border-white/10 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white"
              />
              <button
                onClick={() => setDiscountType(discountType === 'fixed' ? 'percentage' : 'fixed')}
                className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white font-mono"
              >
                {discountType === 'fixed' ? currencySymbol : '%'}
              </button>
            </div>
          </div>

          <div className="flex justify-between text-base font-bold text-white border-t border-b border-white/10 py-1.5 my-1">
            <span>Grand Total:</span>
            <span className="font-mono text-xl">{currencySymbol} {grandTotal.toFixed(2)}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-1 pt-1">
            {(
              [
                { id: 'cash', label: 'Cash', icon: <Banknote size={12} /> },
                { id: 'card', label: 'Card', icon: <CreditCard size={12} /> },
                { id: 'easypaisa', label: 'Easypaisa', icon: <Smartphone size={12} /> },
                { id: 'jazzcash', label: 'JazzCash', icon: <Smartphone size={12} /> },
                { id: 'bank_transfer', label: 'Bank', icon: <CreditCard size={12} /> },
                { id: 'cod', label: 'COD', icon: <Truck size={12} /> },
              ] as const
            ).map((pm) => (
              <button
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-medium border transition-all cursor-pointer ${
                  paymentMethod === pm.id
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-white/5 text-[#ACADB1] border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                {pm.icon}
                <span>{pm.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Cash Buttons & Tender Input */}
          {paymentMethod === 'cash' && (
            <div className="pt-2 space-y-1.5">
              <div className="flex gap-1">
                {[grandTotal, Math.ceil(grandTotal / 500) * 500, Math.ceil(grandTotal / 1000) * 1000].map(
                  (amt, idx) =>
                    amt > 0 && (
                      <button
                        key={idx}
                        onClick={() => handleQuickCash(amt)}
                        className="flex-1 py-1 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-[#D4D8DF] transition-colors"
                      >
                        {currencySymbol} {amt}
                      </button>
                    )
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#ACADB1]">Tendered:</span>
                <input
                  type="number"
                  min="0"
                  value={tenderedAmount || ''}
                  onChange={(e) => setTenderedAmount(Number(e.target.value) || 0)}
                  placeholder={grandTotal.toString()}
                  className="w-24 bg-[#0E0E0F] border border-white/10 rounded px-2 py-1 text-right font-mono text-sm text-white font-bold"
                />
              </div>

              {changeDue > 0 && (
                <div className="flex justify-between text-xs text-[#4ADE80] font-bold">
                  <span>Change Due:</span>
                  <span className="font-mono">{currencySymbol} {changeDue.toFixed(2)}</span>
                </div>
              )}
              {balanceDue > 0 && (
                <div className="flex justify-between text-xs text-[#FBBF24] font-bold">
                  <span>Remaining Balance:</span>
                  <span className="font-mono">{currencySymbol} {balanceDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Complete Checkout Button */}
          <Button
            size="lg"
            className="w-full mt-3 py-3"
            isLoading={checkoutLoading}
            disabled={items.length === 0}
            onClick={handleCompleteSale}
          >
            Complete Sale ({currencySymbol} {grandTotal.toFixed(0)}) [Enter]
          </Button>
        </div>
      </GlassCard>

      {/* Receipt & Invoice Print Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={completedSale}
        businessSettings={businessSettings}
        onNewSale={() => {
          barcodeInputRef.current?.focus();
        }}
      />

      {/* Quick Customer Add Modal */}
      <Modal
        isOpen={isQuickCustOpen}
        onClose={() => setIsQuickCustOpen(false)}
        title="Quick Add Customer"
        subtitle="Register customer details and attach directly to current sale"
        maxWidth="sm"
      >
        <form onSubmit={handleQuickCreateCustomer} className="space-y-4">
          {quickCustError && (
            <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#F87171]">
              {quickCustError}
            </div>
          )}

          <Input
            label="Full Name *"
            value={quickCustName}
            onChange={(e) => setQuickCustName(e.target.value)}
            placeholder="e.g. Tariq Mehmood"
            autoFocus
            required
          />

          <Input
            label="Mobile Phone Number"
            value={quickCustPhone}
            onChange={(e) => setQuickCustPhone(e.target.value)}
            placeholder="e.g. +92 300 1234567"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsQuickCustOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={quickCustLoading}>
              Save & Attach
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
