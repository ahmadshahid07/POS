import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { CorbelLayout } from './components/corbel/CorbelLayout';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const App: React.FC = () => {
  const {
    user,
    setUser,
    setLoggedIn,
    setConfigured,
    setBusinessSettings,
    setAppSettings,
    notifications,
    removeNotification
  } = useAppStore();

  // Load configuration and settings on initial boot
  useEffect(() => {
    const loadInitialSettings = async () => {
      try {
        if (window.skythsAPI) {
          const biz = await window.skythsAPI.getBusinessSettings();
          if (biz) setBusinessSettings(biz);
          const app = await window.skythsAPI.getAppSettings();
          if (app) setAppSettings(app);
          const configStatus = await window.skythsAPI.isConfigured?.();
          if (configStatus) setConfigured(true);
        }
        if (!user) {
          setUser({
            id: 1,
            username: 'admin',
            full_name: 'Administrator',
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          setLoggedIn(true);
        }
      } catch (err) {
        console.error('Failed to load initial settings:', err);
      }
    };

    loadInitialSettings();
  }, []);

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden">
      {/* 1. Unified Corbel Supply Management System */}
      <CorbelLayout />

      {/* 2. Global Toast Notifications Container */}
      {notifications.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {notifications.slice(0, 4).map((n) => (
            <div
              key={n.id}
              className={`p-3.5 rounded-2xl shadow-2xl border flex items-start gap-2.5 pointer-events-auto transition-all duration-300 backdrop-blur-md ${
                n.type === 'danger'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : n.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : n.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-[#15181D]/90 border-white/10 text-white'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {n.type === 'danger' ? (
                  <AlertTriangle size={16} className="text-red-400" />
                ) : n.type === 'warning' ? (
                  <AlertTriangle size={16} className="text-amber-400" />
                ) : n.type === 'success' ? (
                  <CheckCircle size={16} className="text-emerald-400" />
                ) : (
                  <Info size={16} className="text-sky-400" />
                )}
              </div>
              <div className="flex-1 min-w-0 font-sans">
                <h4 className="text-xs font-bold leading-tight">{n.title}</h4>
                <p className="text-[11px] opacity-80 mt-0.5 leading-snug">{n.message}</p>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="shrink-0 p-1 rounded hover:bg-white/10 text-current transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
