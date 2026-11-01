import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Customer, CustomerStatement, BusinessSettings } from '../../types';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CreditCard,
  User,
  RotateCcw
} from 'lucide-react';

interface CustomerStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  businessSettings: BusinessSettings | null;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  isOpen,
  onClose,
  customer,
  businessSettings,
}) => {
  const [statement, setStatement] = useState<CustomerStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [datePreset, setDatePreset] = useState<'all' | 'this_month' | 'last_30' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const loadStatement = async (start?: string, end?: string) => {
    if (!customer) return;
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const res = await (window as any).skythsAPI.getCustomerStatement({
          customerId: customer.id,
          startDate: start || undefined,
          endDate: end || undefined,
        });
        setStatement(res);
      }
    } catch (err: any) {
      console.error('Failed to load customer statement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      handlePresetChange('all');
    }
  }, [isOpen, customer]);

  const handlePresetChange = (preset: 'all' | 'this_month' | 'last_30' | 'custom') => {
    setDatePreset(preset);
    const now = new Date();
    let s = '';
    let e = now.toISOString().slice(0, 10);

    if (preset === 'this_month') {
      s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    } else if (preset === 'last_30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      s = d.toISOString().slice(0, 10);
    } else if (preset === 'all') {
      s = '';
      e = '';
    }

    setStartDate(s);
    setEndDate(e);
    if (preset !== 'custom') {
      loadStatement(s, e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!statement || statement.transactions.length === 0) return;
    const headers = ['Date', 'Type', 'Reference', 'Description', 'Debit (Invoiced)', 'Credit (Paid/Returned)', 'Running Balance'];
    const rows = statement.transactions.map((t) => [
      t.date.slice(0, 16),
      t.type.toUpperCase(),
      `"${t.reference}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.debit,
      t.credit,
      t.running_balance,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `"Customer Statement - ${customer?.name}"`,
        `"Period: ${statement.start_date} to ${statement.end_date}"`,
        `"Opening Balance: ${statement.opening_balance}"`,
        `"Closing Balance: ${statement.closing_balance}"`,
        '',
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Statement_${customer?.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Statement of Account"
      subtitle={`${customer.name} • Account Ledger & Chronological Balance`}
      maxWidth="4xl"
    >
      <div className="flex flex-col gap-4">
        {/* Controls Bar (no-print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#ACADB1] mr-1">Period:</span>
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                datePreset === 'all' ? 'bg-white text-black font-semibold' : 'bg-white/5 text-[#ACADB1] hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handlePresetChange('this_month')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                datePreset === 'this_month' ? 'bg-white text-black font-semibold' : 'bg-white/5 text-[#ACADB1] hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePresetChange('last_30')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                datePreset === 'last_30' ? 'bg-white text-black font-semibold' : 'bg-white/5 text-[#ACADB1] hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDatePreset('custom')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                datePreset === 'custom' ? 'bg-white text-black font-semibold' : 'bg-white/5 text-[#ACADB1] hover:text-white'
              }`}
            >
              Custom Range
            </button>
          </div>

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#0E0E0F] border border-white/10 rounded px-2 py-1 text-white text-xs font-mono"
              />
              <span className="text-[#706F70]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#0E0E0F] border border-white/10 rounded px-2 py-1 text-white text-xs font-mono"
              />
              <Button size="sm" variant="primary" onClick={() => loadStatement(startDate, endDate)}>
                Apply
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="outline" leftIcon={<Download size={14} />} onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button size="sm" variant="primary" leftIcon={<Printer size={14} />} onClick={handlePrint}>
              Print Statement
            </Button>
          </div>
        </div>

        {/* Printable Statement Area */}
        <div className="printable-area bg-[#0E0E0F] p-6 rounded-xl border border-white/10 text-white space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-black tracking-wider uppercase">
                {businessSettings?.business_name || 'SKYTHS ENTERPRISE'}
              </h2>
              <div className="text-xs text-[#ACADB1] mt-1 space-y-0.5">
                <p>{businessSettings?.address || 'Main Commercial Market'}</p>
                <p>Phone: {businessSettings?.phone || 'N/A'} • Email: {businessSettings?.email || 'N/A'}</p>
                {businessSettings?.fbr_pos_id && <p>FBR POS Reg ID: {businessSettings.fbr_pos_id}</p>}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded bg-white text-black font-bold text-xs uppercase tracking-widest font-mono">
                STATEMENT OF ACCOUNT
              </span>
              <div className="text-xs text-[#ACADB1] mt-2 font-mono">
                <p>Date Generated: {new Date().toLocaleDateString()}</p>
                <p>
                  Period: {statement?.start_date || 'All Time'} to {statement?.end_date || 'Present'}
                </p>
              </div>
            </div>
          </div>

          {/* Customer & Account Details */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-white/5 p-4 rounded-xl border border-white/5">
            <div>
              <span className="text-[#706F70] uppercase font-mono block text-[10px] tracking-wider mb-1">
                Account Holder / Customer
              </span>
              <div className="font-bold text-sm text-white">{customer.name}</div>
              <div className="text-[#ACADB1] mt-1 space-y-0.5">
                {customer.phone && <p>Phone: {customer.phone}</p>}
                {customer.email && <p>Email: {customer.email}</p>}
                {customer.address && <p>Address: {customer.address}</p>}
              </div>
            </div>

            <div className="text-right flex flex-col justify-between">
              <div>
                <span className="text-[#706F70] uppercase font-mono block text-[10px] tracking-wider mb-1">
                  Current Account Status
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 font-mono text-white">
                  Customer ID: #{customer.id}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#ACADB1] block">Net Outstanding Receivable</span>
                <span className="text-xl font-mono font-black text-[#F87171]">
                  {currencySymbol} {(statement?.closing_balance ?? customer.balance_receivable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Summary Tiles */}
          {statement && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-mono text-[#706F70] block">Opening Balance</span>
                <span className="font-mono font-bold text-white text-sm">
                  {currencySymbol} {statement.opening_balance.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-mono text-[#706F70] block">Total Invoiced (Debits)</span>
                <span className="font-mono font-bold text-[#D4D8DF] text-sm">
                  {currencySymbol} {statement.total_invoiced.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-mono text-[#706F70] block">Total Payments Settled</span>
                <span className="font-mono font-bold text-[#4ADE80] text-sm">
                  {currencySymbol} {statement.total_payments.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-mono text-[#706F70] block">Total Returns Credited</span>
                <span className="font-mono font-bold text-[#FBBF24] text-sm">
                  {currencySymbol} {statement.total_returns.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Transactions Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#D4D8DF]">
              <thead className="bg-white/5 text-[#ACADB1] uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Reference #</th>
                  <th className="py-2.5 px-3">Transaction Description</th>
                  <th className="py-2.5 px-3 text-right">Debit (+)</th>
                  <th className="py-2.5 px-3 text-right">Credit (-)</th>
                  <th className="py-2.5 px-3 text-right font-bold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {/* Opening Balance Row */}
                <tr className="bg-white/[0.02]">
                  <td className="py-2 px-3 text-[#706F70]">—</td>
                  <td className="py-2 px-3 uppercase text-[#706F70] font-sans">Initial</td>
                  <td className="py-2 px-3 text-[#706F70]">—</td>
                  <td className="py-2 px-3 text-[#ACADB1] font-sans">Opening Balance Prior to Selected Period</td>
                  <td className="py-2 px-3 text-right text-[#706F70]">—</td>
                  <td className="py-2 px-3 text-right text-[#706F70]">—</td>
                  <td className="py-2 px-3 text-right font-bold text-white">
                    {currencySymbol} {statement ? statement.opening_balance.toFixed(2) : '0.00'}
                  </td>
                </tr>

                {statement?.transactions && statement.transactions.length > 0 ? (
                  statement.transactions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 text-[#ACADB1]">
                        {t.date.slice(0, 10)} {t.date.slice(11, 16)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-sans font-medium ${
                            t.type === 'invoice'
                              ? 'bg-blue-500/10 text-blue-400'
                              : t.type === 'payment'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">{t.reference}</td>
                      <td className="py-2.5 px-3 text-[#D4D8DF] font-sans max-w-[220px] truncate">{t.description}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-white">
                        {t.debit > 0 ? `${currencySymbol} ${t.debit.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#4ADE80]">
                        {t.credit > 0 ? `${currencySymbol} ${t.credit.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {currencySymbol} {t.running_balance.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#706F70]">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={14} className="animate-spin" /> Loading transactions...
                        </div>
                      ) : (
                        'No transactional records found for this period.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t border-white/20 bg-white/5 font-mono font-bold text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-3 uppercase text-[#ACADB1] font-sans">
                    Closing Statement Balance Due:
                  </td>
                  <td className="py-3 px-3 text-right text-white">
                    {currencySymbol} {statement ? statement.total_invoiced.toFixed(2) : '0.00'}
                  </td>
                  <td className="py-3 px-3 text-right text-[#4ADE80]">
                    {currencySymbol} {statement ? (statement.total_payments + statement.total_returns).toFixed(2) : '0.00'}
                  </td>
                  <td className="py-3 px-3 text-right text-base text-[#F87171]">
                    {currencySymbol} {statement ? statement.closing_balance.toFixed(2) : '0.00'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Statement Footer */}
          <div className="border-t border-white/10 pt-4 flex justify-between items-end text-[10px] text-[#706F70]">
            <div>
              <p>This is a computer-generated account statement issued by SKYTHS Offline POS Engine.</p>
              <p>For any ledger discrepancies, please contact finance administration within 14 days.</p>
            </div>
            <div className="text-right">
              <div className="w-36 border-b border-[#706F70] pb-1 mb-1"></div>
              <span>Authorized Signature / Stamp</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (no-print) */}
        <div className="no-print flex justify-end gap-2 pt-2 border-t border-white/10">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" leftIcon={<Printer size={15} />} onClick={handlePrint}>
            Print Statement
          </Button>
        </div>
      </div>
    </Modal>
  );
};
