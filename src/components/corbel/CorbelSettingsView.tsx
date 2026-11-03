import React, { useState, useEffect } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import { useAppStore } from '../../store/useAppStore';
import { BusinessSettings, AppSettings, User, BackupLog, AuditLog, PrinterDevice } from '../../types';
import {
  Settings,
  Building,
  Percent,
  Printer,
  Database,
  Users,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Download,
  Plus,
  RefreshCw,
  X,
  Volume2,
} from 'lucide-react';

export const CorbelSettingsView: React.FC = () => {
  const { theme } = useCorbelStore();
  const { businessSettings, setBusinessSettings, addNotification } = useAppStore();
  const isDark = theme === 'dark';

  type SettingsSubtab = 'business' | 'tax' | 'printers' | 'database' | 'users' | 'audit';
  const [activeTab, setActiveTab] = useState<SettingsSubtab>('business');

  // Business Settings Form
  const [bizForm, setBizForm] = useState<Partial<BusinessSettings>>({
    business_name: 'Corbel Supply Co.',
    owner_name: 'Marcus Rivera',
    address: '448 Howard St, San Francisco, CA',
    phone: '+1 (555) 019-2831',
    email: 'contact@corbelsupply.com',
    currency: 'USD',
    currency_symbol: '$',
    tax_rate: 8.5,
    tax_name: 'Sales Tax',
    tax_mode: 'single',
    tax_rate_2: 0,
    tax_name_2: 'Local Tax',
    fbr_pos_id: '',
    receipt_header: 'CORBEL SUPPLY CO.',
    receipt_footer: 'Thank you for your business. Visit us at corbelsupply.com',
    silent_print_enabled: false,
    selected_printer: '',
    auto_print_on_checkout: true,
    sound_effects_enabled: true,
    low_stock_chime_enabled: true,
  });

  // Database & Backup State
  const [integrityMessage, setIntegrityMessage] = useState<string | null>(null);
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);

  // Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'cashier' as const,
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Printers List
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);

  const loadData = async () => {
    try {
      if (window.skythsAPI) {
        // Business settings
        const currentBiz = await window.skythsAPI.getBusinessSettings();
        if (currentBiz) setBizForm((prev) => ({ ...prev, ...currentBiz }));

        // Backups
        const logs = await window.skythsAPI.getBackupLogs?.() || [];
        setBackupLogs(logs);

        // Users
        const uList = await window.skythsAPI.getUsers?.() || [];
        setUsersList(uList);

        // Audit logs
        const aLogs = await window.skythsAPI.getAuditLogs?.() || [];
        setAuditLogs(aLogs);

        // Printers
        const pList = await window.skythsAPI.getPrinters?.() || [];
        setPrinters(pList);
      }
    } catch (err) {
      console.warn('Settings load fallback:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBusinessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (window.skythsAPI) {
        const saved = await window.skythsAPI.updateBusinessSettings(bizForm);
        setBusinessSettings(saved);
        addNotification({
          title: 'Settings Saved',
          message: 'Business configurations updated successfully.',
          type: 'success',
        });
      }
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    }
  };

  const handleRunIntegrityCheck = async () => {
    try {
      if (window.skythsAPI) {
        const res = await window.skythsAPI.verifyDatabaseIntegrity();
        setIntegrityMessage(res.message);
        addNotification({
          title: 'Integrity Check Complete',
          message: res.message,
          type: res.ok ? 'success' : 'danger',
        });
      }
    } catch (err: any) {
      setIntegrityMessage(`Error: ${err.message}`);
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      if (window.skythsAPI) {
        const res = await window.skythsAPI.createBackup();
        addNotification({
          title: 'Hot Backup Created',
          message: `Saved snapshot to: ${res.backupPath}`,
          type: 'success',
        });
        const logs = await window.skythsAPI.getBackupLogs?.() || [];
        setBackupLogs(logs);
      }
    } catch (err: any) {
      alert(`Backup error: ${err.message}`);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    try {
      if (window.skythsAPI) {
        await window.skythsAPI.createUser(newUser);
        addNotification({
          title: 'User Created',
          message: `Account for @${newUser.username} created successfully.`,
          type: 'success',
        });
        const uList = await window.skythsAPI.getUsers?.() || [];
        setUsersList(uList);
        setIsAddUserOpen(false);
        setNewUser({ username: '', password: '', full_name: '', role: 'cashier' });
      }
    } catch (err: any) {
      alert(`User creation error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
            System & Operations Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure business profile, taxation, printers, database backups & security</p>
        </div>

        {/* Subtabs Segmented Pill */}
        <div
          className={`flex items-center p-1 rounded-full border ${
            isDark ? 'bg-[#15181D] border-white/10' : 'bg-slate-200/70 border-slate-300/40'
          }`}
        >
          {(
            [
              { id: 'business', label: 'Business Profile' },
              { id: 'tax', label: 'Tax & Currency' },
              { id: 'printers', label: 'Thermal Printers' },
              { id: 'database', label: 'Database & Backups' },
              { id: 'users', label: 'Team & Security' },
              { id: 'audit', label: 'Audit Trail' },
            ] as const
          ).map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? isDark ? 'bg-white text-black shadow-sm font-bold' : 'bg-white text-slate-900 shadow-sm font-bold'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Business Profile */}
      {activeTab === 'business' && (
        <form onSubmit={handleSaveBusinessSettings} className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-4 max-w-2xl ${
          isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 pb-3 border-b border-black/5 dark:border-white/10">
            <Building size={18} className="text-emerald-500" />
            <h3 className="font-bold text-sm">Store & Company Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Store / Brand Name</label>
              <input
                type="text"
                value={bizForm.business_name || ''}
                onChange={(e) => setBizForm({ ...bizForm, business_name: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                  isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Owner / Manager</label>
              <input
                type="text"
                value={bizForm.owner_name || ''}
                onChange={(e) => setBizForm({ ...bizForm, owner_name: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Phone Contact</label>
              <input
                type="text"
                value={bizForm.phone || ''}
                onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Support Email</label>
              <input
                type="email"
                value={bizForm.email || ''}
                onChange={(e) => setBizForm({ ...bizForm, email: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-slate-400 mb-1 font-semibold">Physical Store Address</label>
            <input
              type="text"
              value={bizForm.address || ''}
              onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border outline-none ${
                isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Receipt Header Line</label>
              <input
                type="text"
                value={bizForm.receipt_header || ''}
                onChange={(e) => setBizForm({ ...bizForm, receipt_header: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Receipt Footer Line</label>
              <input
                type="text"
                value={bizForm.receipt_footer || ''}
                onChange={(e) => setBizForm({ ...bizForm, receipt_footer: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-black/5 dark:border-white/10">
            <button
              type="submit"
              className="px-6 py-2 rounded-full font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Tax & Currency */}
      {activeTab === 'tax' && (
        <form onSubmit={handleSaveBusinessSettings} className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-4 max-w-2xl ${
          isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 pb-3 border-b border-black/5 dark:border-white/10">
            <Percent size={18} className="text-emerald-500" />
            <h3 className="font-bold text-sm">Taxation Rates & Multi-Currency</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Primary Tax Name</label>
              <input
                type="text"
                value={bizForm.tax_name || ''}
                onChange={(e) => setBizForm({ ...bizForm, tax_name: e.target.value })}
                placeholder="e.g. GST"
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Primary Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={bizForm.tax_rate ?? 0}
                onChange={(e) => setBizForm({ ...bizForm, tax_rate: Number(e.target.value) })}
                className={`w-full px-3 py-2 rounded-xl border outline-none font-mono font-bold ${
                  isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Tax Calculation Mode</label>
              <select
                value={bizForm.tax_mode || 'single'}
                onChange={(e) => setBizForm({ ...bizForm, tax_mode: e.target.value as any })}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="single">Single Tax Rate</option>
                <option value="breakdown">Dual Breakdown (GST + Provincial)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Currency Code</label>
              <input
                type="text"
                value={bizForm.currency || ''}
                onChange={(e) => setBizForm({ ...bizForm, currency: e.target.value.toUpperCase() })}
                placeholder="USD"
                className={`w-full px-3 py-2 rounded-xl border outline-none font-mono font-bold ${
                  isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Currency Symbol</label>
              <input
                type="text"
                value={bizForm.currency_symbol || ''}
                onChange={(e) => setBizForm({ ...bizForm, currency_symbol: e.target.value })}
                placeholder="$"
                className={`w-full px-3 py-2 rounded-xl border outline-none font-mono font-bold ${
                  isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-black/5 dark:border-white/10">
            <button
              type="submit"
              className="px-6 py-2 rounded-full font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
            >
              Save Tax & Currency
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Thermal Printers */}
      {activeTab === 'printers' && (
        <form onSubmit={handleSaveBusinessSettings} className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-4 max-w-2xl ${
          isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 pb-3 border-b border-black/10 dark:border-white/10">
            <Printer size={18} className="text-emerald-500" />
            <h3 className="font-bold text-sm">ESC/POS Thermal Receipt Printing</h3>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl border text-xs bg-black/5 dark:bg-white/5">
            <div>
              <h5 className="font-bold">Silent Direct Thermal Printing</h5>
              <p className="text-[11px] text-slate-400">Print receipts instantly on checkout without native OS dialog popups</p>
            </div>
            <input
              type="checkbox"
              checked={bizForm.silent_print_enabled || false}
              onChange={(e) => setBizForm({ ...bizForm, silent_print_enabled: e.target.checked })}
              className="w-4 h-4 accent-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl border text-xs bg-black/5 dark:bg-white/5">
            <div>
              <h5 className="font-bold">Auto-Print on Completed Sale</h5>
              <p className="text-[11px] text-slate-400">Automatically trigger thermal receipt generation when clicking "Complete Sale"</p>
            </div>
            <input
              type="checkbox"
              checked={bizForm.auto_print_on_checkout || false}
              onChange={(e) => setBizForm({ ...bizForm, auto_print_on_checkout: e.target.checked })}
              className="w-4 h-4 accent-emerald-500"
            />
          </div>

          <div className="text-xs">
            <label className="block text-slate-400 mb-1 font-semibold">Select Thermal Printer Device</label>
            <select
              value={bizForm.selected_printer || ''}
              onChange={(e) => setBizForm({ ...bizForm, selected_printer: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border outline-none ${
                isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="">Default System Printer</option>
              {printers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.displayName || p.name} {p.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-3 border-t border-black/5 dark:border-white/10">
            <button
              type="submit"
              className="px-6 py-2 rounded-full font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
            >
              Save Printer Setup
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Database & Backups */}
      {activeTab === 'database' && (
        <div className="flex flex-col gap-6 max-w-3xl">
          {/* Quick Actions Card */}
          <div className={`p-6 rounded-3xl border shadow-xl flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/15 text-emerald-500">
                <Database size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm">SQLite 3 High-Durability Engine (WAL Mode)</h3>
                <p className="text-xs text-slate-400 mt-0.5">32 relational tables, automated 24h backups & zero-lockout snapshots</p>
                {integrityMessage && (
                  <p className="text-xs text-emerald-400 font-mono mt-1">{integrityMessage}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunIntegrityCheck}
                className={`px-4 py-2 rounded-full text-xs font-semibold border ${
                  isDark ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Verify Integrity
              </button>
              <button
                onClick={handleCreateBackup}
                disabled={backupLoading}
                className="px-5 py-2 rounded-full text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>{backupLoading ? 'Backing up...' : 'Create Hot Backup'}</span>
              </button>
            </div>
          </div>

          {/* Backup History */}
          <div className={`p-5 rounded-3xl border shadow-lg ${
            isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h4 className="font-bold text-sm mb-3">Backup Snapshots & History</h4>
            {backupLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No backup records logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-150 text-slate-500'}`}>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Backup File Location</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {backupLogs.map((b) => (
                      <tr key={b.id}>
                        <td className="py-2.5 px-3 text-slate-400">{new Date(b.created_at).toLocaleString()}</td>
                        <td className="py-2.5 px-3 truncate max-w-xs">{b.backup_path}</td>
                        <td className="py-2.5 px-3">{(b.backup_size / 1024).toFixed(1)} KB</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Team & Security */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-6 max-w-3xl">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddUserOpen(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold ${
                isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-[#121316] text-white hover:bg-black'
              }`}
            >
              <Plus size={13} />
              <span>Add Staff User</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {usersList.map((u) => (
              <div
                key={u.id}
                className={`p-5 rounded-3xl border flex items-center justify-between ${
                  isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500/15 text-emerald-500 uppercase">
                    {u.username.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{u.full_name || u.username}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">@{u.username}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  u.role === 'admin' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Audit Trail */}
      {activeTab === 'audit' && (
        <div className={`p-5 rounded-3xl border shadow-lg ${
          isDark ? 'bg-[#15181D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h4 className="font-bold text-sm mb-3">Immutable System Audit Trail</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-150 text-slate-500'}`}>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">Entity Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs font-sans">
                      No audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.slice(0, 50).map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{new Date(a.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">{a.action}</td>
                      <td className="py-2.5 px-3 uppercase text-[10px]">{a.entity_type}</td>
                      <td className="py-2.5 px-3 text-slate-400">{a.entity_id || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#15181D] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-bold text-base mb-4 pb-2 border-b border-black/10 dark:border-white/10">Add Team User</h3>
            <form onSubmit={handleCreateUser} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Username</label>
                <input
                  required
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().trim() })}
                  placeholder="e.g. cashier1"
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-mono ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Password</label>
                <input
                  required
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#22272F] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-1.5 rounded-full text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-full font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

