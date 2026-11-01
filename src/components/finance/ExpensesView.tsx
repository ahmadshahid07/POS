import React, { useEffect, useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Expense, ExpenseCategory } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Wallet, Plus, RefreshCw, Calendar } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { businessSettings, user } = useAppStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Expense Form
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [payee, setPayee] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const loadData = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const rows = await (window as any).skythsAPI.getExpenses({ limit: 100 });
        const cats = await (window as any).skythsAPI.getExpenseCategories();
        setExpenses(rows || []);
        setCategories(cats || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!amount || Number(amount) <= 0) {
      setError('Expense amount must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        await (window as any).skythsAPI.createExpense({
          categoryId: categoryId ? Number(categoryId) : null,
          expenseDate,
          amount: Number(amount),
          paymentMethod,
          payee: payee.trim() || undefined,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
          userId: user?.id || null,
        });
      }
      setAmount('');
      setPayee('');
      setReference('');
      setNotes('');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wallet size={20} /> Operating Expenses Management
          </h1>
          <p className="text-xs text-[#ACADB1]">
            Track overhead costs, rent, electricity, packaging, payroll, and maintenance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadData}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <GlassCard className="p-4 flex items-center justify-between">
        <div>
          <span className="text-xs text-[#ACADB1] uppercase tracking-wider block">
            Total Recorded Expenses
          </span>
          <span className="text-2xl font-bold font-mono text-white">
            {currencySymbol} {totalExpenses.toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-[#ACADB1] text-right">
          <span>Integrated into Net Operating Profit calculations</span>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D4D8DF]">
            <thead className="bg-white/5 text-[#ACADB1] uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
              <tr>
                <th className="py-3 px-4">Expense #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payee / Vendor</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Notes / Purpose</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">{exp.expense_number}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#ACADB1]">{exp.expense_date}</td>
                  <td className="py-3 px-4 font-medium text-white">{exp.category_name || 'General Overhead'}</td>
                  <td className="py-3 px-4 text-[#D4D8DF]">{exp.payee || '—'}</td>
                  <td className="py-3 px-4 font-mono uppercase text-[11px] text-[#ACADB1]">{exp.payment_method}</td>
                  <td className="py-3 px-4 text-[#ACADB1]">{exp.notes || '—'}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {currencySymbol} {exp.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {expenses.length === 0 && !loading && (
            <div className="py-16 text-center text-xs text-[#706F70]">
              No expenses recorded yet. Click "Add Expense" to track shop operating costs.
            </div>
          )}
        </div>
      </GlassCard>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Business Operating Expense"
        subtitle="Deducted from store cash drawer (if paid by cash) and incorporated into Net Profit."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#F87171]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#ACADB1]">Expense Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="rounded-xl bg-[#0E0E0F]/80 border border-white/10 px-3 py-2 text-sm text-[#EBEDF1] focus:outline-none focus:border-white/40"
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            type="number"
            min="1"
            step="0.01"
            label="Amount (₨) *"
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
            placeholder="0.00"
            required
            autoFocus
          />

          <Input
            type="date"
            label="Expense Date *"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#ACADB1]">Payment Channel *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-xl bg-[#0E0E0F]/80 border border-white/10 px-3 py-2 text-sm text-[#EBEDF1]"
            >
              <option value="cash">Cash (Auto-deducted from Active Drawer Session)</option>
              <option value="bank_transfer">Bank Account</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
            </select>
          </div>

          <Input
            label="Payee / Recipient"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="e.g. Landlord, Utility Company, Staff Name"
          />

          <Input
            label="Receipt / Bill Reference Number"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. Utility bill consumer number or voucher"
          />

          <Input
            label="Description / Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Shop monthly rent for October"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
