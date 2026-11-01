import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { SaleDetail, BusinessSettings } from '../../types';
import { Printer, Undo2, Calendar, User, CreditCard } from 'lucide-react';

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleDetail | null;
  businessSettings: BusinessSettings | null;
  onInitiateReturn?: (sale: SaleDetail) => void;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({
  isOpen,
  onClose,
  sale,
  businessSettings,
  onInitiateReturn,
}) => {
  const [format, setFormat] = React.useState<'80mm' | '58mm' | 'a4'>('80mm');

  if (!isOpen || !sale) return null;

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transaction Details: ${sale.invoice_number}`}
      subtitle={`Recorded on ${sale.sale_date.slice(0, 10)} at ${sale.sale_date.slice(11, 16)}`}
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4">
        {/* Top Summary Chips (no-print) */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs no-print">
          <div>
            <span className="text-[#706F70] block">Customer</span>
            <span className="font-semibold text-white">{sale.customer_name || 'Walk-in'}</span>
          </div>
          <div>
            <span className="text-[#706F70] block">Cashier</span>
            <span className="font-semibold text-white">{sale.cashier_name || 'admin'}</span>
          </div>
          <div>
            <span className="text-[#706F70] block">Payment Channel</span>
            <span className="font-semibold text-white uppercase font-mono">{sale.payment_method}</span>
          </div>
          <div>
            <span className="text-[#706F70] block">Status</span>
            <Badge
              variant={
                sale.status === 'completed'
                  ? 'success'
                  : sale.status === 'returned'
                  ? 'danger'
                  : 'warning'
              }
              size="sm"
            >
              {sale.status}
            </Badge>
          </div>
        </div>

        {/* Format Selector for Print */}
        <div className="flex items-center justify-between no-print border-b border-white/10 pb-2">
          <span className="text-xs text-[#ACADB1]">Preview Format:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setFormat('80mm')}
              className={`px-2.5 py-1 rounded text-xs font-mono ${
                format === '80mm' ? 'bg-white text-black font-bold' : 'bg-white/5 text-[#ACADB1]'
              }`}
            >
              80mm
            </button>
            <button
              onClick={() => setFormat('58mm')}
              className={`px-2.5 py-1 rounded text-xs font-mono ${
                format === '58mm' ? 'bg-white text-black font-bold' : 'bg-white/5 text-[#ACADB1]'
              }`}
            >
              58mm
            </button>
            <button
              onClick={() => setFormat('a4')}
              className={`px-2.5 py-1 rounded text-xs font-mono ${
                format === 'a4' ? 'bg-white text-black font-bold' : 'bg-white/5 text-[#ACADB1]'
              }`}
            >
              A4
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div
          id="receipt-detail-doc"
          className={`printable-area mx-auto bg-white text-black font-mono rounded p-4 shadow ${
            format === '58mm'
              ? 'receipt-58mm max-w-[240px] text-[10px]'
              : format === '80mm'
              ? 'receipt-80mm max-w-[340px] text-xs'
              : 'invoice-a4 max-w-[550px] text-xs'
          }`}
        >
          <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
            <h2 className="font-bold text-sm uppercase font-sans">
              {businessSettings?.business_name || 'SKYTHS ENTERPRISE'}
            </h2>
            <div className="text-[10px] text-gray-700">{businessSettings?.address}</div>
            <div className="text-[10px] text-gray-700">Phone: {businessSettings?.phone}</div>
          </div>

          <div className="flex justify-between text-[10px] mb-2 border-b border-dashed border-gray-300 pb-1">
            <span><strong>Invoice:</strong> {sale.invoice_number}</span>
            <span><strong>Date:</strong> {sale.sale_date.slice(0, 10)}</span>
          </div>

          <table className="w-full text-left text-[11px] mb-2">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sale.items.map((i) => (
                <tr key={i.id}>
                  <td className="py-1">{i.product_name}</td>
                  <td className="text-center py-1">{i.quantity}</td>
                  <td className="text-right py-1">{i.unit_price}</td>
                  <td className="text-right py-1 font-bold">{i.line_total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-400 pt-1 space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{currencySymbol} {sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Discount:</span>
                <span>- {currencySymbol} {sale.discount_amount.toFixed(2)}</span>
              </div>
            )}
            {/* Tax Breakdown */}
            {businessSettings?.tax_mode === 'breakdown' ? (
              <>
                <div className="flex justify-between text-gray-700">
                  <span>{businessSettings.tax_name || 'GST'} ({sale.tax_rate}%):</span>
                  <span>+ {currencySymbol} {sale.tax_amount.toFixed(2)}</span>
                </div>
                {businessSettings.tax_rate_2 && businessSettings.tax_rate_2 > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>{businessSettings.tax_name_2 || 'PST / Service Tax'} ({businessSettings.tax_rate_2}%):</span>
                    <span>+ {currencySymbol} {((sale.subtotal - sale.discount_amount) * (businessSettings.tax_rate_2 / 100)).toFixed(2)}</span>
                  </div>
                )}
              </>
            ) : sale.tax_amount > 0 ? (
              <div className="flex justify-between text-gray-700">
                <span>{businessSettings?.tax_name || 'Tax'} ({sale.tax_rate}%):</span>
                <span>+ {currencySymbol} {sale.tax_amount.toFixed(2)}</span>
              </div>
            ) : null}

            <div className="flex justify-between text-xs font-bold border-t border-b border-gray-400 py-1 my-1">
              <span>TOTAL:</span>
              <span>{currencySymbol} {sale.grand_total.toFixed(2)}</span>
            </div>

            {/* Secondary Currency */}
            {businessSettings?.enable_secondary_currency && (
              <div className="flex justify-between text-[10px] text-gray-600 bg-gray-100 p-1 rounded font-sans">
                <span>Equivalent ({businessSettings.secondary_currency_code || 'USD'}):</span>
                <span className="font-mono font-bold">
                  {businessSettings.secondary_currency_symbol || '$'}{' '}
                  {(sale.grand_total / (businessSettings.exchange_rate || 278.5)).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Paid:</span>
              <span>{currencySymbol} {sale.paid_amount.toFixed(2)}</span>
            </div>
            {sale.change_due > 0 && (
              <div className="flex justify-between">
                <span>Change Returned:</span>
                <span>{currencySymbol} {sale.change_due.toFixed(2)}</span>
              </div>
            )}
            {sale.balance_due > 0 && (
              <div className="flex justify-between text-red-600 font-bold">
                <span>Balance Due:</span>
                <span>{currencySymbol} {sale.balance_due.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="text-center text-[9px] text-gray-600 border-t border-dashed border-gray-400 mt-3 pt-1">
            <p>*** REPRINT / DUPLICATE COPY ***</p>
            <p>{businessSettings?.receipt_footer || 'Thank you for shopping with us!'}</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-between pt-2 border-t border-white/10 no-print">
          <div>
            {sale.status !== 'returned' && onInitiateReturn && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Undo2 size={14} />}
                onClick={() => {
                  onClose();
                  onInitiateReturn(sale);
                }}
              >
                Initiate Return
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>

            <Button
              variant="secondary"
              leftIcon={<Printer size={15} />}
              onClick={async () => {
                const el = document.getElementById('receipt-detail-doc');
                if (el && window.skythsAPI) {
                  try {
                    const res = await window.skythsAPI.printSilent({
                      htmlContent: el.innerHTML,
                      printerName: businessSettings?.selected_printer,
                      pageSize: format,
                    });
                    if (res?.success) {
                      alert('Direct silent reprint sent to thermal printer!');
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
              Silent Print
            </Button>

            <Button variant="primary" leftIcon={<Printer size={15} />} onClick={handlePrint}>
              Reprint Document
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
