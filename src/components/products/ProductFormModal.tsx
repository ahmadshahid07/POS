import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Product, ProductCategory, ProductUnit, Supplier } from '../../types';
import { Sparkles, Barcode } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  categories: ProductCategory[];
  units: ProductUnit[];
  suppliers: Supplier[];
  onSave: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
  units,
  suppliers,
  onSave,
}) => {
  const isEditing = !!productToEdit;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>('');
  const [minSellingPrice, setMinSellingPrice] = useState<number | ''>('');
  const [openingStock, setOpeningStock] = useState<number>(0);
  const [minStockThreshold, setMinStockThreshold] = useState<number>(5);
  const [unitId, setUnitId] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'discontinued'>('active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode || '');
      setCategoryId(productToEdit.category_id || '');
      setBrand(productToEdit.brand || '');
      setDescription(productToEdit.description || '');
      setCostPrice(productToEdit.cost_price);
      setSellingPrice(productToEdit.selling_price);
      setWholesalePrice(productToEdit.wholesale_price || '');
      setMinSellingPrice(productToEdit.min_selling_price || '');
      setMinStockThreshold(productToEdit.min_stock_threshold);
      setUnitId(productToEdit.unit_id || '');
      setSupplierId(productToEdit.supplier_id || '');
      setStatus(productToEdit.status);
    } else {
      setName('');
      setSku('');
      setBarcode('');
      setCategoryId('');
      setBrand('');
      setDescription('');
      setCostPrice('');
      setSellingPrice('');
      setWholesalePrice('');
      setMinSellingPrice('');
      setOpeningStock(0);
      setMinStockThreshold(5);
      setUnitId('');
      setSupplierId('');
      setStatus('active');
    }
    setError(null);
  }, [productToEdit, isOpen]);

  const generateAutoSku = () => {
    const prefix = name ? name.slice(0, 3).toUpperCase() : 'SKU';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${rand}`);
  };

  const generateAutoBarcode = () => {
    const num = '896' + Math.floor(100000000 + Math.random() * 900000000).toString();
    setBarcode(num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !sku.trim()) {
      setError('Product Name and SKU are required.');
      return;
    }
    if (costPrice === '' || Number(costPrice) < 0) {
      setError('Cost price must be 0 or greater.');
      return;
    }
    if (sellingPrice === '' || Number(sellingPrice) < 0) {
      setError('Selling price must be 0 or greater.');
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Product> = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || null,
        category_id: categoryId ? Number(categoryId) : null,
        brand: brand.trim() || null,
        description: description.trim() || null,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        wholesale_price: wholesalePrice !== '' ? Number(wholesalePrice) : null,
        min_selling_price: minSellingPrice !== '' ? Number(minSellingPrice) : null,
        min_stock_threshold: Number(minStockThreshold),
        unit_id: unitId ? Number(unitId) : null,
        supplier_id: supplierId ? Number(supplierId) : null,
        status,
      };

      if (!isEditing) {
        payload.current_stock = Number(openingStock);
      }

      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        if (isEditing && productToEdit) {
          await (window as any).skythsAPI.updateProduct(productToEdit.id, payload);
        } else {
          await (window as any).skythsAPI.createProduct(payload);
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Product: ${productToEdit?.name}` : 'Add New Product'}
      subtitle="Configure SKU, barcode, unit cost, selling price, and stock levels."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#F87171]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Product Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Basmati Rice 5KG"
              required
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-[#ACADB1] tracking-wide block mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl bg-[#0E0E0F]/80 border border-white/10 px-3 py-2 text-sm text-[#EBEDF1] focus:outline-none focus:border-white/40"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#ACADB1]">SKU (Item Code) *</label>
              <button
                type="button"
                onClick={generateAutoSku}
                className="text-[10px] text-[#ACADB1] hover:text-white flex items-center gap-1"
              >
                <Sparkles size={11} /> Auto-Generate
              </button>
            </div>
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="e.g. RICE-5KG"
              required
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#ACADB1]">Barcode / EAN</label>
              <button
                type="button"
                onClick={generateAutoBarcode}
                className="text-[10px] text-[#ACADB1] hover:text-white flex items-center gap-1"
              >
                <Barcode size={12} /> Generate EAN
              </button>
            </div>
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 896400010001"
            />
          </div>

          <Input
            type="number"
            min="0"
            step="0.01"
            label="Purchase Cost Price (₨) *"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
            placeholder="0.00"
            required
          />

          <Input
            type="number"
            min="0"
            step="0.01"
            label="Selling Price (₨) *"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
            placeholder="0.00"
            required
          />

          <Input
            type="number"
            min="0"
            step="0.01"
            label="Wholesale Price (₨)"
            value={wholesalePrice}
            onChange={(e) => setWholesalePrice(e.target.value ? Number(e.target.value) : '')}
            placeholder="Optional"
          />

          <Input
            type="number"
            min="0"
            step="0.01"
            label="Minimum Selling Price (₨)"
            value={minSellingPrice}
            onChange={(e) => setMinSellingPrice(e.target.value ? Number(e.target.value) : '')}
            placeholder="Floor Price"
          />

          {!isEditing && (
            <Input
              type="number"
              min="0"
              label="Opening Stock Quantity"
              value={openingStock}
              onChange={(e) => setOpeningStock(Number(e.target.value))}
            />
          )}

          <Input
            type="number"
            min="0"
            label="Low Stock Warning Level"
            value={minStockThreshold}
            onChange={(e) => setMinStockThreshold(Number(e.target.value))}
          />

          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-[#ACADB1] tracking-wide block mb-1">
              Unit of Measure
            </label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl bg-[#0E0E0F]/80 border border-white/10 px-3 py-2 text-sm text-[#EBEDF1] focus:outline-none focus:border-white/40"
            >
              <option value="">Default (Pieces)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.abbreviation})
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-[#ACADB1] tracking-wide block mb-1">
              Preferred Supplier
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl bg-[#0E0E0F]/80 border border-white/10 px-3 py-2 text-sm text-[#EBEDF1] focus:outline-none focus:border-white/40"
            >
              <option value="">None / Multiple</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
