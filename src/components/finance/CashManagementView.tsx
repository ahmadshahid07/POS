import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CashSession, CashMovement } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Coins, ArrowDownLeft, ArrowUpRight, Lock, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export const CashManagementView: React.FC = () => {
  const { user, businessSettings, addNotification } = useAppStore();
  const currency = businessSettings?.currency || '₨';

  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Open Drawer Form
  const [openingBalance, setOpeningBalance] = useState('5000');
  const [openingLoading, setOpeningLoading] = useState(false);

  // Close Drawer Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closingLoading, setClosingLoading] = useState(false);

  const fetchSession = async () => {
    try {
      setLoading(true);
      if (window.skythsAPI) {
        const session = await window.skythsAPI.getActiveCashSession();
        setActiveSession(session);
        if (session) {
          const m = await window.skythsAPI.getCashMovements(session.id);
          setMovements(m || []);
        } else {
          setMovements([]);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch cash session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(openingBalance);
    if (isNaN(amount) || amount < 0) {
      addNotification({ title: 'Invalid Amount', message: 'Enter a valid opening cash balance.', type: 'danger' });
      return;
    }

    try {
      setOpeningLoading(true);
      if (window.skythsAPI) {
        const s = await window.skythsAPI.openCashSession({ userId: user.id, openingBalance: amount });
        setActiveSession(s);
        addNotification({ title: 'Drawer Opened', message: `Cash session #${s.id} opened with ${currency} ${amount.toLocaleString()}`, type: 'success' });
        await fetchSession();
      }
    } catch (err: any) {
      addNotification({ title: 'Failed to Open Drawer', message: err.message || 'Error occurred.', type: 'danger' });
    } finally {
      setOpeningLoading(false);
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !user) return;
    const actual = parseFloat(actualCash);
    if (isNaN(actual) || actual < 0) {
      addNotification({ title: 'Invalid Count', message: 'Enter valid actual counted cash.', type: 'danger' });
      return;
    }

    try {
      setClosingLoading(true);
      if (window.skythsAPI) {
        const s = await window.skythsAPI.closeCashSession({
          sessionId: activeSession.id,
          actualCash: actual,
          closingNotes,
          userId: user.id
        });
        addNotification({
          title: 'Session Closed & Reconciled',
          message: `Closed with difference: ${currency} ${s.difference?.toLocaleString()}`,
          type: s.difference === 0 ? 'success' : 'warning'
        });
        setIsCloseModalOpen(false);
        setActualCash('');
        setClosingNotes('');
        await fetchSession();
      }
    } catch (err: any) {
      addNotification({ title: 'Closure Failed', message: err.message, type: 'danger' });
    } finally {
      setClosingLoading(false);
    }
  };

  // Calculations for active session
  let totalSales = 0;
  let totalRefunds = 0;
  let totalExpenses = 0;
  let currentExpected = activeSession ? activeSession.opening_balance : 0;

  for (const m of movements) {
    if (m.movement_type === 'sale') {
      totalSales += m.amount;
      currentExpected += m.amount;
    } else if (m.movement_type === 'refund') {
      totalRefunds += m.amount;
      currentExpected -= m.amount;
    } else if (m.movement_type === 'expense' || m.movement_type === 'drop') {
      totalExpenses += m.amount;
      currentExpected -= m.amount;
    }
  }

  const countedVal = parseFloat(actualCash || '0');
  const previewDiff = isNaN(countedVal) ? 0 : Math.round((countedVal - currentExpected) * 100) / 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#080808] flex items-center gap-2">
            <Coins className="text-[#353536]" size={22} />
            Cash Management & Drawer Reconciliation
          </h1>
          <p className="text-xs text-[#706F70]">
            Track cash float, drawer inflows/outflows, cash sales, and end-of-day reconciliation.
          </p>
        </div>

        {activeSession && (
          <div className="flex items-center gap-3">
            <Button variant="danger" size="sm" onClick={() => setIsCloseModalOpen(true)}>
              <Lock size={15} />
              Close Session & Reconcile
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#706F70]">Loading cash drawer status...</div>
      ) : !activeSession ? (
        /* No active cash session: Open session card */
        <div className="max-w-xl mx-auto py-8">
          <GlassCard className="p-6 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-[#080808] text-white flex items-center justify-center mx-auto shadow-glass-md">
              <Coins size={28} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#080808]">No Active Cash Drawer Session</h2>
              <p className="text-xs text-[#706F70] mt-1 max-w-sm mx-auto">
                Open a new cash session with your initial cash drawer float to record cash sales and daily drawer drops.
              </p>
            </div>

            <form onSubmit={handleOpenSession} className="space-y-4 max-w-xs mx-auto text-left">
              <Input
                label={`Opening Cash Float (${currency})`}
                type="number"
                step="any"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="5000"
                required
              />

              <Button type="submit" variant="primary" className="w-full" disabled={openingLoading}>
                <Coins size={16} />
                {openingLoading ? 'Opening Drawer...' : 'Open Cash Drawer Session'}
              </Button>
            </form>
          </GlassCard>
        </div>
      ) : (
        /* Active session details */
        <div className="space-y-6">
          {/* Active Banner */}
          <div className="p-4 rounded-xl bg-white border border-black/10 shadow-glass-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#080808]">Session #{activeSession.id} Active</span>
                  <Badge variant="success">Open</Badge>
                </div>
                <div className="text-[11px] text-[#706F70] flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Opened: {new Date(activeSession.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>Cashier: {activeSession.user_name || user?.username}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#706F70]">Current Expected Cash</span>
              <div className="text-xl font-bold font-mono text-[#080808]">
                {currency} {currentExpected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="p-4">
              <div className="text-[11px] font-medium text-[#706F70]">Opening Float</div>
              <div className="text-lg font-bold font-mono text-[#080808] mt-1">
                {currency} {activeSession.opening_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Starting cash in drawer</span>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
                <ArrowDownLeft size={13} /> Cash Sales (+)
              </div>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
                + {currency} {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Collected in cash today</span>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="text-[11px] font-medium text-amber-800 flex items-center gap-1">
                <ArrowUpRight size={13} /> Cash Refunds (-)
              </div>
              <div className="text-lg font-bold font-mono text-amber-700 mt-1">
                - {currency} {totalRefunds.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Returned to customers</span>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="text-[11px] font-medium text-[#DC2626] flex items-center gap-1">
                <ArrowUpRight size={13} /> Cash Expenses (-)
              </div>
              <div className="text-lg font-bold font-mono text-[#DC2626] mt-1">
                - {currency} {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Operating drawer payouts</span>
            </GlassCard>
          </div>

          {/* Movements Ledger Table */}
          <GlassCard className="overflow-hidden">
            <div className="p-4 border-b border-black/5 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#080808] uppercase tracking-wider">Drawer Movements Ledger</h3>
                <p className="text-[11px] text-[#706F70]">All cash activities recorded during session #{activeSession.id}</p>
              </div>
              <span className="text-[11px] font-mono text-[#706F70]">{movements.length} transactions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5 bg-[#EBEDF1]/60 text-[10px] font-mono uppercase tracking-wider text-[#706F70]">
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Reason / Notes</th>
                    <th className="py-2.5 px-4">Reference</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-xs">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#706F70]">
                        No movements recorded yet in this session.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => {
                      const isPositive = m.movement_type === 'opening' || m.movement_type === 'sale' || m.movement_type === 'adjustment';
                      return (
                        <tr key={m.id} className="hover:bg-black/[0.02] transition-colors">
                          <td className="py-2.5 px-4 font-mono text-[#706F70] text-[11px]">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="uppercase text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-black/5 text-[#353536]">
                              {m.movement_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#353536] max-w-xs truncate">{m.reason || '—'}</td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#706F70]">{m.reference_id || '—'}</td>
                          <td className={`py-2.5 px-4 text-right font-mono font-semibold ${isPositive ? 'text-emerald-700' : 'text-[#DC2626]'}`}>
                            {isPositive ? '+' : '-'} {currency} {m.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Close Drawer Reconciliation Modal */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="End of Day Drawer Reconciliation"
        maxWidth="md"
      >
        <form onSubmit={handleCloseSession} className="space-y-4">
          <div className="p-3 rounded-lg bg-black/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#706F70]">Expected Drawer Cash:</span>
              <span className="font-mono font-bold text-[#080808]">
                {currency} {currentExpected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <Input
            label={`Physical Counted Cash (${currency})`}
            type="number"
            step="any"
            min="0"
            value={actualCash}
            onChange={(e) => setActualCash(e.target.value)}
            placeholder="Enter counted physical notes & coins"
            required
            autoFocus
          />

          {actualCash !== '' && (
            <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              previewDiff === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : previewDiff > 0
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {previewDiff === 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>
                  {previewDiff === 0
                    ? 'Drawer Balanced Perfectly'
                    : previewDiff > 0
                    ? 'Cash Surplus / Overage'
                    : 'Cash Shortage / Deficit'}
                </span>
              </div>
              <span className="font-mono font-bold">
                {previewDiff > 0 ? '+' : ''} {currency} {previewDiff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#353536] mb-1">Closing Notes / Discrepancy Reason</label>
            <textarea
              className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-1 focus:ring-[#080808]"
              rows={2}
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="e.g. End of day cash verified by manager. Petty cash transferred to safe."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
            <Button variant="ghost" size="sm" onClick={() => setIsCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" disabled={closingLoading}>
              <Lock size={15} />
              {closingLoading ? 'Closing...' : 'Confirm & Finalize Closure'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
