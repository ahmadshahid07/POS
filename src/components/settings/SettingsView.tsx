import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BusinessSettings, AppSettings, PrinterDevice } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import {
  Settings,
  Building2,
  Receipt,
  Package,
  Save,
  CheckCircle2,
  Percent,
  Sliders,
  Printer,
  Volume2,
  Coins,
  ShieldCheck,
  Database
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { businessSettings, setBusinessSettings, appSettings, setAppSettings, addNotification } = useAppStore();

  const [activeTab, setActiveTab] = useState<'business' | 'pos' | 'inventory' | 'backup'>('business');
  const [saving, setSaving] = useState(false);

  // Business profile form
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('₨');
  const [dateFormat, setDateFormat] = useState('DD-MM-YYYY');
  const [invoiceFooter, setInvoiceFooter] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');

  // Tax Breakdown & Compliance
  const [taxMode, setTaxMode] = useState<'single' | 'breakdown' | 'exempt'>('single');
  const [taxRate, setTaxRate] = useState('0');
  const [taxLabel, setTaxLabel] = useState('GST');
  const [taxRate2, setTaxRate2] = useState('0');
  const [taxLabel2, setTaxLabel2] = useState('PST / Service Tax');
  const [fbrPosId, setFbrPosId] = useState('');

  // Multi-Currency
  const [enableSecondaryCurrency, setEnableSecondaryCurrency] = useState(false);
  const [secondaryCurrencyCode, setSecondaryCurrencyCode] = useState('USD');
  const [secondaryCurrencySymbol, setSecondaryCurrencySymbol] = useState('$');
  const [exchangeRate, setExchangeRate] = useState('278.50');

  // POS / Direct Thermal Printing
  const [receiptPaperSize, setReceiptPaperSize] = useState<'80mm' | '58mm' | 'a4'>('80mm');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [silentPrintEnabled, setSilentPrintEnabled] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [autoPrintOnCheckout, setAutoPrintOnCheckout] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<PrinterDevice[]>([]);

  // Sound Alerts
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [lowStockChimeEnabled, setLowStockChimeEnabled] = useState(true);

  // Inventory defaults
  const [lowStockThreshold, setLowStockThreshold] = useState('5');

  // Automated Backups
  const [autoBackupOnDrawerClose, setAutoBackupOnDrawerClose] = useState(true);
  const [autoDailyBackupEnabled, setAutoDailyBackupEnabled] = useState(true);

  useEffect(() => {
    if (businessSettings) {
      setBusinessName(businessSettings.business_name || '');
      setOwnerName(businessSettings.owner_name || '');
      setPhone(businessSettings.phone || '');
      setEmail(businessSettings.email || '');
      setAddress(businessSettings.address || '');
      setCurrency(businessSettings.currency || '₨');
      setDateFormat(businessSettings.date_format || 'DD-MM-YYYY');
      setTaxMode(businessSettings.tax_mode || 'single');
      setTaxRate(businessSettings.tax_rate?.toString() || '0');
      setTaxLabel(businessSettings.tax_name || 'GST');
      setTaxRate2(businessSettings.tax_rate_2?.toString() || '0');
      setTaxLabel2(businessSettings.tax_name_2 || 'PST / Service Tax');
      setFbrPosId(businessSettings.fbr_pos_id || '');
      setEnableSecondaryCurrency(!!businessSettings.enable_secondary_currency);
      setSecondaryCurrencyCode(businessSettings.secondary_currency_code || 'USD');
      setSecondaryCurrencySymbol(businessSettings.secondary_currency_symbol || '$');
      setExchangeRate(businessSettings.exchange_rate?.toString() || '278.50');
      setReceiptPaperSize(businessSettings.receipt_size || '80mm');
      setInvoicePrefix(businessSettings.invoice_prefix || 'INV-');
      setLowStockThreshold(businessSettings.low_stock_threshold?.toString() || '5');
      setInvoiceFooter(businessSettings.receipt_footer || '');
      setReturnPolicy(businessSettings.return_policy || '');
      setSilentPrintEnabled(!!businessSettings.silent_print_enabled);
      setSelectedPrinter(businessSettings.selected_printer || '');
      setAutoPrintOnCheckout(!!businessSettings.auto_print_on_checkout);
      setSoundEffectsEnabled(businessSettings.sound_effects_enabled !== false);
      setLowStockChimeEnabled(businessSettings.low_stock_chime_enabled !== false);
      setAutoBackupOnDrawerClose(businessSettings.auto_backup_on_drawer_close !== false);
    }

    // Load available hardware printers from Electron
    const loadPrinters = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).skythsAPI) {
          const list = await (window as any).skythsAPI.getPrinters();
          setAvailablePrinters(list || []);
        }
      } catch (err) {
        console.warn('Could not query hardware printers:', err);
      }
    };
    loadPrinters();
  }, [businessSettings]);

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      if (window.skythsAPI) {
        const payload: Partial<BusinessSettings> = {
          business_name: businessName,
          owner_name: ownerName,
          phone,
          email,
          address,
          currency,
          date_format: dateFormat,
          receipt_footer: invoiceFooter,
          return_policy: returnPolicy,
          tax_mode: taxMode,
          tax_rate: parseFloat(taxRate) || 0,
          tax_name: taxLabel,
          tax_rate_2: parseFloat(taxRate2) || 0,
          tax_name_2: taxLabel2,
          fbr_pos_id: fbrPosId.trim() || undefined,
          enable_secondary_currency: enableSecondaryCurrency,
          secondary_currency_code: secondaryCurrencyCode.trim().toUpperCase(),
          secondary_currency_symbol: secondaryCurrencySymbol.trim(),
          exchange_rate: parseFloat(exchangeRate) || 1,
          receipt_size: receiptPaperSize,
          invoice_prefix: invoicePrefix.trim() || 'INV-',
          silent_print_enabled: silentPrintEnabled,
          selected_printer: selectedPrinter,
          auto_print_on_checkout: autoPrintOnCheckout,
          sound_effects_enabled: soundEffectsEnabled,
          low_stock_chime_enabled: lowStockChimeEnabled,
          low_stock_threshold: Number(lowStockThreshold) || 5,
          auto_backup_on_drawer_close: autoBackupOnDrawerClose,
        };

        const updated = await window.skythsAPI.updateBusinessSettings(payload);
        setBusinessSettings(updated);
        addNotification({
          title: 'Configuration Saved',
          message: 'All business preferences and hardware rules updated successfully.',
          type: 'success',
        });
      }
    } catch (err: any) {
      addNotification({ title: 'Save Failed', message: err.message, type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#080808] flex items-center gap-2">
            <Settings className="text-[#353536]" size={22} />
            System & Business Configuration
          </h1>
          <p className="text-xs text-[#706F70]">
            Customize company identity, multi-tier taxation, thermal printing hardware, and automated backups.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => handleSaveAll()} disabled={saving}>
          <Save size={15} />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-black/10 pb-2 flex-wrap">
        <button
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'business' ? 'bg-[#080808] text-white' : 'text-[#706F70] hover:text-[#080808]'
          }`}
        >
          <Building2 size={14} />
          Business Identity & Multi-Tax
        </button>

        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'pos' ? 'bg-[#080808] text-white' : 'text-[#706F70] hover:text-[#080808]'
          }`}
        >
          <Printer size={14} />
          Thermal Printing & Hardware
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'inventory' ? 'bg-[#080808] text-white' : 'text-[#706F70] hover:text-[#080808]'
          }`}
        >
          <Package size={14} />
          Inventory Rules
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'backup' ? 'bg-[#080808] text-white' : 'text-[#706F70] hover:text-[#080808]'
          }`}
        >
          <Database size={14} />
          Automated Backups
        </button>
      </div>

      {/* TAB 1: BUSINESS IDENTITY, TAXATION & MULTI-CURRENCY */}
      {activeTab === 'business' && (
        <form onSubmit={handleSaveAll} className="space-y-6">
          <GlassCard className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#080808] uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} />
              Company Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Name *"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. SKYTHS Retail Enterprises"
                required
              />

              <Input
                label="Owner / Managing Director"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Ahmad Khan"
              />

              <Input
                label="Phone / Support Contact"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
              />

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.com"
              />
            </div>

            <Input
              label="Physical Business Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop #12, Commercial Market, Lahore, Pakistan"
            />
          </GlassCard>

          {/* Taxation Treatment & Breakdown */}
          <GlassCard className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#080808] uppercase tracking-wider flex items-center gap-2">
              <Percent size={16} />
              Multi-Tier Taxation & Compliance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#353536] mb-1">Tax Calculation Mode</label>
                <select
                  value={taxMode}
                  onChange={(e) => setTaxMode(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none"
                >
                  <option value="single">Single Standard Tax Rate</option>
                  <option value="breakdown">Multi-Tier Breakdown (GST + PST/Service Tax)</option>
                  <option value="exempt">Tax Exempt (0% All Invoices)</option>
                </select>
                <span className="text-[10px] text-[#706F70] mt-1 block">
                  Select whether invoices calculate single tax, dual tax splits, or zero tax.
                </span>
              </div>

              <Input
                label="Primary Tax Name"
                value={taxLabel}
                onChange={(e) => setTaxLabel(e.target.value)}
                placeholder="GST / VAT"
                disabled={taxMode === 'exempt'}
              />

              <Input
                label="Primary Tax Rate (%)"
                type="number"
                step="0.1"
                min="0"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="17.0"
                disabled={taxMode === 'exempt'}
              />
            </div>

            {taxMode === 'breakdown' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-black/[0.02] border border-black/5">
                <Input
                  label="Secondary Tax Name (PST / Service Tax)"
                  value={taxLabel2}
                  onChange={(e) => setTaxLabel2(e.target.value)}
                  placeholder="Provincial Sales Tax (PST)"
                />

                <Input
                  label="Secondary Tax Rate (%)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={taxRate2}
                  onChange={(e) => setTaxRate2(e.target.value)}
                  placeholder="3.0"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-black/5">
              <Input
                label="FBR POS Registration ID (Optional)"
                value={fbrPosId}
                onChange={(e) => setFbrPosId(e.target.value)}
                placeholder="e.g. FBR-1004829-POS"
              />
              <div className="text-[11px] text-[#706F70] flex items-center">
                When provided, printed receipts display the verified FBR POS invoice banner and identifier.
              </div>
            </div>
          </GlassCard>

          {/* Multi-Currency Support */}
          <GlassCard className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#080808] uppercase tracking-wider flex items-center gap-2">
              <Coins size={16} />
              Currency & Exchange Rates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Primary Store Currency Symbol"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="₨, PKR, $"
                required
              />

              <div>
                <label className="block text-xs font-medium text-[#353536] mb-1">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none"
                >
                  <option value="DD-MM-YYYY">DD-MM-YYYY (Default)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs font-medium text-[#080808]">
                  <input
                    type="checkbox"
                    checked={enableSecondaryCurrency}
                    onChange={(e) => setEnableSecondaryCurrency(e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black"
                  />
                  <span>Show Secondary Foreign Currency on Bills</span>
                </label>
              </div>
            </div>

            {enableSecondaryCurrency && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-black/[0.02] border border-black/5">
                <Input
                  label="Secondary Currency Code"
                  value={secondaryCurrencyCode}
                  onChange={(e) => setSecondaryCurrencyCode(e.target.value)}
                  placeholder="USD, EUR, AED"
                />

                <Input
                  label="Secondary Currency Symbol"
                  value={secondaryCurrencySymbol}
                  onChange={(e) => setSecondaryCurrencySymbol(e.target.value)}
                  placeholder="$, €, AED"
                />

                <Input
                  label="Exchange Rate (Primary Units per 1 Foreign Unit)"
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="e.g. 278.50"
                />
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#080808] uppercase tracking-wider flex items-center gap-2">
              <Receipt size={16} />
              Invoice & Receipt Policies
            </h2>

            <div className="space-y-4">
              <Input
                label="Invoice Footer Note"
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                placeholder="Thank you for shopping with us! Please visit again."
              />

              <div>
                <label className="block text-xs font-medium text-[#353536] mb-1">Customer Exchange & Return Policy</label>
                <textarea
                  className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none"
                  rows={2}
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                  placeholder="Items exchangeable within 7 days upon presentation of valid sales receipt."
                />
              </div>
            </div>
          </GlassCard>
        </form>
      )}

      {/* TAB 2: THERMAL PRINTING & HARDWARE */}
      {activeTab === 'pos' && (
        <GlassCard className="p-6 space-y-6">
          <div className="border-b border-black/10 pb-4">
            <h2 className="text-sm font-bold text-[#080808] uppercase tracking-wider flex items-center gap-2">
              <Printer size={16} />
              Direct ESC/POS Thermal Printing & Hardware
            </h2>
            <p className="text-xs text-[#706F70] mt-1">
              Configure silent direct thermal printing to bypass browser print dialogs and print instantly to 58mm/80mm USB receipt printers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-black/10 bg-white space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={silentPrintEnabled}
                  onChange={(e) => setSilentPrintEnabled(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-black focus:ring-black"
                />
                <div>
                  <span className="text-xs font-bold text-[#080808] block">Enable Direct Silent Printing</span>
                  <span className="text-[11px] text-[#706F70]">
                    Directly prints receipts to the designated thermal printer without displaying Windows print preview.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-black/5">
                <input
                  type="checkbox"
                  checked={autoPrintOnCheckout}
                  onChange={(e) => setAutoPrintOnCheckout(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-black focus:ring-black"
                />
                <div>
                  <span className="text-xs font-bold text-[#080808] block">Auto-Print on POS Checkout</span>
                  <span className="text-[11px] text-[#706F70]">
                    Automatically triggers silent receipt printing immediately upon pressing Enter/Complete Sale.
                  </span>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#353536] mb-1">Target Thermal Printer Device</label>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none"
                >
                  <option value="">Default Operating System Printer</option>
                  {availablePrinters.map((p, idx) => (
                    <option key={idx} value={p.name}>
                      {p.displayName || p.name} {p.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#706F70] mt-1 block">
                  Detected {availablePrinters.length} installed system printer(s).
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#353536] mb-1">Default Receipt Paper Size</label>
                <select
                  value={receiptPaperSize}
                  onChange={(e) => setReceiptPaperSize(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none"
                >
                  <option value="80mm">80 mm Standard Thermal Roll (POS-80)</option>
                  <option value="58mm">58 mm Compact Thermal Roll (POS-58)</option>
                  <option value="a4">A4 Full Commercial Invoice</option>
                </select>
              </div>

              <Input
                label="Invoice Prefix"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="INV-"
              />
            </div>
          </div>

          {/* Sound & Audio Alerts */}
          <div className="pt-6 border-t border-black/10">
            <h3 className="text-xs font-bold text-[#080808] uppercase tracking-wider flex items-center gap-2 mb-3">
              <Volume2 size={15} />
              Audio & Low-Stock Alerts (Zero-Dependency Web Audio)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-black/10 bg-white">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEffectsEnabled}
                    onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#080808] block">POS Audio Sound Effects</span>
                    <span className="text-[10px] text-[#706F70]">
                      Plays crisp scanner beep on item addition and pleasant checkout chime.
                    </span>
                  </div>
                </label>
              </div>

              <div className="p-3.5 rounded-xl border border-black/10 bg-white">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lowStockChimeEnabled}
                    onChange={(e) => setLowStockChimeEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#080808] block">Low-Stock Warning Alert Chime</span>
                    <span className="text-[10px] text-[#706F70]">
                      Plays an audible double-tone warning when rung-up item drops at or below reorder threshold.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* TAB 3: INVENTORY RULES */}
      {activeTab === 'inventory' && (
        <GlassCard className="p-6 space-y-6">
          <h2 className="text-sm font-bold text-[#080808] uppercase tracking-wider flex items-center gap-2">
            <Package size={16} />
            Inventory Stock Rules & Thresholds
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Global Low Stock Alert Threshold"
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder="5"
            />

            <div>
              <label className="block text-xs font-medium text-[#353536] mb-1">Negative Stock Policy</label>
              <select className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none">
                <option value="disallow">Strict: Block checkout when item stock is 0 (Recommended)</option>
                <option value="allow">Permissive: Allow backorders / negative inventory</option>
              </select>
              <span className="text-[10px] text-[#706F70] mt-1 block">Protects against inventory discrepancies.</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* TAB 4: AUTOMATED BACKUPS */}
      {activeTab === 'backup' && (
        <GlassCard className="p-6 space-y-6">
          <div className="border-b border-black/10 pb-4">
            <h2 className="text-sm font-bold text-[#080808] uppercase tracking-wider flex items-center gap-2">
              <Database size={16} />
              Automated Scheduled Backups & Disaster Recovery
            </h2>
            <p className="text-xs text-[#706F70] mt-1">
              Configure automatic background SQLite database snapshots to prevent data loss.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-black/10 bg-white space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDailyBackupEnabled}
                  onChange={(e) => setAutoDailyBackupEnabled(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-black focus:ring-black"
                />
                <div>
                  <span className="text-xs font-bold text-[#080808] block">Daily Scheduled Automated Backup</span>
                  <span className="text-[11px] text-[#706F70]">
                    Automatically creates a verified snapshot once every 24 hours on application startup.
                  </span>
                </div>
              </label>
            </div>

            <div className="p-4 rounded-xl border border-black/10 bg-white space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBackupOnDrawerClose}
                  onChange={(e) => setAutoBackupOnDrawerClose(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-black focus:ring-black"
                />
                <div>
                  <span className="text-xs font-bold text-[#080808] block">Auto-Backup on Cash Drawer Closing</span>
                  <span className="text-[11px] text-[#706F70]">
                    Immediately creates a fresh verified backup when a cashier closes out their shift.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/[0.02] border border-black/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#080808] block">Run Immediate Backup Now</span>
              <span className="text-[11px] text-[#706F70]">
                Takes an instant snapshot with WAL verification without waiting for scheduled trigger.
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  if (window.skythsAPI) {
                    const res = await window.skythsAPI.triggerAutoDailyBackup(true);
                    if (res?.executed) {
                      addNotification({
                        title: 'Backup Successful',
                        message: `Automated backup created at: ${res.backupPath}`,
                        type: 'success',
                      });
                    } else {
                      addNotification({
                        title: 'Backup Skipped',
                        message: 'A fresh backup already exists for today.',
                        type: 'info',
                      });
                    }
                  }
                } catch (e: any) {
                  addNotification({ title: 'Backup Error', message: e.message, type: 'danger' });
                }
              }}
            >
              Trigger Backup Now
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
