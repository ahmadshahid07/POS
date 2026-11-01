import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { CustomerStatementModal } from './CustomerStatementModal';
import { Customer } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Users, Plus, RefreshCw, Phone, MapPin, CreditCard, DollarSign, FileText } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { businessSettings, user } = useAppStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Statement of Account Modal
  const [selectedCustForStatement, setSelectedCustForStatement] = useState<Customer | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  // New Customer Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Payment Form
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

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        await (window as any).skythsAPI.createCustomer({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setIsAddOpen(false);
      loadCustomers();
    } catch (err: any) {
      setError(err.message || 'Failed to create customer.');
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
      alert(`Payment error: ${err.message}`);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users size={20} /> Customers & Accounts Receivable
          </h1>
          <p className="text-xs text-[#ACADB1]">
            Customer profiles, transaction histories, and outstanding credit ledger balances.
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
            onClick={() => setIsAddOpen(true)}
          >
            Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <GlassCard key={c.id} className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                  {c.phone && <span className="text-xs text-[#ACADB1]">{c.phone}</span>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#706F70] uppercase block">Receivable Balance</span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      c.balance_receivable > 0 ? 'text-[#FBBF24]' : 'text-[#4ADE80]'
                    }`}
                  >
                    {currencySymbol} {c.balance_receivable.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-[#ACADB1]">
                {c.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-[#706F70]" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}
                {c.notes && (
                  <p className="text-[11px] text-[#706F70] italic line-clamp-1">{c.notes}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-[#706F70]">
                Purchases: {currencySymbol} {c.total_purchases.toLocaleString()}
              </span>

              <Button
                size="sm"
                variant="ghost"
                leftIcon={<FileText size={13} />}
                onClick={() => {
                  setSelectedCustForStatement(c);
                  setIsStatementOpen(true);
                }}
              >
                Statement
              </Button>
              {c.balance_receivable > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<DollarSign size={13} />}
                  onClick={() => {
                    setSelectedCustForPay(c);
                    setPayAmount(c.balance_receivable);
                  }}
                >
                  Receive Payment
                </Button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {customers.length === 0 && !loading && (
        <div className="py-16 text-center text-xs text-[#706F70]">
          No customers registered yet. Walk-in sales do not require registration, but registered customers can be given credit accounts.
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Customer"
        subtitle="Create a customer account for credit tracking and invoices"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#F87171]">
              {error}
            </div>
          )}

          <Input
            label="Customer Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Asad Ullah Khan"
            required
            autoFocus
          />

          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 0000000"
          />

          <Input
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@email.com"
          />

          <Input
            label="Home / Shop Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Street 4, Sector G-9, Islamabad"
          />

          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Credit limit or customer reference"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Register Customer</Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      {selectedCustForPay && (
        <Modal
          isOpen={!!selectedCustForPay}
          onClose={() => setSelectedCustForPay(null)}
          title={`Record Payment from ${selectedCustForPay.name}`}
          subtitle={`Current Outstanding Receivable: ${currencySymbol} ${selectedCustForPay.balance_receivable.toFixed(2)}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="flex flex-col gap-4">
            <Input
              type="number"
              min="1"
              max={selectedCustForPay.balance_receivable}
              label="Amount Received (₨) *"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
              required
              autoFocus
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#ACADB1]">Payment Channel *</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="rounded-xl bg-[#0E0E0F]/80 border border-white/10 px-3 py-2 text-sm text-[#EBEDF1]"
              >
                <option value="cash">Cash (Updates Cash Drawer)</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
              </select>
            </div>

            <Input
              label="Payment Reference / Slip #"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. Bank slip or transaction ID"
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
      )}

      {/* Customer Statement of Account Modal */}
      <CustomerStatementModal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        customer={selectedCustForStatement}
        businessSettings={businessSettings}
      />
    </div>
  );
};
