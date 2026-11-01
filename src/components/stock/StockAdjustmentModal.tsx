import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Product } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAdjusted: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onAdjusted,
}) => {
  const { user } = useAppStore();
  const [newStock, setNewStock] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'physical_count' | 'damage' | 'loss' | 'correction'>('physical_count');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const currentStock = product.current_stock;
  const difference = newStock !== '' ? Number(newStock) - currentStock : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newStock === '') {
      setError('Please enter the newly counted stock quantity.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this inventory adjustment.');
      return;
    }

    if (difference === 0) {
      setError('New quantity matches current recorded stock. No change detected.');
      return;
    }

    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        await (window as any).skythsAPI.adjustStock({
          productId: product.id,
          newQuantity: Number(newStock),
          reason: reason.trim(),
          adjustmentType,
          userId: user?.id || null,
        });
      }
      onAdjusted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Inventory Stock"
      subtitle={`Product: ${product.name} (${product.sku})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#F87171]">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <span className="text-[#ACADB1]">Currently Recorded Stock:</span>
          <span className="font-mono font-bold text-white text-sm">
            {currentStock} {product.unit_abbreviation || 'pcs'}
          </span>
        </div>

        <Input
          type="number"
          label="Actual Counted Physical Quantity *"
          value={newStock}
          onChange={(e) => setNewStock(e.target.value !== '' ? Number(e.target.value) : '')}
          placeholder="e.g. 25"
          autoFocus
          required
        />

        {newStock !== '' && (
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-[#ACADB1]">Stock Discrepancy:</span>
            <span
              className={`font-mono font-bold ${
                difference > 0
                  ? 'text-[#4ADE80]'
                  : difference < 0
                  ? 'text-[#F87171]'
                  : 'text-white'
              }`}
            >
              {difference > 0 ? `+${difference}` : difference}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#ACADB1]">Adjustment Reason Classification *</label>
          <select
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value as any)}
            className="rounded-xl bg-[#0E0E0F]/80 border border-white/10 px-3 py-2 text-sm text-[#EBEDF1] focus:outline-none focus:border-white/40"
          >
            <option value="physical_count">Physical Audit Count Verification</option>
            <option value="damage">Damaged Goods / Broken Stock</option>
            <option value="loss">Inventory Shrinkage / Missing Items</option>
            <option value="correction">Data Entry Correction</option>
          </select>
        </div>

        <Input
          label="Detailed Audit Reason *"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Monthly shelf audit count reconciliation"
          required
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Save Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
