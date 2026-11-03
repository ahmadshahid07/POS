import React, { useState, useEffect } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import { useAppStore } from '../../store/useAppStore';
import { CustomerStatement } from '../../types';
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  ShoppingBag,
  X,
  Check,
  Users,
  CreditCard,
  FileText,
  DollarSign,
  TrendingDown,
} from 'lucide-react';

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  spent: number;
  receivable: number;
  orders: number;
  segment: 'VIP' | 'Regular' | 'New';
  initials: string;
}

const DEMO_CUSTOMERS: CustomerItem[] = [
  { id: '1', name: 'Sophia Bennett', email: 'sophia.b@example.com', spent: 2840, receivable: 0, orders: 12, segment: 'VIP', initials: 'SB' },
  { id: '2', name: 'Liam Henderson', email: 'l.henderson@example.com', spent: 1420, receivable: 150, orders: 6, segment: 'Regular', initials: 'LH' },
  { id: '3', name: 'Emma Watson', email: 'emma.w@example.com', spent: 3950, receivable: 0, orders: 16, segment: 'VIP', initials: 'EW' },
  { id: '4', name: 'Noah Campbell', email: 'noah.c@example.com', spent: 480, receivable: 80, orders: 2, segment: 'New', initials: 'NC' },
  { id: '5', name: 'Olivia Miller', email: 'olivia.m@example.com', spent: 5120, receivable: 0, orders: 21, segment: 'VIP', initials: 'OM' },
  { id: '6', name: 'Ethan Brooks', email: 'ethan.b@example.com', spent: 890, receivable: 210, orders: 4, segment: 'Regular', initials: 'EB' },
];

