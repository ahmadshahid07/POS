import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Product, Supplier, BusinessSettings } from '../../types';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  suppliers: Supplier[];
  businessSettings: BusinessSettings | null;
  onSaved: () => void;
}

interface PurchaseItemRow {
  productId: number;
  quantity: number;
  unitCost: number;
}

export const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
  isOpen,
  onClose,
  products,
  suppliers,
  businessSettings,
  onSaved,
}) => {
  const { user } = useAppStore();
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [invoiceReference, setInvoiceReference] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<PurchaseItemRow[]>([]);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const addItemRow = () => {
    if (products.length === 0) return;
    setItems([
      ...items,
      {
        productId: products[0].id,
        quantity: 10,
        unitCost: products[0].cost_price || 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const updateItemRow = (index: number, field: keyof PurchaseItemRow, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError('Please select a supplier.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product to receive.');
      return;
    }
    for (const item of items) {
      if (item.quantity <= 0 || item.unitCost < 0) {
        setError('Quantities must be greater than 0 and costs cannot be negative.');
        return;
      }
    }

    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        await (window as any).skythsAPI.createPurchase({
          supplierId: Number(supplierId),
          invoiceReference: invoiceReference.trim() || undefined,
          purchaseDate,
          items,
          paidAmount: Number(paidAmount || 0),
          paymentMethod,
          notes: notes.trim() || undefined,
          userId: user?.id || null,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record purchase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Supplier Purchase & Receive Stock"
      subtitle="Receives inventory, automatically updates Weighted Average Cost (WAC), and tracks supplier payables."
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#F87171]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-[#ACADB1] tracking-wide block mb-1">
              Select Supplier *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl bg-[#0E0E0F]/80 border border-white/10 px-3 py-2 text-sm text-[#EBEDF1] focus:outline-none focus:border-white/40"
              required
            >
              <option value="">Choose Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Payable: {currencySymbol} {s.balance_payable.toFixed(0)})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Supplier Invoice Reference"
            value={invoiceReference}
            onChange={(e) => setInvoiceReference(e.target.value)}
            placeholder="e.g. SUP-INV-9921"
          />

          <Input
            type="date"
            label="Purchase Date *"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />
        </div>

        {/* Purchase Items List */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Received Products List</span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<Plus size={13} />}
              onClick={addItemRow}
            >
              Add Product Line
            </Button>
          </div>

          <div className="divide-y divide-white/5 border border-white/10 rounded-xl bg-[#0E0E0F] overflow-hidden">
            {items.map((row, idx) => (
              <div key={idx} className="p-2.5 flex items-center gap-3 text-xs">
                {/* Product Dropdown */}
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={row.productId}
                    onChange={(e) => {
                      const pid = Number(e.target.value);
                      const prod = products.find((p) => p.id === pid);
                      updateItemRow(idx, 'productId', pid);
                      if (prod) updateItemRow(idx, 'unitCost', prod.cost_price);
                    }}
                    className="w-full bg-[#141415] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — Current Stock: {p.current_stock}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => updateItemRow(idx, 'quantity', Number(e.target.value))}
                    placeholder="Qty"
                    className="w-full bg-[#141415] border border-white/10 rounded-lg px-2 py-1.5 text-center font-mono text-xs text-white"
                  />
                </div>

                {/* Unit Cost */}
                <div className="w-28">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.unitCost}
                    onChange={(e) => updateItemRow(idx, 'unitCost', Number(e.target.value))}
                    placeholder="Cost Price"
                    className="w-full bg-[#141415] border border-white/10 rounded-lg px-2 py-1.5 text-right font-mono text-xs text-white"
                  />
                </div>

                {/* Line Total */}
                <div className="w-28 text-right font-mono font-bold text-white">
                  {currencySymbol} {(row.quantity * row.unitCost).toFixed(2)}
                </div>

                <button
                  type="button"
                  onClick={() => removeItemRow(idx)}
                  className="p-1 rounded text-[#706F70] hover:text-[#F87171]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            {items.length === 0 && (
              <div className="py-8 text-center text-xs text-[#706F70]">
                No items added. Click "Add Product Line" to select received items.
              </div>
            )}
          </div>
        </div>

        {/* Totals & Payment Details */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <span className="text-xs text-[#ACADB1] block">Total Purchase Volume:</span>
            <span className="text-xl font-bold font-mono text-white">
              {currencySymbol} {totalAmount.toFixed(2)}
            </span>
          </div>

          <Input
            type="number"
            min="0"
            label="Amount Paid to Supplier"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
            placeholder={totalAmount.toString()}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#ACADB1]">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="bg-[#0E0E0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="cash">Cash Payment</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} leftIcon={<ShoppingBag size={15} />}>
            Confirm & Receive Stock
          </Button>
        </div>
      </form>
    </Modal>
  );
};
