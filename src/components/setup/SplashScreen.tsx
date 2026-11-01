import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Database, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const { setSplashFinished, setConfigured, setBusinessSettings, setAppSettings } = useAppStore();
  const [statusMessage, setStatusMessage] = useState('Initializing SKYTHS Engine...');
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    let isMounted = true;

    const runInit = async () => {
      try {
        await new Promise((r) => setTimeout(r, 400));
        if (!isMounted) return;
        setStatusMessage('Verifying local SQLite engine & durability...');
        setProgress(40);

        // Check if window.skythsAPI is available
        if (typeof window !== 'undefined' && (window as any).skythsAPI) {
          const config = await (window as any).skythsAPI.getConfig();
          await new Promise((r) => setTimeout(r, 400));
          if (!isMounted) return;

          if (config && config.is_configured && config.db_path) {
            setStatusMessage('Opening business database...');
            setProgress(75);
            try {
              const bSettings = await (window as any).skythsAPI.getBusinessSettings();
              const aSettings = await (window as any).skythsAPI.getAppSettings();
              setBusinessSettings(bSettings);
              setAppSettings(aSettings);
              setConfigured(true);
            } catch (err) {
              console.warn('DB settings read error:', err);
              setConfigured(false);
            }
          } else {
            setConfigured(false);
          }
        } else {
          // Running in standard browser preview mode
          setConfigured(false);
        }

        setProgress(100);
        setStatusMessage('Ready.');
        await new Promise((r) => setTimeout(r, 450));
        if (isMounted) {
          setSplashFinished(true);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        if (isMounted) {
          setConfigured(false);
          setSplashFinished(true);
        }
      }
    };

    runInit();

    return () => {
      isMounted = false;
    };
  }, [setSplashFinished, setConfigured, setBusinessSettings, setAppSettings]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080808] text-[#EBEDF1] select-none">
      {/* Subtle background glow */}
      <div className="absolute w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        {/* Monochrome Geometric Brand Mark */}
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#353536] to-[#080808] border border-white/20 p-0.5 shadow-glass-xl flex items-center justify-center mb-6">
          <div className="w-full h-full rounded-[14px] bg-[#141415] flex items-center justify-center">
            <span className="text-3xl font-bold tracking-tighter text-white font-mono">
              SK
            </span>
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-[#353536] border border-white/20 text-[#EBEDF1]">
            <ShieldCheck size={14} />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <h1 className="text-3xl font-bold tracking-widest text-white uppercase font-sans">
          SKYTHS
        </h1>
        <p className="text-xs tracking-wider text-[#ACADB1] uppercase mt-1 mb-8">
          Offline Inventory & Business Management
        </p>

        {/* Minimal Progress Bar */}
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#706F70] via-[#D4D8DF] to-white transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <div className="flex items-center gap-2 text-xs text-[#706F70]">
          <Database size={12} className="animate-pulse text-[#ACADB1]" />
          <span>{statusMessage}</span>
        </div>
      </div>

      {/* Offline Assurance badge */}
      <div className="absolute bottom-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-[#ACADB1]">
        <CheckCircle2 size={13} className="text-[#4ADE80]" />
        <span>100% Offline Local Engine</span>
      </div>
    </div>
  );
};
