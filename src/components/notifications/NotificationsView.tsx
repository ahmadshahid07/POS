import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Product, Customer } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Bell,
  AlertTriangle,
  Package,
  Users,
  Coins,
  CheckCircle2,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface AlertItem {
  id: string;
  category: 'inventory' | 'credit' | 'cash' | 'system';
  severity: 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  actionView: string;
  actionLabel: string;
}

export const NotificationsView: React.FC = () => {
  const { setActiveView, businessSettings } = useAppStore();
  const currency = businessSettings?.currency || '₨';

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'warning' | 'danger' | 'info'>('all');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const generatedAlerts: AlertItem[] = [];

      if (window.skythsAPI) {
        // 1. Check Low Stock / Out of Stock
        const prodRes = await window.skythsAPI.getProducts();
        const products: Product[] = Array.isArray(prodRes) ? prodRes : (prodRes?.products || []);
        const lowStock = products.filter((p) => p.current_stock <= (p.min_stock_threshold ?? p.min_stock_level ?? 5));

        lowStock.forEach((p) => {
          const threshold = p.min_stock_threshold ?? p.min_stock_level ?? 5;
          if (p.current_stock <= 0) {
            generatedAlerts.push({
              id: `stock-zero-${p.id}`,
              category: 'inventory',
              severity: 'danger',
              title: `Out of Stock: ${p.name}`,
              description: `SKU: ${p.sku}. Current inventory is 0 units. Normal sales will be blocked until stock is received.`,
              actionView: 'purchases',
              actionLabel: 'Record Stock Purchase'
            });
          } else {
            generatedAlerts.push({
              id: `stock-low-${p.id}`,
              category: 'inventory',
              severity: 'warning',
              title: `Low Stock Warning: ${p.name}`,
              description: `Only ${p.current_stock} units remaining (Threshold is ${threshold}). Order replenish soon.`,
              actionView: 'purchases',
              actionLabel: 'Reorder Product'
            });
          }
        });

        // 2. Check Overdue Customer Receivables
        const customers: Customer[] = await window.skythsAPI.getCustomers();
        const owingCustomers = customers.filter((c) => c.balance_receivable > 0);

        owingCustomers.forEach((c) => {
          generatedAlerts.push({
            id: `credit-cust-${c.id}`,
            category: 'credit',
            severity: 'warning',
            title: `Outstanding Receivable: ${c.name}`,
            description: `Customer has an unpaid credit balance of ${currency} ${c.balance_receivable.toLocaleString()}. Phone: ${c.phone || 'N/A'}.`,
            actionView: 'payments',
            actionLabel: 'Collect Payment'
          });
        });

        // 3. Check Cash Drawer
        const activeSession = await window.skythsAPI.getActiveCashSession();
        if (!activeSession) {
          generatedAlerts.push({
            id: 'cash-no-session',
            category: 'cash',
            severity: 'info',
            title: 'No Active Cash Drawer Session',
            description: 'The cash drawer is currently closed. Open a session to process cash sales and log drawer floats.',
            actionView: 'cash',
            actionLabel: 'Open Drawer'
          });
        }
      }

      setAlerts(generatedAlerts);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter((a) => (filter === 'all' ? true : a.severity === filter));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#080808] flex items-center gap-2">
            <Bell className="text-[#353536]" size={22} />
            Notifications & Business Alerts
          </h1>
          <p className="text-xs text-[#706F70]">
            Proactive alerts for stock shortages, overdue customer credit balances, and operational notifications.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#EBEDF1]/60 p-1 rounded-xl text-xs">
          {(['all', 'danger', 'warning', 'info'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer font-medium ${
                filter === lvl
                  ? 'bg-white text-[#080808] shadow-glass-sm font-bold'
                  : 'text-[#706F70] hover:text-[#080808]'
              }`}
            >
              {lvl === 'danger' ? 'Critical' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#DC2626] border border-red-200 flex items-center justify-center font-bold">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-[#DC2626]">
              {alerts.filter((a) => a.severity === 'danger').length}
            </div>
            <div className="text-[11px] text-[#706F70]">Critical Alerts (Out of Stock)</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-amber-700">
              {alerts.filter((a) => a.severity === 'warning').length}
            </div>
            <div className="text-[11px] text-[#706F70]">Warnings (Low Stock / Credit)</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EBEDF1] text-[#353536] border border-black/10 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-[#080808]">{alerts.length}</div>
            <div className="text-[11px] text-[#706F70]">Total System Notices</div>
          </div>
        </GlassCard>
      </div>

      {/* Alert List */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-black/5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#080808]">Active Alerts Ledger</span>
          <span className="text-[11px] font-mono text-[#706F70]">{filteredAlerts.length} notices</span>
        </div>

        <div className="divide-y divide-black/5">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#706F70]">Analyzing business records...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
              <p className="text-xs font-medium text-[#080808]">All systems optimal</p>
              <p className="text-[11px] text-[#706F70]">No critical alerts or inventory shortages requiring attention.</p>
            </div>
          ) : (
            filteredAlerts.map((a) => (
              <div
                key={a.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black/[0.02] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center mt-0.5 ${
                      a.severity === 'danger'
                        ? 'bg-red-50 text-[#DC2626] border border-red-200'
                        : a.severity === 'warning'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-black/5 text-[#353536]'
                    }`}
                  >
                    {a.category === 'inventory' ? (
                      <Package size={17} />
                    ) : a.category === 'credit' ? (
                      <Users size={17} />
                    ) : (
                      <Coins size={17} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#080808]">{a.title}</span>
                      <Badge
                        variant={
                          a.severity === 'danger'
                            ? 'danger'
                            : a.severity === 'warning'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {a.category.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#706F70] mt-1 max-w-2xl">{a.description}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView(a.actionView)}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span>{a.actionLabel}</span>
                    <ArrowRight size={13} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
};
