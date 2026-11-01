import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { ProductCategory } from '../../types';
import { Layers, Plus, RefreshCw, Folder } from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        await (window as any).skythsAPI.createCategory({
          name: name.trim(),
          code: code.trim().toUpperCase() || null,
          description: description.trim() || null,
        });
      }
      setName('');
      setCode('');
      setDescription('');
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to create category.');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers size={20} /> Product Categories
          </h1>
          <p className="text-xs text-[#ACADB1]">
            Organize inventory into clear departments and retail categories.
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
            onClick={() => setIsModalOpen(true)}
          >
            New Category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <GlassCard key={c.id} className="p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white/5 text-white">
                  <Folder size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                  {c.code && <span className="text-[10px] text-[#706F70] font-mono">{c.code}</span>}
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">
                {c.product_count || 0} items
              </span>
            </div>

            {c.description && (
              <p className="text-xs text-[#ACADB1] mt-3 line-clamp-2">{c.description}</p>
            )}

            <div className="mt-4 pt-2 border-t border-white/5 text-[10px] text-[#706F70]">
              Created: {c.created_at.slice(0, 10)}
            </div>
          </GlassCard>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <div className="py-16 text-center text-xs text-[#706F70]">
          No categories found. Click "New Category" to organize your products.
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Category"
        subtitle="Create a department for product categorization"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#F87171]">
              {error}
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
            <Button type="submit">Create Category</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
