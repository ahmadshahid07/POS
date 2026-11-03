import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { ProductCategory } from '../../types';
import { Layers, Plus, RefreshCw, Folder, Edit2, Trash2, Tag, AlertTriangle } from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const cats = await (window as any).skythsAPI.getCategories();
        setCategories(cats || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setCode('');
    setDescription('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ProductCategory) => {
    setEditingCategory(c);
    setName(c.name);
    setCode(c.code || '');
    setDescription(c.description || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        if (editingCategory) {
          await (window as any).skythsAPI.updateCategory({
            id: editingCategory.id,
            name: name.trim(),
            code: code.trim().toUpperCase() || null,
            description: description.trim() || null,
          });
        } else {
          await (window as any).skythsAPI.createCategory({
            name: name.trim(),
            code: code.trim().toUpperCase() || null,
            description: description.trim() || null,
          });
        }
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to save category.');
    }
  };

  const handleDelete = async (c: ProductCategory) => {
    const confirmMsg = c.product_count && c.product_count > 0
      ? `Delete category "${c.name}"? ${c.product_count} product(s) will be unassigned to General.`
      : `Are you sure you want to delete category "${c.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        await (window as any).skythsAPI.deleteCategory(c.id);
      }
      loadCategories();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#353536] to-[#080808] border border-white/20">
              <Layers size={18} className="text-white" />
            </div>
            Product Categories
          </h1>
          <p className="text-xs text-[#ACADB1] mt-0.5">
            Organize inventory into clear retail departments and searchable POS groupings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadCategories}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={handleOpenCreate}
          >
            New Category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <GlassCard key={c.id} className="p-4 flex flex-col justify-between border-white/10 hover:border-white/25 transition-all group">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white group-hover:scale-105 transition-transform">
                    <Folder size={18} className="text-[#D4D8DF]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">{c.name}</h3>
                    {c.code && (
                      <span className="text-[10px] text-[#706F70] font-mono tracking-wider flex items-center gap-1 mt-0.5">
                        <Tag size={10} /> {c.code}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-white font-mono font-medium">
                  {c.product_count || 0} items
                </span>
              </div>

              {c.description && (
                <p className="text-xs text-[#ACADB1] mt-3 line-clamp-2 leading-relaxed">{c.description}</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-[#706F70] font-mono">
                Added: {c.created_at.slice(0, 10)}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 rounded-lg text-[#ACADB1] hover:text-white hover:bg-white/10 transition-colors"
                  title="Edit Category"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="p-1.5 rounded-lg text-[#706F70] hover:text-[#F87171] hover:bg-red-500/10 transition-colors"
                  title="Delete Category"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <div className="py-16 text-center text-xs text-[#706F70] rounded-2xl border border-white/5 bg-white/[0.02]">
          No categories found. Click "New Category" to organize your products.
        </div>
      )}

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        subtitle={editingCategory ? `Update details for "${editingCategory.name}"` : 'Create a department for product categorization'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 flex items-center gap-2 text-xs text-[#F87171]">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Category Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Beverages & Soft Drinks"
            autoFocus
            required
          />

          <Input
            label="Category Code (Optional)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. BEV"
          />

          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Juices, carbonated drinks, and mineral water"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
