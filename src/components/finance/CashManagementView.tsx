import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CashSession, CashMovement } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Coins, ArrowDownLeft, ArrowUpRight, Lock, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

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
        setActiveSession(null);
        setActualCash('');
        setClosingNotes('');
        await fetchSession();
      }
    } catch (err: any) {
      addNotification({ title: 'Failed to Close Session', message: err.message, type: 'danger' });
    } finally {
      setClosingLoading(false);
    }
  };

  // Calculations for active session
  const totalSales = movements
    .filter((m) => m.movement_type === 'sale')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalRefunds = movements
    .filter((m) => m.movement_type === 'refund')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalExpenses = movements
    .filter((m) => m.movement_type === 'expense')
    .reduce((sum, m) => sum + m.amount, 0);

  const currentExpected = activeSession
    ? activeSession.opening_balance + totalSales - totalRefunds - totalExpenses
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#353536] to-[#080808] border border-white/20">
              <Coins className="text-white" size={20} />
            </div>
            Cash Management & Drawer Reconciliation
          </h1>
          <p className="text-xs text-[#ACADB1] mt-0.5">
            Track cash float, drawer inflows/outflows, cash sales, and end-of-day reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchSession}
          >
            Refresh
          </Button>
          {activeSession && (
            <Button variant="danger" size="sm" onClick={() => setIsCloseModalOpen(true)}>
              <Lock size={15} />
              Close Session & Reconcile
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-[#706F70]">Loading cash drawer status...</div>
      ) : !activeSession ? (
        /* No active cash session: Open session card */
        <div className="max-w-xl mx-auto py-8">
          <GlassCard className="p-6 text-center space-y-5 border-white/15">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center mx-auto shadow-glass-md">
              <Coins size={30} className="text-[#D4D8DF]" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">No Active Cash Drawer Session</h2>
              <p className="text-xs text-[#ACADB1] mt-1 max-w-sm mx-auto">
                Open a new cash session with your initial cash float to process cash sales, drop payouts, and reconcile balances.
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
          <GlassCard className="p-4 border-white/15 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Session #{activeSession.id} Active</span>
                  <Badge variant="success">Open</Badge>
                </div>
                <div className="text-[11px] text-[#ACADB1] flex items-center gap-3 mt-0.5 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Opened: {new Date(activeSession.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>Cashier: {activeSession.user_name || user?.username}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#ACADB1] block">Current Expected Cash</span>
              <div className="text-2xl font-bold font-mono text-white">
                {currency} {currentExpected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </GlassCard>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="p-4 border-white/10">
              <div className="text-[11px] font-medium text-[#ACADB1] uppercase font-mono">Opening Float</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {currency} {activeSession.opening_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Starting cash in drawer</span>
            </GlassCard>

            <GlassCard className="p-4 border-white/10">
              <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1 uppercase font-mono">
                <ArrowDownLeft size={13} /> Cash Sales (+)
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                + {currency} {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Collected in cash today</span>
            </GlassCard>

            <GlassCard className="p-4 border-white/10">
              <div className="text-[11px] font-medium text-amber-400 flex items-center gap-1 uppercase font-mono">
                <ArrowUpRight size={13} /> Cash Refunds (-)
              </div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                - {currency} {totalRefunds.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Returned to customers</span>
            </GlassCard>

            <GlassCard className="p-4 border-white/10">
              <div className="text-[11px] font-medium text-[#F87171] flex items-center gap-1 uppercase font-mono">
                <ArrowUpRight size={13} /> Cash Expenses (-)
              </div>
              <div className="text-xl font-bold font-mono text-[#F87171] mt-1">
                - {currency} {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#706F70]">Operating drawer payouts</span>
            </GlassCard>
          </div>

          {/* Movements Ledger Table */}
          <GlassCard className="overflow-hidden border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Drawer Movements Ledger</h3>
                <p className="text-[11px] text-[#ACADB1]">All cash activities recorded during session #{activeSession.id}</p>
              </div>
              <span className="text-[11px] font-mono text-[#706F70]">{movements.length} transactions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-wider text-[#ACADB1]">
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Reason / Notes</th>
                    <th className="py-2.5 px-4">Reference</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
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
                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-4 font-mono text-[#ACADB1] text-[11px]">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="uppercase text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/10 text-white">
                              {m.movement_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#D4D8DF] max-w-xs truncate">{m.reason || '—'}</td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#706F70]">{m.reference_id || '—'}</td>
                          <td className={`py-2.5 px-4 text-right font-mono font-semibold ${isPositive ? 'text-emerald-400' : 'text-[#F87171]'}`}>
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
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#ACADB1]">Expected Drawer Cash:</span>
              <span className="font-mono font-bold text-white">
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

          {actualCash !== '' && !isNaN(parseFloat(actualCash)) && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between font-mono ${
                Math.abs(parseFloat(actualCash) - currentExpected) < 0.01
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : parseFloat(actualCash) > currentExpected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-[#F87171]'
              }`}
            >
              <span>Difference / Variance:</span>
              <span className="font-bold">
                {currency} {(parseFloat(actualCash) - currentExpected).toFixed(2)}
              </span>
            </div>
          )}

          <Input
            label="Closing Notes & Observations"
            value={closingNotes}
            onChange={(e) => setClosingNotes(e.target.value)}
            placeholder="e.g. Verified by manager, cash dropped to safe"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={closingLoading}>
              <Lock size={15} />
              {closingLoading ? 'Reconciling...' : 'Confirm Close & Lock'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
