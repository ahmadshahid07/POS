import { create } from 'zustand';
import { User, BusinessSettings, AppSettings, CashSession } from '../types';

interface AppState {
  appMode: 'corbel' | 'enterprise';
  user: User | null;
  activeView: string;
  isSplashFinished: boolean;
  isConfigured: boolean;
  isLoggedIn: boolean;
  businessSettings: BusinessSettings | null;
  appSettings: AppSettings | null;
  activeCashSession: CashSession | null;
  isAssistantOpen: boolean;
  globalSearch: string;
  notifications: { id: string; title: string; message: string; type: 'info' | 'warning' | 'danger' | 'success'; date: string }[];

  setAppMode: (mode: 'corbel' | 'enterprise') => void;
  setUser: (user: User | null) => void;
  setActiveView: (view: string) => void;
  setSplashFinished: (finished: boolean) => void;
  setConfigured: (configured: boolean) => void;
  setLoggedIn: (loggedIn: boolean) => void;
  setBusinessSettings: (settings: BusinessSettings | null) => void;
  setAppSettings: (settings: AppSettings | null) => void;
  setActiveCashSession: (session: CashSession | null) => void;
  setAssistantOpen: (open: boolean) => void;
  toggleAssistant: () => void;
  setGlobalSearch: (search: string) => void;
  addNotification: (n: { title: string; message: string; type?: 'info' | 'warning' | 'danger' | 'success' }) => void;
  removeNotification: (id: string) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  appMode: 'corbel',
  user: null,
  activeView: 'dashboard',
  isSplashFinished: false,
  isConfigured: false,
  isLoggedIn: false,
  businessSettings: null,
  appSettings: null,
  activeCashSession: null,
  isAssistantOpen: false,
  globalSearch: '',
  notifications: [],

  setAppMode: (appMode) => set({ appMode }),

  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setActiveView: (activeView) => set({ activeView }),
  setSplashFinished: (isSplashFinished) => set({ isSplashFinished }),
  setConfigured: (isConfigured) => set({ isConfigured }),
  setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  setBusinessSettings: (businessSettings) => set({ businessSettings }),
  setAppSettings: (appSettings) => set({ appSettings }),
  setActiveCashSession: (activeCashSession) => set({ activeCashSession }),
  setAssistantOpen: (isAssistantOpen) => set({ isAssistantOpen }),
  toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
  addNotification: (n) =>
    set((state) => ({
      notifications: [
        {
          id: Date.now().toString(),
          title: n.title,
          message: n.message,
          type: n.type || 'info',
          date: new Date().toLocaleTimeString(),
        },
        ...state.notifications,
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  logout: () => set({ user: null, isLoggedIn: false, activeView: 'dashboard' }),
}));
