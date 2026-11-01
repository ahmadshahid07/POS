import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Product, BusinessSettings } from '../../types';
import { Printer, Barcode } from 'lucide-react';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  businessSettings: BusinessSettings | null;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  product,
  businessSettings,
}) => {
  const [copies, setCopies] = React.useState(4);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !product) return null;

  const currencySymbol = businessSettings?.currency_symbol || '₨';
  const displayCode = product.barcode || product.sku;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Barcode Labels"
      subtitle={`Product: ${product.name}`}
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between no-print">
          <label className="text-xs text-[#ACADB1]">Number of Labels to Print:</label>
          <input
            type="number"
            min="1"
            max="100"
            value={copies}
            onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
            className="w-20 bg-[#0E0E0F] border border-white/10 rounded px-2 py-1 text-center font-mono text-xs text-white"
          />
        </div>

        {/* Printable Barcode Label Grid */}
        <div
          ref={printRef}
          className="printable-area grid grid-cols-2 gap-3 p-4 bg-white text-black rounded shadow-md max-h-80 overflow-y-auto"
        >
          {Array.from({ length: copies }).map((_, idx) => (
            <div
              key={idx}
              className="border border-black p-2 flex flex-col items-center justify-center text-center rounded"
            >
              <div className="text-[9px] font-bold uppercase truncate max-w-[140px]">
                {businessSettings?.business_name || 'SKYTHS'}
              </div>
              <div className="text-[10px] font-medium truncate max-w-[140px] leading-tight my-0.5">
                {product.name}
              </div>
              {/* Simulated crisp high-contrast barcode display */}
              <div className="w-full flex items-center justify-center py-1">
                <div className="font-mono tracking-[0.2em] text-xs font-black select-all bg-black text-white px-2 py-0.5 rounded">
                  ||| {displayCode} |||
                </div>
              </div>
              <div className="text-[10px] font-mono">{displayCode}</div>
              <div className="text-xs font-bold font-sans mt-0.5">
                {currencySymbol} {product.selling_price.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-white/10 no-print">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" leftIcon={<Printer size={16} />} onClick={handlePrint}>
            Print Labels
          </Button>
        </div>
      </div>
    </Modal>
  );
};
