import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SaleDetail, BusinessSettings } from '../../types';
import { Printer, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleDetail | null;
  businessSettings: BusinessSettings | null;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  businessSettings,
  onNewSale,
}) => {
  const [printFormat, setPrintFormat] = React.useState<'80mm' | '58mm' | 'a4'>(
    businessSettings?.receipt_size || '80mm'
  );
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !sale) return null;

  const currencySymbol = businessSettings?.currency_symbol || '₨';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sale Completed Successfully"
      subtitle={`Invoice #${sale.invoice_number}`}
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-6">
        {/* Top Success Banner */}
        <div className="p-3 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/30 flex items-center justify-between text-xs text-[#4ADE80] no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Sale recorded, inventory updated, and invoice committed to database.</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span>Total Paid: {currencySymbol} {sale.paid_amount.toLocaleString()}</span>
            {sale.change_due > 0 && (
              <span className="text-white bg-black/30 px-2 py-0.5 rounded">
                Change: {currencySymbol} {sale.change_due.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Format Selector Pills (no-print) */}
        <div className="flex items-center justify-between no-print border-b border-white/10 pb-3">
          <span className="text-xs text-[#ACADB1]">Select Printer Format:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPrintFormat('80mm')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                printFormat === '80mm'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/5 text-[#ACADB1] hover:bg-white/10'
              }`}
            >
              80mm Thermal
            </button>
            <button
              onClick={() => setPrintFormat('58mm')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                printFormat === '58mm'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/5 text-[#ACADB1] hover:bg-white/10'
              }`}
            >
              58mm Compact
            </button>
            <button
              onClick={() => setPrintFormat('a4')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                printFormat === 'a4'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/5 text-[#ACADB1] hover:bg-white/10'
              }`}
            >
              A4 Invoice
            </button>
          </div>
        </div>

        {/* Printable Document Canvas */}
        <div
          ref={printAreaRef}
          className={`printable-area mx-auto bg-white text-black font-mono transition-all duration-150 rounded shadow-md overflow-hidden ${
            printFormat === '58mm'
              ? 'receipt-58mm max-w-[240px] text-[10px] p-2'
              : printFormat === '80mm'
              ? 'receipt-80mm max-w-[340px] text-xs p-4'
              : 'invoice-a4 max-w-[600px] text-xs p-8'
          }`}
        >
          {/* Receipt Header */}
          <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
            <h2 className="font-bold text-sm tracking-wider uppercase font-sans">
              {businessSettings?.business_name || 'SKYTHS ENTERPRISE'}
            </h2>
            <div className="text-[10px] text-gray-700 mt-0.5">
              {businessSettings?.address || 'Commercial Market, Lahore'}
            </div>
            <div className="text-[10px] text-gray-700">
              Tel: {businessSettings?.phone || '+92 300 1234567'}
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="flex justify-between text-[11px] mb-2 pb-2 border-b border-dashed border-gray-300">
            <div>
              <div><strong>Inv:</strong> {sale.invoice_number}</div>
              <div><strong>Date:</strong> {sale.sale_date.slice(0, 10)} {sale.sale_date.slice(11, 16)}</div>
            </div>
            <div className="text-right">
              <div><strong>Cust:</strong> {sale.customer_name || 'Walk-in'}</div>
              <div><strong>Pay:</strong> {sale.payment_method.toUpperCase()}</div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[11px] mb-3">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1">
                    <div className="font-medium truncate max-w-[150px]">{item.product_name}</div>
                    <div className="text-[9px] text-gray-500">{item.sku}</div>
                  </td>
                  <td className="text-center py-1 align-top">{item.quantity}</td>
                  <td className="text-right py-1 align-top">{item.unit_price}</td>
                  <td className="text-right py-1 align-top font-bold">{item.line_total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[11px]">
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

            {/* Tax Breakdown (Single vs Multi-tier Breakdown) */}
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

            <div className="flex justify-between text-sm font-bold border-t border-b border-gray-400 py-1 my-1">
              <span>GRAND TOTAL:</span>
              <span>{currencySymbol} {sale.grand_total.toFixed(2)}</span>
            </div>

            {/* Multi-Currency Equivalent Conversion */}
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
              <span>Amount Paid:</span>
              <span>{currencySymbol} {sale.paid_amount.toFixed(2)}</span>
            </div>
            {sale.change_due > 0 && (
              <div className="flex justify-between font-bold text-gray-800">
                <span>Change Returned:</span>
                <span>{currencySymbol} {sale.change_due.toFixed(2)}</span>
              </div>
            )}
            {sale.balance_due > 0 && (
              <div className="flex justify-between font-bold text-red-600">
                <span>Balance Due:</span>
                <span>{currencySymbol} {sale.balance_due.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* FBR POS Tax Compliance Strip */}
          {businessSettings?.fbr_pos_id && (
            <div className="border border-gray-400 border-dashed p-1.5 mt-3 text-center text-[9px] text-gray-700">
              <div className="font-bold tracking-widest uppercase">FBR POS VERIFIED INVOICE</div>
              <div className="font-mono">POS ID: {businessSettings.fbr_pos_id} • FBR-INV-{sale.id}</div>
              <div className="text-[8px] text-gray-500">Verify online via FBR Asaan Tax app</div>
            </div>
          )}

          {/* Footer Note */}
          <div className="text-center text-[10px] text-gray-600 border-t border-dashed border-gray-400 mt-4 pt-2">
            <p>{businessSettings?.receipt_footer || 'Thank you for your business!'}</p>
            <p className="text-[8px] text-gray-400 mt-1">Powered by SKYTHS Offline POS</p>
          </div>
        </div>

        {/* Action Buttons (no-print) */}
        <div className="flex flex-wrap justify-between items-center gap-3 pt-2 no-print border-t border-white/10">
          <div className="text-xs text-[#ACADB1]">
            {businessSettings?.silent_print_enabled && (
              <span className="text-[#4ADE80] flex items-center gap-1 font-mono text-[11px]">
                ✓ Silent Direct Printing Active ({businessSettings.selected_printer || 'Default Printer'})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Printer size={15} />}
              onClick={handlePrint}
            >
              Print Preview
            </Button>

            {/* Silent ESC/POS Direct Print Button */}
            <Button
              variant="secondary"
              leftIcon={<Printer size={15} />}
              onClick={async () => {
                try {
                  if (printAreaRef.current && window.skythsAPI) {
                    const res = await window.skythsAPI.printSilent({
                      htmlContent: printAreaRef.current.innerHTML,
                      printerName: businessSettings?.selected_printer,
                      pageSize: printFormat,
                    });
                    if (res?.success) {
                      alert('Direct silent print sent to thermal printer!');
                    } else if (res?.error) {
                      alert(`Printer warning: ${res.error}. Falling back to standard print.`);
                      window.print();
                    }
                  } else {
                    window.print();
                  }
                } catch (e: any) {
                  window.print();
                }
              }}
            >
              Silent Print
            </Button>

            <Button
              variant="primary"
              rightIcon={<ArrowRight size={15} />}
              onClick={() => {
                onClose();
                onNewSale();
              }}
            >
              New Sale (F2)
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
