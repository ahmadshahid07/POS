import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sale, SaleDetail, SaleItem } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import {
  Printer,
  Search,
  Receipt,
  FileText,
  Clock,
  User,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

export const InvoicePrintCenter: React.FC = () => {
  const { businessSettings, addNotification } = useAppStore();
  const currency = businessSettings?.currency || '₨';

  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [paperFormat, setPaperFormat] = useState<'80mm' | '58mm' | 'a4'>('80mm');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      if (window.skythsAPI) {
        const history = await window.skythsAPI.getSalesHistory({ limit: 50 });
        const list: Sale[] = Array.isArray(history) ? history : (history?.sales || []);
        setSales(list);
        if (list.length > 0 && !selectedSale) {
          // Fetch full detail of first sale
          const detail = await window.skythsAPI.getSaleDetail(list[0].id);
          setSelectedSale(detail);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch sales for print center:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleSelectSale = async (id: number) => {
    try {
      if (window.skythsAPI) {
        const detail = await window.skythsAPI.getSaleDetail(id);
        setSelectedSale(detail);
      }
    } catch (err: any) {
      addNotification({ title: 'Error', message: 'Failed to load invoice details.', type: 'danger' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredSales = sales.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.invoice_number.toLowerCase().includes(q) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#080808] flex items-center gap-2">
            <Printer className="text-[#353536]" size={22} />
            Invoice & Receipt Print Center
          </h1>
          <p className="text-xs text-[#706F70]">
            Reprint official invoices and receipts in 58mm, 80mm, and A4 formats without altering stock.
          </p>
        </div>

        {selectedSale && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#EBEDF1]/60 p-1 rounded-xl">
              {(['58mm', '80mm', 'a4'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setPaperFormat(fmt)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-all cursor-pointer ${
                    paperFormat === fmt
                      ? 'bg-white text-[#080808] shadow-glass-sm font-bold'
                      : 'text-[#706F70] hover:text-[#080808]'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer size={15} />
              Print Preview
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                const el = document.getElementById('printable-receipt');
                if (el && window.skythsAPI) {
                  try {
                    const res = await window.skythsAPI.printSilent({
                      htmlContent: el.innerHTML,
                      printerName: businessSettings?.selected_printer,
                      pageSize: paperFormat,
                    });
                    if (res?.success) {
                      addNotification({
                        title: 'Direct Print Sent',
                        message: `Sent to thermal printer (${businessSettings?.selected_printer || 'Default Printer'})`,
                        type: 'success',
                      });
                    } else if (res?.error) {
                      window.print();
                    }
                  } catch (e) {
                    window.print();
                  }
                } else {
                  window.print();
                }
              }}
            >
              <Printer size={15} />
              Silent Print
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search & Invoice List */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[#706F70]" size={15} />
              <input
                type="text"
                placeholder="Search by invoice number or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden">
            <div className="p-3 border-b border-black/5 flex items-center justify-between bg-[#EBEDF1]/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#080808]">Recent Invoices</span>
              <span className="text-[10px] font-mono text-[#706F70]">{filteredSales.length} found</span>
            </div>

            <div className="max-h-[620px] overflow-y-auto divide-y divide-black/5">
              {loading ? (
                <div className="p-8 text-center text-xs text-[#706F70]">Loading invoices...</div>
              ) : filteredSales.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#706F70]">No matching invoices found.</div>
              ) : (
                filteredSales.map((s) => {
                  const isSelected = selectedSale?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSale(s.id)}
                      className={`w-full text-left p-3.5 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#080808] text-white shadow-glass-sm'
                          : 'hover:bg-black/[0.03] text-[#353536]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold ${isSelected ? 'text-white' : 'text-[#080808]'}`}>
                            {s.invoice_number}
                          </span>
                          <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-[#706F70]'
                          }`}>
                            {s.payment_method}
                          </span>
                        </div>
                        <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-[#D4D8DF]' : 'text-[#706F70]'}`}>
                          {s.customer_name || 'Walk-in Customer'} • {new Date(s.sale_date).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-mono font-bold text-xs ${isSelected ? 'text-white' : 'text-[#080808]'}`}>
                          {currency} {s.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className={`text-[10px] ${s.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {s.payment_status}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Live Printable Document Preview */}
        <div className="lg:col-span-7">
          <GlassCard className="p-6">
            {!selectedSale ? (
              <div className="py-24 text-center text-xs text-[#706F70]">
                Select an invoice from the list on the left to preview and print.
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Reprint Banner */}
                <div className="w-full mb-4 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-center text-xs font-semibold">
                  OFFICIAL DUPLICATE REPRINT — Original database records preserved
                </div>

                {/* Printable Canvas */}
                <div
                  id="printable-receipt"
                  className={`bg-white text-black border border-black/15 shadow-md p-6 font-mono transition-all duration-200 ${
                    paperFormat === '58mm'
                      ? 'w-[280px] text-[10px]'
                      : paperFormat === '80mm'
                      ? 'w-[360px] text-[11px]'
                      : 'w-full max-w-[650px] text-xs font-sans p-8'
                  }`}
                >
                  {/* Header */}
                  <div className="text-center pb-3 border-b border-dashed border-black/40">
                    <h2 className="text-base font-bold tracking-tight uppercase">
                      {businessSettings?.business_name || 'SKYTHS STORE'}
                    </h2>
                    {businessSettings?.address && (
                      <p className="text-[10px] text-gray-600 mt-0.5">{businessSettings.address}</p>
                    )}
                    {businessSettings?.phone && (
                      <p className="text-[10px] text-gray-600">Tel: {businessSettings.phone}</p>
                    )}
                    <div className="mt-2 text-[10px] font-bold border border-black px-2 py-0.5 inline-block">
                      REPRINT / DUPLICATE COPY
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="py-2.5 border-b border-dashed border-black/40 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Invoice:</span>
                      <span className="font-bold">{selectedSale.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span>{new Date(selectedSale.sale_date).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cashier:</span>
                      <span>{selectedSale.cashier_name || 'Staff'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer:</span>
                      <span>{selectedSale.customer_name || 'Walk-in'}</span>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="py-3 border-b border-dashed border-black/40">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-black/20 text-[10px] text-gray-500 uppercase">
                          <th className="pb-1">Item</th>
                          <th className="pb-1 text-center">Qty</th>
                          <th className="pb-1 text-right">Price</th>
                          <th className="pb-1 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        {selectedSale.items?.map((itm: SaleItem) => (
                          <tr key={itm.id}>
                            <td className="py-1 pr-1 truncate max-w-[140px] font-medium">{itm.product_name}</td>
                            <td className="py-1 text-center">{itm.quantity}</td>
                            <td className="py-1 text-right">{itm.unit_price}</td>
                            <td className="py-1 text-right font-bold">{itm.line_total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="py-3 border-b border-dashed border-black/40 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{currency} {selectedSale.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedSale.discount_amount > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Discount:</span>
                        <span>- {currency} {selectedSale.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {/* Tax Breakdown */}
                    {businessSettings?.tax_mode === 'breakdown' ? (
                      <>
                        <div className="flex justify-between text-gray-600">
                          <span>{businessSettings.tax_name || 'GST'} ({selectedSale.tax_rate}%):</span>
                          <span>+ {currency} {selectedSale.tax_amount.toFixed(2)}</span>
                        </div>
                        {businessSettings.tax_rate_2 && businessSettings.tax_rate_2 > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>{businessSettings.tax_name_2 || 'PST / Service Tax'} ({businessSettings.tax_rate_2}%):</span>
                            <span>+ {currency} {((selectedSale.subtotal - selectedSale.discount_amount) * (businessSettings.tax_rate_2 / 100)).toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    ) : selectedSale.tax_amount > 0 ? (
                      <div className="flex justify-between text-gray-600">
                        <span>{businessSettings?.tax_name || 'Tax'} ({selectedSale.tax_rate}%):</span>
                        <span>+ {currency} {selectedSale.tax_amount.toFixed(2)}</span>
                      </div>
                    ) : null}

                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                      <span>Grand Total:</span>
                      <span>{currency} {selectedSale.grand_total.toFixed(2)}</span>
                    </div>

                    {/* Secondary Currency */}
                    {businessSettings?.enable_secondary_currency && (
                      <div className="flex justify-between text-[10px] text-gray-600 bg-gray-100 p-1 rounded font-sans">
                        <span>Equivalent ({businessSettings.secondary_currency_code || 'USD'}):</span>
                        <span className="font-mono font-bold">
                          {businessSettings.secondary_currency_symbol || '$'}{' '}
                          {(selectedSale.grand_total / (businessSettings.exchange_rate || 278.5)).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600 text-[10px]">
                      <span>Amount Paid ({selectedSale.payment_method.toUpperCase()}):</span>
                      <span>{currency} {selectedSale.paid_amount.toFixed(2)}</span>
                    </div>
                    {selectedSale.change_due > 0 && (
                      <div className="flex justify-between text-gray-600 text-[10px]">
                        <span>Change Returned:</span>
                        <span>{currency} {selectedSale.change_due.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedSale.balance_due > 0 && (
                      <div className="flex justify-between font-bold text-red-600 text-[10px]">
                        <span>Remaining Balance:</span>
                        <span>{currency} {selectedSale.balance_due.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Policy */}
                  <div className="pt-4 text-center text-[9px] text-gray-500 space-y-1">
                    <p>{businessSettings?.invoice_footer || 'Thank you for your business!'}</p>
                    <p>{businessSettings?.return_policy || 'Goods exchangeable within 7 days with original invoice.'}</p>
                    <p className="font-mono text-[8px] text-gray-400">SKYTHS Offline POS Engine</p>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
