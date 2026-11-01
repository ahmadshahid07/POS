import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { PasswordRecoveryModal } from './PasswordRecoveryModal';
import { Eye, EyeOff, Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { setUser, setActiveView, businessSettings } = useAppStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).skythsAPI) {
        const res = await (window as any).skythsAPI.login({
          username: username.trim(),
          password,
        });

        if (res.success && res.user) {
          setUser(res.user);
          // If cashier, direct to POS, else dashboard
          if (res.user.role === 'cashier') {
            setActiveView('pos');
          } else {
            setActiveView('dashboard');
          }
        } else {
          setError(res.message || 'Invalid username or password.');
        }
      } else {
        // Fallback demo user for web browser review
        const demoUser = {
          id: 1,
          username: 'admin',
          full_name: 'Administrator',
          role: 'admin' as const,
          status: 'active' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(demoUser);
        setActiveView('dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#080808] text-[#EBEDF1] relative overflow-hidden select-none">
      {/* Background aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#353536] to-[#080808] border border-white/20 mb-4 text-white font-mono font-bold text-2xl shadow-glass-lg">
            SK
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-white uppercase font-sans">
            SKYTHS
          </h1>
          <p className="text-xs text-[#ACADB1] uppercase tracking-wider mt-1">
            {businessSettings?.business_name || 'Inventory & Business Management'}
          </p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-sm font-semibold text-white">System Sign In</span>
              <span className="text-[11px] text-[#4ADE80] flex items-center gap-1">
                <ShieldCheck size={13} /> Offline Protected
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 flex items-center gap-2.5 text-xs text-[#F87171]">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or cashier"
              leftIcon={<User size={16} />}
              autoFocus
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={handleKeyUp}
                placeholder="••••••••"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#ACADB1] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                required
              />
              {capsLockActive && (
                <span className="text-[10px] text-[#FBBF24] mt-1 block">
                  ⚠️ Caps Lock is active
                </span>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
            >
              Sign In to System
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsRecoveryOpen(true)}
                className="text-xs text-[#ACADB1] hover:text-white underline underline-offset-4 transition-colors"
              >
                Forgot password? Recover with emergency key
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-[#706F70]">
          SKYTHS Enterprise v1.0.0 • Local Database Operational
        </div>
      </div>

      <PasswordRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
      />
    </div>
  );
};
