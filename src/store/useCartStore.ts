import { create } from 'zustand';
import { Product, Customer, CartItem, PaymentMethod } from '../types';

interface CartState {
  items: CartItem[];
  selectedCustomer: Customer | null;
  discountType: 'percentage' | 'fixed';
  discountAmount: number;
  taxRate: number;
  paymentMethod: PaymentMethod;
  tenderedAmount: number;
  notes: string;

  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setDiscountType: (type: 'percentage' | 'fixed') => void;
  setDiscountAmount: (amount: number) => void;
  setTaxRate: (rate: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setTenderedAmount: (amount: number) => void;
  setNotes: (notes: string) => void;

  getSubtotal: () => number;
  getOrderDiscount: () => number;
  getTaxAmount: () => number;
  getGrandTotal: () => number;
  getChangeDue: () => number;
  getBalanceDue: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedCustomer: null,
  discountType: 'fixed',
  discountAmount: 0,
  taxRate: 0,
  paymentMethod: 'cash',
  tenderedAmount: 0,
  notes: '',

  addItem: (product, quantity = 1) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.product.id === product.id);

    if (existingIndex > -1) {
      const existing = items[existingIndex];
      const newQty = existing.quantity + quantity;
      if (newQty > product.current_stock) {
        throw new Error(`Cannot add more than available stock (${product.current_stock} available).`);
      }
      const updated = [...items];
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        line_total: newQty * existing.unit_price,
      };
      set({ items: updated });
    } else {
      if (quantity > product.current_stock) {
        throw new Error(`Cannot add ${quantity} units; only ${product.current_stock} in stock.`);
      }
      const newItem: CartItem = {
        product,
        quantity,
        unit_price: product.selling_price,
        discount: 0,
        line_total: quantity * product.selling_price,
      };
      set({ items: [...items, newItem] });
    }
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const { items } = get();
    const updated = items.map((item) => {
      if (item.product.id === productId) {
        if (quantity > item.product.current_stock) {
          throw new Error(`Requested ${quantity} exceeds available stock of ${item.product.current_stock}.`);
        }
        return {
          ...item,
          quantity,
          line_total: quantity * item.unit_price,
        };
      }
      return item;
    });
    set({ items: updated });
  },

  removeItem: (productId) => {
    set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) }));
  },

  clearCart: () => {
    set({
      items: [],
      selectedCustomer: null,
      discountAmount: 0,
      tenderedAmount: 0,
      notes: '',
    });
  },

  setSelectedCustomer: (selectedCustomer) => set({ selectedCustomer }),
  setDiscountType: (discountType) => set({ discountType }),
  setDiscountAmount: (discountAmount) => set({ discountAmount }),
  setTaxRate: (taxRate) => set({ taxRate }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setTenderedAmount: (tenderedAmount) => set({ tenderedAmount }),
  setNotes: (notes) => set({ notes }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.line_total, 0);
  },

  getOrderDiscount: () => {
    const subtotal = get().getSubtotal();
    const { discountType, discountAmount } = get();
    if (discountType === 'percentage') {
      return Math.round(subtotal * (discountAmount / 100) * 100) / 100;
    }
    return Math.min(discountAmount, subtotal);
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getOrderDiscount();
    const taxable = Math.max(0, subtotal - discount);
    const { taxRate } = get();
    return Math.round(taxable * (taxRate / 100) * 100) / 100;
  },

  getGrandTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getOrderDiscount();
    const tax = get().getTaxAmount();
    return Math.round((subtotal - discount + tax) * 100) / 100;
  },

  getChangeDue: () => {
    const total = get().getGrandTotal();
    const { tenderedAmount, paymentMethod } = get();
    if (paymentMethod === 'cod') return 0;
    return tenderedAmount >= total ? Math.round((tenderedAmount - total) * 100) / 100 : 0;
  },

  getBalanceDue: () => {
    const total = get().getGrandTotal();
    const { tenderedAmount, paymentMethod } = get();
    if (paymentMethod === 'cod') return total;
    return tenderedAmount < total ? Math.round((total - tenderedAmount) * 100) / 100 : 0;
  },
}));
