import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  FolderOpen,
  Building2,
  UserCheck,
  Sliders,
  CheckCircle,
  Copy,
  AlertTriangle,
  HardDrive,
  ArrowRight,
  ArrowLeft,
  KeyRound
} from 'lucide-react';

export const SetupWizard: React.FC = () => {
  const { setConfigured, setBusinessSettings, setAppSettings } = useAppStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [dbDirectory, setDbDirectory] = useState('D:\\SKYTHS_Data');
  const [dirValidated, setDirValidated] = useState(false);
  const [dirStatusMessage, setDirStatusMessage] = useState('');

  const [businessProfile, setBusinessProfile] = useState({
    business_name: 'SKYTHS Enterprise',
    owner_name: 'Business Owner',
    address: 'Commercial Plaza, Mall Road, Lahore, Pakistan',
    phone: '+92 300 1234567',
    email: 'info@skyths.local',
    currency: 'PKR',
    currency_symbol: '₨',
    date_format: 'DD-MM-YYYY',
    tax_rate: 0,
    tax_name: 'GST',
    invoice_prefix: 'INV',
    receipt_size: '80mm' as '58mm' | '80mm' | 'a4',
    low_stock_threshold: 5,
  });

  const [adminData, setAdminData] = useState({
    username: 'admin',
    full_name: 'System Administrator',
    password: '',
    confirm_password: '',
    email: '',
    phone: '',
  });

  const [generatedRecoveryCode, setGeneratedRecoveryCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Folder selection via native Electron dialog or fallback
  const handleBrowseFolder = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const selected = await (window as any).skythsAPI.selectDirectory();
        if (selected) {
          setDbDirectory(selected);
          validateFolder(selected);
        }
      }
    } catch (err: any) {
      setError(`Directory selection error: ${err.message}`);
    }
  };

  const validateFolder = async (dirPath: string) => {
    setError(null);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const res = await (window as any).skythsAPI.validateDirectory(dirPath);
        if (res.valid) {
          setDirValidated(true);
          setDirStatusMessage(res.message);
        } else {
          setDirValidated(false);
          setError(res.message);
        }
      } else {
        setDirValidated(true);
        setDirStatusMessage('Folder path set for configuration.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Step 5: Submit Admin & Initialize DB
  const handleInitializeSystem = async () => {
    setError(null);

    if (!adminData.username.trim()) {
      setError('Administrator username is required.');
      return;
    }
    if (adminData.password.length < 6) {
      setError('Administrator password must be at least 6 characters.');
      return;
    }
    if (adminData.password !== adminData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const result = await (window as any).skythsAPI.initDatabase({
          dirPath: dbDirectory,
          businessProfile,
          adminData: {
            username: adminData.username,
            full_name: adminData.full_name,
            password: adminData.password,
            email: adminData.email,
            phone: adminData.phone,
          },
        });

        if (result.success) {
          setGeneratedRecoveryCode(result.recoveryCode);
          setStep(6);
        }
      } else {
        // Web preview mode simulation
        setGeneratedRecoveryCode('SKYTHS-A1B2C3-D4E5F6');
        setStep(6);
      }
    } catch (err: any) {
      setError(`Database initialization failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const b = await (window as any).skythsAPI.getBusinessSettings();
        const a = await (window as any).skythsAPI.getAppSettings();
        setBusinessSettings(b);
        setAppSettings(a);
      }
      setConfigured(true);
    } catch (err) {
      console.warn(err);
      setConfigured(true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#080808] text-[#EBEDF1]">
      <div className="w-full max-w-2xl">
        {/* Wizard Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1E1E20] border border-white/20 mb-3 text-white font-mono font-bold text-lg">
            SK
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SKYTHS Setup Wizard</h1>
          <p className="text-xs text-[#ACADB1] mt-1">
            Step {step} of 7 — Professional Local Desktop Configuration
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  s === step
                    ? 'w-8 bg-white'
                    : s < step
                    ? 'w-3 bg-[#706F70]'
                    : 'w-3 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 flex items-center gap-3 text-sm text-[#F87171]">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <GlassCard className="p-8">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white">
                  <HardDrive size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Welcome to SKYTHS</h2>
                  <p className="text-xs text-[#ACADB1]">
                    Offline Desktop Inventory, POS & Business Management System
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-[#D4D8DF] bg-white/[0.02] p-4 rounded-xl border border-white/5">
                <p>
                  SKYTHS is built specifically for business owners who demand <strong>complete offline autonomy</strong>, fast point-of-sale processing, and reliable financial reporting.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="font-semibold text-white block">100% Offline Database</span>
                    <span className="text-[#ACADB1]">All products, sales, and accounts stay on this PC.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="font-semibold text-white block">Transactional Integrity</span>
                    <span className="text-[#ACADB1]">ACID SQLite engine with atomic commits and zero data loss.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="font-semibold text-white block">Integrated Accounting</span>
                    <span className="text-[#ACADB1]">Automated COGS, gross & net profit, and receivables ledger.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="font-semibold text-white block">Thermal & A4 Printing</span>
                    <span className="text-[#ACADB1]">Instant 58mm, 80mm receipts and formal invoices.</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep(2)} rightIcon={<ArrowRight size={16} />}>
                  Get Started
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: DATABASE LOCATION */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white">
                  <FolderOpen size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Select Database Location</h2>
                  <p className="text-xs text-[#ACADB1]">
                    Choose a secure permanent directory on your disk to store your business records.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs text-[#ACADB1] font-medium">Database Folder Path</label>
                <div className="flex gap-2">
                  <Input
                    value={dbDirectory}
                    onChange={(e) => {
                      setDbDirectory(e.target.value);
                      setDirValidated(false);
                    }}
                    placeholder="e.g. D:\SKYTHS_Data"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleBrowseFolder}
                    leftIcon={<FolderOpen size={16} />}
                  >
                    Browse
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => validateFolder(dbDirectory)}
                  >
                    Validate Folder Access
                  </Button>
                  {dirValidated && (
                    <span className="text-xs text-[#4ADE80] flex items-center gap-1">
                      <CheckCircle size={14} /> {dirStatusMessage || 'Access Verified'}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#D97706]/10 border border-[#D97706]/30 text-xs text-[#FBBF24]">
                <strong>Important:</strong> Do not choose a temporary directory or removable USB drive that may be disconnected during daily sales transactions.
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)} leftIcon={<ArrowLeft size={16} />}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!dbDirectory.trim()}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: DATABASE INITIALIZATION REVIEW */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white">
                  <HardDrive size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Database File Structure</h2>
                  <p className="text-xs text-[#ACADB1]">
                    Verification of the target database file.
                  </p>
                </div>
              </div>

              <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-2 text-sm font-mono">
                <div className="text-xs text-[#706F70]">Target SQLite File:</div>
                <div className="text-white text-xs break-all bg-white/5 p-2 rounded border border-white/5">
                  {dbDirectory.replace(/[\\/]+$/, '')}\skyths_inventory.db
                </div>
                <div className="text-xs text-[#ACADB1] pt-2">
                  • Foreign keys and WAL journaling will be enabled.<br />
                  • 32 core relational tables and query indexes will be initialized.<br />
                  • If an existing database is found, it will be safely verified.
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)} leftIcon={<ArrowLeft size={16} />}>
                  Back
                </Button>
                <Button onClick={() => setStep(4)} rightIcon={<ArrowRight size={16} />}>
                  Proceed to Business Profile
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: BUSINESS PROFILE */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white">
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Business Profile</h2>
                  <p className="text-xs text-[#ACADB1]">
                    Enter details that will appear on printed customer receipts and invoices.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Business Name *"
                  value={businessProfile.business_name}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, business_name: e.target.value })}
                  placeholder="e.g. Al-Rehman General Store"
                />
                <Input
                  label="Owner / Contact Person *"
                  value={businessProfile.owner_name}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, owner_name: e.target.value })}
                  placeholder="e.g. Muhammad Ahmad"
                />
                <div className="col-span-2">
                  <Input
                    label="Business Address *"
                    value={businessProfile.address}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                    placeholder="e.g. Shop #12, Commercial Market, Lahore"
                  />
                </div>
                <Input
                  label="Phone / Mobile Number *"
                  value={businessProfile.phone}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                />
                <Input
                  label="Email (Optional)"
                  value={businessProfile.email}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, email: e.target.value })}
                  placeholder="contact@business.com"
                />
                <Input
                  label="Currency Code"
                  value={businessProfile.currency}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, currency: e.target.value })}
                  placeholder="PKR"
                />
                <Input
                  label="Currency Symbol"
                  value={businessProfile.currency_symbol}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, currency_symbol: e.target.value })}
                  placeholder="₨"
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(3)} leftIcon={<ArrowLeft size={16} />}>
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (!businessProfile.business_name.trim() || !businessProfile.address.trim()) {
                      setError('Business Name and Address are required.');
                      return;
                    }
                    setError(null);
                    setStep(5);
                  }}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Next: Administrator Account
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: ADMINISTRATOR ACCOUNT & INITIALIZE */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Create Administrator Account</h2>
                  <p className="text-xs text-[#ACADB1]">
                    This account has full master privileges over settings, backups, and users.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Administrator Username *"
                  value={adminData.username}
                  onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                  placeholder="admin"
                />
                <Input
                  label="Full Name *"
                  value={adminData.full_name}
                  onChange={(e) => setAdminData({ ...adminData, full_name: e.target.value })}
                  placeholder="System Administrator"
                />
                <Input
                  type="password"
                  label="Master Password (Min 6 chars) *"
                  value={adminData.password}
                  onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                  placeholder="••••••••"
                />
                <Input
                  type="password"
                  label="Confirm Master Password *"
                  value={adminData.confirm_password}
                  onChange={(e) => setAdminData({ ...adminData, confirm_password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#ACADB1]">
                🔒 <strong>Zero Plaintext:</strong> Passwords are protected using cryptographic bcrypt salting and hashing. An emergency offline recovery code will be generated on the next step.
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(4)} leftIcon={<ArrowLeft size={16} />}>
                  Back
                </Button>
                <Button
                  isLoading={loading}
                  onClick={handleInitializeSystem}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Initialize Database & Account
                </Button>
              </div>
            </div>
          )}

          {/* STEP 6: EMERGENCY RECOVERY CODE & PREFERENCES */}
          {step === 6 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#D97706]/15 border border-[#D97706]/30 text-[#FBBF24]">
                  <KeyRound size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Emergency Recovery Code</h2>
                  <p className="text-xs text-[#ACADB1]">
                    Save this code offline. It can be used to reset your local administrator password.
                  </p>
                </div>
              </div>

              {/* Recovery Code Display */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#ACADB1] uppercase tracking-wider block">
                    Your Master Local Recovery Key
                  </span>
                  <span className="text-xl font-mono font-bold tracking-widest text-[#4ADE80]">
                    {generatedRecoveryCode}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Copy size={14} />}
                  onClick={() => copyToClipboard(generatedRecoveryCode)}
                >
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>

              {/* Initial Settings */}
              <div className="pt-2 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Sliders size={16} /> Initial Preferences
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#ACADB1]">Receipt Print Format</label>
                    <select
                      className="rounded-xl bg-[#0E0E0F]/80 border border-white/10 px-3 py-2 text-sm text-[#EBEDF1] focus:outline-none focus:border-white/40"
                      value={businessProfile.receipt_size}
                      onChange={(e) =>
                        setBusinessProfile({
                          ...businessProfile,
                          receipt_size: e.target.value as any,
                        })
                      }
                    >
                      <option value="80mm">80mm Thermal Receipt (Standard POS)</option>
                      <option value="58mm">58mm Thermal Receipt (Compact POS)</option>
                      <option value="a4">A4 Full Page Invoice</option>
                    </select>
                  </div>

                  <Input
                    type="number"
                    label="Low Stock Warning Threshold"
                    value={businessProfile.low_stock_threshold}
                    onChange={(e) =>
                      setBusinessProfile({
                        ...businessProfile,
                        low_stock_threshold: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep(7)} rightIcon={<ArrowRight size={16} />}>
                  Finalize Setup
                </Button>
              </div>
            </div>
          )}

          {/* STEP 7: SETUP COMPLETE */}
          {step === 7 && (
            <div className="flex flex-col items-center text-center py-4 gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#16A34A]/20 border border-[#16A34A]/40 flex items-center justify-center text-[#4ADE80]">
                <CheckCircle size={32} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">SKYTHS is Ready!</h2>
                <p className="text-xs text-[#ACADB1] mt-1 max-w-md">
                  Your local database has been initialized, administrator credentials secured, and business profile configured.
                </p>
              </div>

              <div className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs text-left grid grid-cols-2 gap-2 text-[#D4D8DF]">
                <div>
                  <span className="text-[#706F70]">Database Path:</span>
                  <div className="font-mono text-white break-all">{dbDirectory}\skyths_inventory.db</div>
                </div>
                <div>
                  <span className="text-[#706F70]">Administrator:</span>
                  <div className="font-mono text-white">{adminData.username}</div>
                </div>
                <div>
                  <span className="text-[#706F70]">Business Name:</span>
                  <div className="text-white">{businessProfile.business_name}</div>
                </div>
                <div>
                  <span className="text-[#706F70]">Currency:</span>
                  <div className="text-white">PKR ({businessProfile.currency_symbol})</div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full max-w-xs"
                isLoading={loading}
                onClick={handleFinishSetup}
                rightIcon={<ArrowRight size={18} />}
              >
                Launch Application
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
