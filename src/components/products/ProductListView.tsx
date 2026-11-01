import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { ProductFormModal } from './ProductFormModal';
import { StockAdjustmentModal } from '../stock/StockAdjustmentModal';
import { BarcodeLabelModal } from './BarcodeLabelModal';
import { Product, ProductCategory, ProductUnit, Supplier } from '../../types';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Sliders,
  Barcode,
  Package,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const ProductListView: React.FC = () => {
  const { businessSettings, setActiveView } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [adjustmentProduct, setAdjustmentProduct] = useState<Product | null>(null);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);

  const [labelProduct, setLabelProduct] = useState<Product | null>(null);
  const [isLabelOpen, setIsLabelOpen] = useState(false);

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const loadData = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const prodRes = await (window as any).skythsAPI.getProducts({
          search: search.trim() || undefined,
          categoryId: selectedCategory ? Number(selectedCategory) : undefined,
          status: selectedStatus || undefined,
          lowStockOnly: lowStockFilter || undefined,
        });
        const catRes = await (window as any).skythsAPI.getCategories();
        const unitRes = await (window as any).skythsAPI.getUnits();
        const supRes = await (window as any).skythsAPI.getSuppliers();

        setProducts(prodRes.products || []);
        setCategories(catRes || []);
        setUnits(unitRes || []);
        setSuppliers(supRes || []);
      }
    } catch (err) {
      console.error('Failed to load products catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, selectedStatus, lowStockFilter]);

  // CSV Export
  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ['ID', 'SKU', 'Barcode', 'Name', 'Category', 'Cost Price', 'Selling Price', 'Current Stock', 'Min Threshold', 'Status'];
    const rows = products.map((p) => [
      p.id,
      `"${p.sku}"`,
      `"${p.barcode || ''}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category_name || ''}"`,
      p.cost_price,
      p.selling_price,
      p.current_stock,
      p.min_stock_threshold,
      p.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skyths_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert('CSV file is empty or missing headers.');
          return;
        }

        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
          if (parts.length >= 4) {
            const sku = parts[1] || `SKU-${Date.now()}-${i}`;
            const name = parts[3] || parts[0];
            const cost = Number(parts[5] || 0);
            const price = Number(parts[6] || parts[4] || 0);
            const stock = Number(parts[7] || 0);

            if (name && sku) {
              try {
                if (typeof window !== 'undefined' && (window as any).skythsAPI) {
                  await (window as any).skythsAPI.createProduct({
                    name,
                    sku,
                    cost_price: cost,
                    selling_price: price,
                    current_stock: stock,
                    min_stock_threshold: 5,
                    status: 'active',
                  });
                  importedCount++;
                }
              } catch (_) {}
            }
          }
        }
        alert(`Successfully imported ${importedCount} product(s) into database.`);
        loadData();
      } catch (err: any) {
        alert(`Import error: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package size={20} /> Products & Inventory Management
          </h1>
          <p className="text-xs text-[#ACADB1]">
            Track SKUs, barcodes, physical stock, costs, and selling margins.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            <span className="inline-flex items-center justify-center text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#D4D8DF] hover:bg-white/10 transition-colors gap-1.5">
              <Upload size={14} /> Import CSV
            </span>
          </label>

          <Button
            size="sm"
            variant="outline"
            leftIcon={<Download size={14} />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadData}
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => {
              setEditingProduct(null);
              setIsAddEditOpen(true);
            }}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <GlassCard className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#706F70]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, barcode..."
              className="w-full bg-[#0E0E0F] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#706F70] focus:outline-none focus:border-white/30"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
            className="bg-[#0E0E0F] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#0E0E0F] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>

          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              lowStockFilter
                ? 'bg-[#DC2626]/20 border-[#DC2626]/40 text-[#F87171]'
                : 'bg-white/5 border-white/10 text-[#ACADB1] hover:text-white hover:bg-white/10'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Low Stock Alerts Only</span>
          </button>
        </div>
      </GlassCard>

      {/* Products Data Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D4D8DF]">
            <thead className="bg-white/5 text-[#ACADB1] uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
              <tr>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((prod) => {
                const isOutOfStock = prod.current_stock <= 0;
                const isLowStock = prod.current_stock > 0 && prod.current_stock <= prod.min_stock_threshold;

                return (
                  <tr key={prod.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      <div>{prod.sku}</div>
                      {prod.barcode && <div className="text-[10px] text-[#706F70]">{prod.barcode}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{prod.name}</div>
                      {prod.brand && <div className="text-[10px] text-[#706F70]">{prod.brand}</div>}
                    </td>
                    <td className="py-3 px-4 text-[#ACADB1]">{prod.category_name || 'General'}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {currencySymbol} {prod.cost_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {currencySymbol} {prod.selling_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-mono font-bold text-white">
                        {prod.current_stock} <span className="text-[10px] font-normal text-[#706F70]">{prod.unit_abbreviation || 'pcs'}</span>
                      </div>
                      <div className="text-[9px] text-[#706F70]">Alert at: {prod.min_stock_threshold}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}
                        size="sm"
                      >
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setAdjustmentProduct(prod);
                            setIsAdjustmentOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-[#ACADB1] hover:text-white hover:bg-white/10"
                          title="Audit / Adjust Stock"
                        >
                          <Sliders size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setLabelProduct(prod);
                            setIsLabelOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-[#ACADB1] hover:text-white hover:bg-white/10"
                          title="Print Barcode Labels"
                        >
                          <Barcode size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setIsAddEditOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-[#ACADB1] hover:text-white hover:bg-white/10"
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {products.length === 0 && !loading && (
            <div className="py-16 text-center text-xs text-[#706F70]">
              No products found matching the criteria. Click "+ Add Product" to register your first item.
            </div>
          )}
        </div>
      </GlassCard>

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        productToEdit={editingProduct}
        categories={categories}
        units={units}
        suppliers={suppliers}
        onSave={loadData}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        product={adjustmentProduct}
        onAdjusted={loadData}
      />

      {/* Barcode Label Modal */}
      <BarcodeLabelModal
        isOpen={isLabelOpen}
        onClose={() => setIsLabelOpen(false)}
        product={labelProduct}
        businessSettings={businessSettings}
      />
    </div>
  );
};
