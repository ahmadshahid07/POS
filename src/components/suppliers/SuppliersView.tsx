import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Supplier } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Truck, Plus, RefreshCw, Phone, MapPin, Mail, Edit2, Trash2, AlertTriangle, Building2 } from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { businessSettings } = useAppStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const rows = await (window as any).skythsAPI.getSuppliers();
        setSuppliers(rows || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setTaxNumber('');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contact_person || '');
    setPhone(s.phone || '');
    setEmail(s.email || '');
    setAddress(s.address || '');
    setTaxNumber(s.tax_number || '');
    setNotes(s.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        if (editingSupplier) {
          await (window as any).skythsAPI.updateSupplier(editingSupplier.id, {
            name: name.trim(),
            contact_person: contactPerson.trim() || null,
            phone: phone.trim() || null,
            email: email.trim() || null,
            address: address.trim() || null,
            tax_number: taxNumber.trim() || null,
            notes: notes.trim() || null,
          });
        } else {
          await (window as any).skythsAPI.createSupplier({
            name: name.trim(),
            contact_person: contactPerson.trim() || undefined,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            tax_number: taxNumber.trim() || undefined,
            notes: notes.trim() || undefined,
          });
        }
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      setError(err.message || 'Failed to save supplier.');
    }
  };

  const handleDelete = async (s: Supplier) => {
    if (s.balance_payable > 0) {
      alert(`Cannot delete supplier "${s.name}" with an outstanding payable balance of ${currencySymbol} ${s.balance_payable}.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete supplier "${s.name}"?`)) return;

    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        await (window as any).skythsAPI.deleteSupplier(s.id);
      }
      loadSuppliers();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#353536] to-[#080808] border border-white/20">
              <Truck size={18} className="text-white" />
            </div>
            Suppliers & Payables Directory
          </h1>
          <p className="text-xs text-[#ACADB1] mt-0.5">
            Track vendors, wholesale distributors, purchase totals, and outstanding payable balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadSuppliers}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={handleOpenCreate}
          >
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <GlassCard key={s.id} className="p-4 flex flex-col justify-between border-white/10 hover:border-white/25 transition-all group">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#D4D8DF] group-hover:scale-105 transition-transform mt-0.5">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">{s.name}</h3>
                    {s.contact_person && (
                      <span className="text-xs text-[#ACADB1] block">{s.contact_person}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#706F70] uppercase font-mono block">Payable Due</span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      s.balance_payable > 0 ? 'text-[#FBBF24]' : 'text-[#4ADE80]'
                    }`}
                  >
                    {currencySymbol} {s.balance_payable.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3.5 space-y-1.5 text-xs text-[#ACADB1] pt-3 border-t border-white/5">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-[#706F70] shrink-0" />
                    <span className="font-mono text-[11px]">{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-[#706F70] shrink-0" />
                    <span className="truncate text-[11px]">{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-[#706F70] shrink-0" />
                    <span className="truncate text-[11px]">{s.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
              <div className="text-[#706F70] font-mono space-x-2">
                <span>Purchases: {currencySymbol} {s.total_purchases.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1.5 rounded-lg text-[#ACADB1] hover:text-white hover:bg-white/10 transition-colors"
                  title="Edit Supplier"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  className="p-1.5 rounded-lg text-[#706F70] hover:text-[#F87171] hover:bg-red-500/10 transition-colors"
                  title="Delete Supplier"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {suppliers.length === 0 && !loading && (
        <div className="py-16 text-center text-xs text-[#706F70] rounded-2xl border border-white/5 bg-white/[0.02]">
          No suppliers recorded yet. Click "Add Supplier" to register vendors.
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        subtitle={editingSupplier ? `Update vendor details for "${editingSupplier.name}"` : 'Record wholesale vendor details and payable terms'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 flex items-center gap-2 text-xs text-[#F87171]">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Supplier / Company Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Al-Madina Wholesale"
              autoFocus
              required
            />
            <Input
              label="Contact Person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Haji Usman"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +92 300 1234567"
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sales@vendor.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Physical Address / Market Location"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Shop #14, Grain Market, Lahore"
            />
            <Input
              label="NTN / Tax Number"
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="e.g. 1234567-8"
            />
          </div>

          <Input
            label="Internal Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Net-30 credit terms agreed"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
