import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Supplier } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Truck, Plus, RefreshCw, Phone, MapPin } from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { businessSettings } = useAppStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
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
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTaxNumber('');
      setNotes('');
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      setError(err.message || 'Failed to create supplier.');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Truck size={20} /> Suppliers & Payables Directory
          </h1>
          <p className="text-xs text-[#ACADB1]">
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
            onClick={() => setIsModalOpen(true)}
          >
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <GlassCard key={s.id} className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                  {s.contact_person && (
                    <span className="text-xs text-[#ACADB1]">{s.contact_person}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#706F70] uppercase block">Payable Balance</span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      s.balance_payable > 0 ? 'text-[#FBBF24]' : 'text-[#4ADE80]'
                    }`}
                  >
                    {currencySymbol} {s.balance_payable.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-[#ACADB1]">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#706F70]" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-[#706F70]" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#706F70]">
              <span>Purchases: {currencySymbol} {s.total_purchases.toLocaleString()}</span>
              <span>Paid: {currencySymbol} {s.total_paid.toLocaleString()}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {suppliers.length === 0 && !loading && (
        <div className="py-16 text-center text-xs text-[#706F70]">
          No suppliers recorded yet. Click "Add Supplier" to register vendors.
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Supplier"
        subtitle="Record vendor contact details and initial information"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#F87171]">
              {error}
            </div>
          )}

          <Input
            label="Supplier / Company Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Al-Madina Trading Co."
            required
            autoFocus
          />

          <Input
            label="Contact Person"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Tariq Mehmood"
          />

          <Input
            label="Phone / Mobile *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 0000000"
          />

          <Input
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vendor@company.com"
          />

          <Input
            label="Office / Warehouse Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Badami Bagh, Lahore"
          />

          <Input
            label="Tax / STRN / NTN Number"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
            placeholder="Optional"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Supplier</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
