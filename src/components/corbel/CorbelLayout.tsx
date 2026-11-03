import React, { useEffect } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import { CorbelDock } from './CorbelDock';
import { CorbelHeader } from './CorbelHeader';
import { CorbelDashboardView } from './CorbelDashboardView';
import { CorbelAnalyticsView } from './CorbelAnalyticsView';
import { CorbelWorkspaceView } from './CorbelWorkspaceView';
import { CorbelOrdersView } from './CorbelOrdersView';
import { CorbelProductsView } from './CorbelProductsView';
import { CorbelCustomersView } from './CorbelCustomersView';
import { CorbelMessagesView } from './CorbelMessagesView';
import { CorbelAutomationsView } from './CorbelAutomationsView';
import { CorbelPosView } from './CorbelPosView';
import { CorbelPurchasesView } from './CorbelPurchasesView';
import { CorbelFinanceView } from './CorbelFinanceView';
import { CorbelSettingsView } from './CorbelSettingsView';
import { CorbelSearchModal } from './CorbelSearchModal';
import { CorbelNotificationsModal } from './CorbelNotificationsModal';
import { AddCardModal } from './AddCardModal';

export const CorbelLayout: React.FC = () => {
  const { theme, activeView } = useCorbelStore();

  const isDark = theme === 'dark';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0B0D10';
      document.body.style.color = '#FFFFFF';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#F4F5F7';
      document.body.style.color = '#121316';
    }
  }, [theme]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <CorbelDashboardView />;
      case 'pos':
        return <CorbelPosView />;
      case 'products':
        return <CorbelProductsView />;
      case 'purchases':
        return <CorbelPurchasesView />;
      case 'orders':
        return <CorbelOrdersView />;
      case 'customers':
        return <CorbelCustomersView />;
      case 'finance':
        return <CorbelFinanceView />;
      case 'analytics':
        return <CorbelAnalyticsView />;
      case 'messages':
        return <CorbelMessagesView />;
      case 'settings':
        return <CorbelSettingsView />;
      case 'automations':
        return <CorbelAutomationsView />;
      case 'workspace':
        return <CorbelWorkspaceView />;
      default:
        return <CorbelDashboardView />;
    }
  };

  return (
    <div
      className={`min-h-screen w-screen overflow-x-hidden font-sans antialiased transition-colors duration-300 relative select-none ${
        isDark ? 'bg-[#0B0D10] text-white' : 'bg-[#F4F5F7] text-[#121316]'
      }`}
    >
      {/* 1. Left Floating Capsule Dock */}
      <CorbelDock />

      {/* 2. Main Content Area */}
      <div className="flex flex-col min-h-screen pl-16 sm:pl-20 pr-4 sm:pr-8 py-3">
        {/* Top Header */}
        <CorbelHeader />

        {/* Dynamic View Canvas with Cross-fade Animation */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 py-3">
          <div key={activeView} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* 3. Global Modals */}
      <CorbelSearchModal />
      <CorbelNotificationsModal />
      <AddCardModal />
    </div>
  );
};
