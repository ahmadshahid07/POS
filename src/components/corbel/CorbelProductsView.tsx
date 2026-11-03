import React, { useState, useEffect } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import {
  Search,
  Plus,
  Filter,
  Tag,
  ArrowUpRight,
  X,
  Check,
  Package,
  Layers,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Sliders,
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  cost: number;
  salesMonth: number;
}

interface CategoryItem {
  id: number;
  name: string;
  code: string;
  description?: string;
  color?: string;
  product_count?: number;
}

interface StockMovementItem {
  id: number;
  product_name: string;
  sku: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string;
  reason?: string;
  created_at: string;
}

const DEMO_PRODUCTS: ProductItem[] = [
  { id: '1', name: 'Waffle Organic Bath Mat', sku: 'BATH-MAT-01', category: 'Bath & Home', stock: 142, price: 48.00, cost: 22.00, salesMonth: 284 },
  { id: '2', name: 'Sage Linen Bath Towel Set', sku: 'TOWL-SAGE-02', category: 'Bath & Home', stock: 89, price: 64.00, cost: 30.00, salesMonth: 195 },
  { id: '3', name: 'Hand-blown Ribbed Glass Carafe', sku: 'CRF-RBD-03', category: 'Kitchen & Dining', stock: 54, price: 52.00, cost: 24.00, salesMonth: 142 },
  { id: '4', name: 'Textured Stoneware Mug (Sand)', sku: 'MUG-SND-04', category: 'Kitchen & Dining', stock: 210, price: 24.00, cost: 9.50, salesMonth: 512 },
  { id: '5', name: 'Brushed Brass Taper Candle Holders', sku: 'CNDL-BRS-05', category: 'Decor', stock: 38, price: 78.00, cost: 34.00, salesMonth: 88 },
  { id: '6', name: 'Japanese Garden Shears (Forged)', sku: 'GARD-SHR-06', category: 'Garden & Tools', stock: 65, price: 92.00, cost: 45.00, salesMonth: 130 },
];

