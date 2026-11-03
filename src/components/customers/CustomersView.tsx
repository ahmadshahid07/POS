import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { CustomerStatementModal } from './CustomerStatementModal';
import { Customer } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Users, Plus, RefreshCw, Phone, MapPin, Mail, CreditCard, DollarSign, FileText, Edit2, Trash2, AlertTriangle, UserCheck } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { businessSettings, user } = useAppStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Statement of Account Modal
  const [selectedCustForStatement, setSelectedCustForStatement] = useState<Customer | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  // Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Payment Form State
  const [selectedCustForPay, setSelectedCustForPay] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payRef, setPayRef] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const loadCustomers = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const rows = await (window as any).skythsAPI.getCustomers();
        setCustomers(rows || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setError(null);
    setIsAddOpen(true);
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        if (editingCustomer) {
          await (window as any).skythsAPI.updateCustomer(editingCustomer.id, {
            name: name.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            address: address.trim() || null,
            notes: notes.trim() || null,
          });
        } else {
          await (window as any).skythsAPI.createCustomer({
            name: name.trim(),
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            notes: notes.trim() || undefined,
          });
        }
      }
      setIsAddOpen(false);
      loadCustomers();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer.');
    }
  };

  const handleDeleteCustomer = async (c: Customer) => {
    if (c.balance_receivable > 0) {
      alert(`Cannot delete customer "${c.name}" with an outstanding balance of ${currencySymbol} ${c.balance_receivable}.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete customer "${c.name}"?`)) return;

    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        await (window as any).skythsAPI.deleteCustomer(c.id);
      }
      loadCustomers();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForPay || !payAmount || Number(payAmount) <= 0) return;

    setPayLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        await (window as any).skythsAPI.recordCustomerPayment({
          customerId: selectedCustForPay.id,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          referenceNumber: payRef.trim() || undefined,
          userId: user?.id || null,
        });
      }
      setSelectedCustForPay(null);
      setPayAmount('');
      setPayRef('');
      loadCustomers();
    } catch (err: any) {
      alert(`Payment record failed: ${err.message}`);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#353536] to-[#080808] border border-white/20">
              <Users size={18} className="text-white" />
            </div>
            Customers & Credit Accounts
          </h1>
          <p className="text-xs text-[#ACADB1] mt-0.5">
            Maintain customer ledgers, track credit receivables, record payments, and export account statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadCustomers}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={handleOpenAdd}
          >
            Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <GlassCard key={c.id} className="p-4 flex flex-col justify-between border-white/10 hover:border-white/25 transition-all group">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#D4D8DF] group-hover:scale-105 transition-transform mt-0.5">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">{c.name}</h3>
                    {c.phone && <span className="text-xs text-[#ACADB1] block font-mono">{c.phone}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#706F70] uppercase font-mono block">Receivable</span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      c.balance_receivable > 0 ? 'text-[#FBBF24]' : 'text-[#4ADE80]'
                    }`}
                  >
                    {currencySymbol} {c.balance_receivable.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3.5 space-y-1 text-xs text-[#ACADB1] pt-3 border-t border-white/5">
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-[#706F70] shrink-0" />
                    <span className="truncate text-[11px]">{c.email}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-[#706F70] shrink-0" />
                    <span className="truncate text-[11px]">{c.address}</span>
                  </div>
                )}
                {c.notes && (
                  <p className="text-[11px] text-[#706F70] italic line-clamp-1">{c.notes}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-[#706F70] font-mono">
                Sales: {currencySymbol} {c.total_purchases.toLocaleString()}
              </span>

              <div className="flex items-center gap-1">
                {c.balance_receivable > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    leftIcon={<DollarSign size={12} />}
                    onClick={() => {
                      setSelectedCustForPay(c);
                      setPayAmount(c.balance_receivable);
                    }}
                  >
                    Pay
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px]"
                  leftIcon={<FileText size={12} />}
                  onClick={() => {
                    setSelectedCustForStatement(c);
                    setIsStatementOpen(true);
                  }}
                >
                  Statement
                </Button>
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 rounded-lg text-[#ACADB1] hover:text-white hover:bg-white/10 transition-colors"
                  title="Edit Customer"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDeleteCustomer(c)}
                  className="p-1.5 rounded-lg text-[#706F70] hover:text-[#F87171] hover:bg-red-500/10 transition-colors"
                  title="Delete Customer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {customers.length === 0 && !loading && (
        <div className="py-16 text-center text-xs text-[#706F70] rounded-2xl border border-white/5 bg-white/[0.02]">
          No customers registered yet. Click "Add Customer" to create accounts.
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        subtitle={editingCustomer ? `Update information for "${editingCustomer.name}"` : 'Register a customer for credit sales, history, and receipts'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitCustomer} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 flex items-center gap-2 text-xs text-[#F87171]">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Full Name / Store Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tariq Mehmood"
            autoFocus
            required
          />

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
              placeholder="e.g. customer@email.com"
            />
          </div>

          <Input
            label="Physical Address / Delivery Location"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. House 42, Street 5, Model Town"
          />

          <Input
            label="Notes / Terms (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Wholesale buyer, credit limit PKR 50,000"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingCustomer ? 'Update Customer' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!selectedCustForPay}
        onClose={() => setSelectedCustForPay(null)}
        title="Record Customer Payment"
        subtitle={`Collect receivable from ${selectedCustForPay?.name || ''}`}
        maxWidth="sm"
      >
        <form onSubmit={handleRecordPayment} className="flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center text-xs">
            <span className="text-[#ACADB1]">Total Outstanding Due:</span>
            <span className="font-mono font-bold text-[#FBBF24]">
              {currencySymbol} {selectedCustForPay?.balance_receivable.toLocaleString()}
            </span>
          </div>

          <Input
            label="Payment Amount *"
            type="number"
            step="any"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
            placeholder="0.00"
            autoFocus
            required
          />

          <div>
            <label className="text-xs font-medium text-[#ACADB1] block mb-1.5">
              Payment Channel
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full bg-[#0E0E0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
            >
              <option value="cash">Cash In Hand</option>
              <option value="bank_transfer">Bank Wire / Transfer</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
              <option value="cheque">Bank Cheque</option>
            </select>
          </div>

          <Input
            label="Reference / Slip Number (Optional)"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
            placeholder="e.g. TRX-992384"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setSelectedCustForPay(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={payLoading}>
              Confirm Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Statement Modal */}
      {selectedCustForStatement && (
        <CustomerStatementModal
          isOpen={isStatementOpen}
          onClose={() => {
            setIsStatementOpen(false);
            setSelectedCustForStatement(null);
          }}
          customer={selectedCustForStatement}
          businessSettings={businessSettings}
        />
      )}
    </div>
  );
};