export const CorbelCustomersView: React.FC = () => {
  const { theme } = useCorbelStore();
  const { businessSettings, addNotification } = useAppStore();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerItem[]>(DEMO_CUSTOMERS);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });

  // Payment on Account Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCustForPay, setSelectedCustForPay] = useState<CustomerItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Statement Modal
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [statementData, setStatementData] = useState<CustomerStatement | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const isDark = theme === 'dark';
  const currencySymbol = businessSettings?.currency_symbol || '$';

  const loadCustomers = async () => {
    try {
      if (window.skythsAPI && typeof window.skythsAPI.getCustomers === 'function') {
        const live = await window.skythsAPI.getCustomers();
        if (Array.isArray(live) && live.length > 0) {
          const mapped: CustomerItem[] = live.map((c: any) => {
            const spent = Number(c.total_purchases || 0);
            const receivable = Number(c.balance_receivable || 0);
            const segment: 'VIP' | 'Regular' | 'New' = spent > 2000 ? 'VIP' : spent > 500 ? 'Regular' : 'New';
            return {
              id: String(c.id),
              name: c.name,
              email: c.email || `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`,
              phone: c.phone || '',
              spent: spent,
              receivable: receivable,
              orders: c.total_orders || (spent > 2000 ? 12 : spent > 500 ? 5 : 1),
              segment,
              initials: c.name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase(),
            };
          });
          setCustomers(mapped);
        }
      }
    } catch (err) {
      console.warn('Using demo customers fallback:', err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    setIsLoading(true);

    try {
      if (window.skythsAPI && typeof window.skythsAPI.createCustomer === 'function') {
        await window.skythsAPI.createCustomer({
          name: newCustomer.name,
          email: newCustomer.email || null,
          phone: newCustomer.phone || null,
        });
        await loadCustomers();
        addNotification({
          title: 'Customer Registered',
          message: `${newCustomer.name} added to client accounts.`,
          type: 'success',
        });
      }
      setIsAddModalOpen(false);
      setNewCustomer({ name: '', email: '', phone: '' });
    } catch (err: any) {
      alert(`Error creating customer: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForPay || paymentAmount <= 0) return;
    setIsLoading(true);

    try {
      if (window.skythsAPI) {
        await window.skythsAPI.createPayment({
          transaction_type: 'customer_receipt',
          customer_id: Number(selectedCustForPay.id),
          amount: Number(paymentAmount),
          payment_method: 'cash',
          payment_date: new Date().toISOString(),
          notes: `Credit settlement by ${selectedCustForPay.name}`,
        });
        await loadCustomers();
        addNotification({
          title: 'Payment Recorded',
          message: `Received ${currencySymbol}${paymentAmount.toFixed(2)} from ${selectedCustForPay.name}.`,
          type: 'success',
        });
      }
      setIsPayModalOpen(false);
      setSelectedCustForPay(null);
      setPaymentAmount(0);
    } catch (err: any) {
      alert(`Payment error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenStatement = async (cust: CustomerItem) => {
    setStatementLoading(true);
    setIsStatementOpen(true);
    try {
      if (window.skythsAPI && typeof window.skythsAPI.getCustomerStatement === 'function') {
        const stmt = await window.skythsAPI.getCustomerStatement(
          Number(cust.id),
          '2026-01-01',
          new Date().toISOString().split('T')[0]
        );
        setStatementData(stmt);
      }
    } catch (err) {
      console.warn('Could not load customer statement:', err);
    } finally {
      setStatementLoading(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Customers & Credit
          </h1>
          <p className="text-xs text-slate-400 mt-1">Client accounts, purchase loyalty & credit receivables ({customers.length} registered)</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 pr-4 py-1.5 rounded-full text-xs border outline-none ${isDark
                ? 'bg-[#15181D] border-white/10 text-white focus:border-white/30'
                : 'bg-white border-slate-200 text-slate-900 focus:border-slate-400'
                }`}
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all ${isDark ? 'bg-white text-black font-bold hover:bg-slate-200' : 'bg-[#121316] text-white font-bold hover:bg-black'
              }`}
          >
            <UserPlus size={14} />
            <span>Add customer</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => (
          <div
            key={customer.id}
            className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${isDark
              ? 'bg-[#15181D] border-white/10 shadow-lg text-white hover:border-white/20'
              : 'bg-white border-slate-200/80 shadow-sm text-slate-900 hover:border-slate-300'
              }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${isDark ? 'bg-[#22272F] text-white' : 'bg-slate-100 text-slate-800'
                      }`}
                  >
                    {customer.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold">{customer.name}</h4>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${customer.segment === 'VIP'
                          ? 'bg-amber-500/15 text-amber-500'
                          : customer.segment === 'Regular'
                            ? 'bg-blue-500/15 text-blue-500'
                            : 'bg-emerald-500/15 text-emerald-500'
                          }`}
                      >
                        {customer.segment}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{customer.email}</p>
                    {customer.phone && <p className="text-[10px] text-slate-500 font-mono">{customer.phone}</p>}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenStatement(customer)}
                  className={`p-1.5 rounded-full border text-slate-400 hover:text-white transition-colors ${
                    isDark ? 'border-white/10 hover:bg-white/10' : 'border-slate-200 hover:bg-slate-100'
                  }`}
                  title="View Statement of Account"
                >
                  <FileText size={13} />
                </button>
              </div>

              {/* Receivables Alert Pill */}
              {customer.receivable > 0 && (
                <div className="mt-3 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">Balance Due</span>
                    <span className="font-mono font-bold text-amber-500">${customer.receivable.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCustForPay(customer);
                      setPaymentAmount(customer.receivable);
                      setIsPayModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors shadow-sm"
                  >
                    Receive Payment
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Lifetime Spend</span>
                <span className="font-mono font-bold text-sm">${customer.spent.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Orders Count</span>
                <span className="font-semibold">{customer.orders} orders</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Customer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#15181D] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-500" />
                <h3 className="font-bold text-base">Register New Customer</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="flex flex-col gap-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="e.g. Eleanor Vance"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="e.g. eleanor@example.com"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="e.g. +1 555-0192"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-full font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                >
                  {isLoading ? 'Registering...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment on Account */}
      {isPayModalOpen && selectedCustForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#15181D] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-bold text-base mb-1">Receive Credit Settlement</h3>
            <p className="text-xs text-slate-400 mb-4 pb-2 border-b border-black/10 dark:border-white/10">
              Customer: {selectedCustForPay.name} (Due: ${selectedCustForPay.receivable.toFixed(2)})
            </p>
            <form onSubmit={handleRecordPayment} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Amount Received ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  max={selectedCustForPay.receivable}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-mono font-bold ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-1.5 rounded-full text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-1.5 rounded-full font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Customer Statement */}
      {isStatementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-xl p-6 rounded-3xl border shadow-2xl flex flex-col gap-4 ${
            isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <h3 className="font-bold text-base">Statement of Account</h3>
                <p className="text-xs text-slate-400">Chronological transaction history & running balance</p>
              </div>
              <button onClick={() => setIsStatementOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X size={16} />
              </button>
            </div>

            {statementLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading ledger...</div>
            ) : statementData && statementData.transactions.length > 0 ? (
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-150 text-slate-500'}`}>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Ref</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 text-right">Debit</th>
                      <th className="py-2 px-3 text-right">Credit</th>
                      <th className="py-2 px-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {statementData.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{tx.date}</td>
                        <td className="py-2 px-3 font-bold">{tx.reference}</td>
                        <td className="py-2 px-3 uppercase text-[10px]">{tx.type}</td>
                        <td className="py-2 px-3 text-right text-red-400">
                          {tx.debit > 0 ? `$${tx.debit.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400">
                          {tx.credit > 0 ? `$${tx.credit.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-current">
                          ${tx.running_balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No transactions recorded for this account.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsStatementOpen(false)}
                className="px-5 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