export const CorbelProductsView: React.FC = () => {
  const { theme } = useCorbelStore();
  const isDark = theme === 'dark';

  // Subtab: 'catalog' | 'categories' | 'movements'
  const [subtab, setSubtab] = useState<'catalog' | 'categories' | 'movements'>('catalog');

  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductItem[]>(DEMO_PRODUCTS);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovementItem[]>([]);

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);

  // Forms
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category_id: undefined as number | undefined,
    price: 0,
    cost: 0,
    stock: 0,
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    code: '',
    description: '',
  });

  const [adjustData, setAdjustData] = useState({
    productId: 0,
    newQuantity: 0,
    reason: '',
    adjustmentType: 'physical_count' as 'physical_count' | 'damage' | 'loss' | 'correction',
  });

  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      if (window.skythsAPI) {
        // Products
        const liveProducts = await window.skythsAPI.getProducts();
        if (Array.isArray(liveProducts) && liveProducts.length > 0) {
          const mapped: ProductItem[] = liveProducts.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            sku: p.sku,
            category: p.category_name || 'General',
            stock: Number(p.current_stock || 0),
            price: Number(p.selling_price || 0),
            cost: Number(p.cost_price || 0),
            salesMonth: p.sales_month || 0,
          }));
          setProducts(mapped);
        }

        // Categories
        const liveCats = await window.skythsAPI.getCategories();
        if (Array.isArray(liveCats)) {
          setCategories(liveCats);
        }

        // Stock Movements
        const liveMovements = await window.skythsAPI.getStockMovements({ limit: 100 });
        if (Array.isArray(liveMovements)) {
          setMovements(liveMovements);
        }
      }
    } catch (err) {
      console.warn('Using demo data fallback:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku) return;
    setIsLoading(true);

    try {
      if (window.skythsAPI) {
        await window.skythsAPI.createProduct({
          name: newProduct.name,
          sku: newProduct.sku,
          category_id: newProduct.category_id || null,
          selling_price: Number(newProduct.price),
          cost_price: Number(newProduct.cost),
          current_stock: Number(newProduct.stock),
          min_stock_threshold: 5,
          status: 'active',
        });
        await loadData();
      }
      setIsAddProductOpen(false);
      setNewProduct({ name: '', sku: '', category_id: undefined, price: 0, cost: 0, stock: 0 });
    } catch (err: any) {
      alert(`Error creating product: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    setIsLoading(true);

    try {
      if (window.skythsAPI) {
        await window.skythsAPI.createCategory(newCategory.name, newCategory.code || newCategory.name.slice(0, 4).toUpperCase(), newCategory.description);
        await loadData();
      }
      setIsAddCategoryOpen(false);
      setNewCategory({ name: '', code: '', description: '' });
    } catch (err: any) {
      alert(`Error creating category: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustData.productId) return;
    setIsLoading(true);

    try {
      if (window.skythsAPI) {
        await window.skythsAPI.adjustStock(adjustData);
        await loadData();
      }
      setIsAdjustStockOpen(false);
      setAdjustData({ productId: 0, newQuantity: 0, reason: '', adjustmentType: 'physical_count' });
    } catch (err: any) {
      alert(`Error adjusting stock: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div>
            <h1 className={`text-3xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Products & Stock
            </h1>
            <p className="text-xs text-slate-400 mt-1">Catalog items, inventory levels & adjustments ({products.length} registered)</p>
          </div>

          {/* Subtab Segmented Pill */}
          <div
            className={`flex items-center p-1 rounded-full border ${
              isDark ? 'bg-[#15181D] border-white/10' : 'bg-slate-200/70 border-slate-300/40'
            }`}
          >
            {(['catalog', 'categories', 'movements'] as const).map((tab) => {
              const active = subtab === tab;
              const labels = {
                catalog: 'Catalog Items',
                categories: 'Categories',
                movements: 'Stock Movements',
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

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {subtab === 'catalog' && (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`pl-9 pr-4 py-1.5 rounded-full text-xs border outline-none ${
                    isDark
                      ? 'bg-[#15181D] border-white/10 text-white focus:border-white/30'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-slate-400'
                  }`}
                />
              </div>

              <button
                onClick={() => setIsAddProductOpen(true)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all ${
                  isDark ? 'bg-white text-black font-bold hover:bg-slate-200' : 'bg-[#121316] text-white font-bold hover:bg-black'
                }`}
              >
                <Plus size={14} />
                <span>Add product</span>
              </button>
            </>
          )}

          {subtab === 'categories' && (
            <button
              onClick={() => setIsAddCategoryOpen(true)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all ${
                isDark ? 'bg-white text-black font-bold hover:bg-slate-200' : 'bg-[#121316] text-white font-bold hover:bg-black'
              }`}
            >
              <Plus size={14} />
              <span>New Category</span>
            </button>
          )}

          {subtab === 'movements' && (
            <button
              onClick={() => setIsAdjustStockOpen(true)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all ${
                isDark ? 'bg-emerald-500 text-black font-bold hover:bg-emerald-400' : 'bg-emerald-600 text-white font-bold hover:bg-emerald-700'
              }`}
            >
              <Sliders size={14} />
              <span>Adjust Stock</span>
            </button>
          )}
        </div>
      </div>

      {/* View 1: Catalog Items Grid */}
      {subtab === 'catalog' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between group ${
                isDark
                  ? 'bg-[#15181D] border-white/10 shadow-lg text-white hover:border-white/20'
                  : 'bg-white border-slate-200/80 shadow-sm text-slate-900 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {product.category}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">{product.sku}</span>
                </div>

                <h4 className="text-sm font-bold leading-snug group-hover:text-emerald-500 transition-colors">
                  {product.name}
                </h4>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Unit Price</span>
                  <span className="text-base font-black font-mono">${product.price.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Available Stock</span>
                  <span className={`text-xs font-bold ${product.stock <= 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {product.stock} units
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 2: Categories Management */}
      {subtab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className={`p-5 rounded-3xl border flex items-center justify-between ${
                isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs bg-emerald-500/10 text-emerald-500">
                  <Layers size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{c.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Code: {c.code}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}>
                {c.product_count || 0} products
              </span>
            </div>
          ))}
        </div>
      )}

      {/* View 3: Stock Movements Ledger */}
      {subtab === 'movements' && (
        <div className={`p-5 rounded-3xl border ${
          isDark ? 'bg-[#15181D] border-white/10 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-150 text-slate-500'}`}>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Qty Change</th>
                  <th className="py-3 px-4 font-semibold">Stock Ledger</th>
                  <th className="py-3 px-4 font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {movements.slice(0, 50).map((m) => (
                  <tr key={m.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold">{m.product_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.movement_type.includes('add') || m.movement_type === 'purchase' || m.movement_type === 'opening_stock'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-red-500/15 text-red-500'
                      }`}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {m.previous_stock} → <span className="font-bold text-current">{m.new_stock}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {m.reference_id || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Product */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#15181D] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-500" />
                <h3 className="font-bold text-base">Add New Product</h3>
              </div>
              <button onClick={() => setIsAddProductOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex flex-col gap-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Product Name</label>
                <input
                  required
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Ceramic Pour-Over Dripper"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">SKU Code</label>
                <input
                  required
                  type="text"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                  placeholder="e.g. DRP-CRM-01"
                  className={`w-full px-3 py-2 rounded-xl border font-mono outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({ ...newProduct, cost: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Selling Price ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                      isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Stock Units</label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 rounded-full font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-full font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                >
                  {isLoading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Category */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#15181D] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-bold text-base mb-4 pb-2 border-b border-black/10 dark:border-white/10">Add Category</h3>
            <form onSubmit={handleCreateCategory} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Category Name</label>
                <input
                  required
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g. Tableware"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Category Code</label>
                <input
                  type="text"
                  value={newCategory.code}
                  onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. TBLW"
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-mono ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-1.5 rounded-full text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-1.5 rounded-full font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Stock */}
      {isAdjustStockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#15181D] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-bold text-base mb-4 pb-2 border-b border-black/10 dark:border-white/10">Stock Adjustment</h3>
            <form onSubmit={handleAdjustStock} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Product</label>
                <select
                  required
                  value={adjustData.productId}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    const prod = products.find((p) => Number(p.id) === pid);
                    setAdjustData({
                      ...adjustData,
                      productId: pid,
                      newQuantity: prod ? prod.stock : 0,
                    });
                  }}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value={0}>Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target New Stock Quantity</label>
                <input
                  required
                  type="number"
                  value={adjustData.newQuantity}
                  onChange={(e) => setAdjustData({ ...adjustData, newQuantity: Number(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-mono font-bold ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Adjustment Reason</label>
                <input
                  required
                  type="text"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  placeholder="e.g. Physical stock count discrepancy"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockOpen(false)}
                  className="px-4 py-1.5 rounded-full text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-1.5 rounded-full font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
