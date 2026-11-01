import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';

// Shell & Auth Components
import { SplashScreen } from './components/setup/SplashScreen';
import { SetupWizard } from './components/setup/SetupWizard';
import { LoginScreen } from './components/auth/LoginScreen';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { SkythsAssistant } from './components/assistant/SkythsAssistant';

// Functional Views
import { DashboardView } from './components/dashboard/DashboardView';
import { PosView } from './components/pos/PosView';
import { ProductListView } from './components/products/ProductListView';
import { CategoriesView } from './components/categories/CategoriesView';
import { StockMovementsView } from './components/stock/StockMovementsView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { CustomersView } from './components/customers/CustomersView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { SalesReturnsView } from './components/returns/SalesReturnsView';
import { PurchaseReturnsView } from './components/returns/PurchaseReturnsView';
import { PaymentsView } from './components/finance/PaymentsView';
import { ExpensesView } from './components/finance/ExpensesView';
import { CashManagementView } from './components/finance/CashManagementView';
import { FinancialReportsView } from './components/reports/FinancialReportsView';
import { InvoicePrintCenter } from './components/invoices/InvoicePrintCenter';
import { NotificationsView } from './components/notifications/NotificationsView';
import { UserManagementView } from './components/users/UserManagementView';
import { SettingsView } from './components/settings/SettingsView';
import { BackupRecoveryView } from './components/backup/BackupRecoveryView';
import { AuditLogsView } from './components/audit/AuditLogsView';

import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const App: React.FC = () => {
  const {
    isSplashFinished,
    isConfigured,
    isLoggedIn,
    activeView,
    setActiveView,
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
        }
      } catch (err) {
        console.error('Failed to load initial settings:', err);
      }
    };

    if (isConfigured && isLoggedIn) {
      loadInitialSettings();
    }
  }, [isConfigured, isLoggedIn]);

  // Phase 1: Splash Screen
  if (!isSplashFinished) {
    return <SplashScreen />;
  }

  // Phase 2: First-run Setup Wizard (if not yet configured)
  if (!isConfigured) {
    return <SetupWizard />;
  }

  // Phase 3: Login Authentication
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Map view IDs to display titles for topbar
  const viewTitles: Record<string, string> = {
    dashboard: 'Business Overview & Analytics',
    pos: 'Point of Sale (POS) Billing',
    products: 'Products & Inventory',
    categories: 'Product Categories',
    movements: 'Stock Movements Ledger',
    purchases: 'Purchases & Receiving',
    suppliers: 'Suppliers & Accounts Payable',
    customers: 'Customers & Credit Receivables',
    sales: 'Sales & Invoice History',
    sales_returns: 'Customer Sales Returns',
    purchase_returns: 'Supplier Purchase Returns',
    payments: 'Payments & Receivables Ledger',
    expenses: 'Operating Expenses',
    cash: 'Cash Management & Drawer',
    reports: 'Financial Reports & P&L',
    invoices: 'Invoice & Receipt Print Center',
    notifications: 'Notifications & Alerts',
    users: 'User Management & Roles',
    settings: 'System & Business Settings',
    backup: 'Database Health & Backups',
    audit: 'Immutable Audit Trail',
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <PosView />;
      case 'products':
        return <ProductListView />;
      case 'categories':
        return <CategoriesView />;
      case 'movements':
        return <StockMovementsView />;
      case 'purchases':
        return <PurchasesView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'customers':
        return <CustomersView />;
      case 'sales':
        return <SalesHistoryView />;
      case 'sales_returns':
        return <SalesReturnsView />;
      case 'purchase_returns':
        return <PurchaseReturnsView />;
      case 'payments':
        return <PaymentsView />;
      case 'expenses':
        return <ExpensesView />;
      case 'cash':
        return <CashManagementView />;
      case 'reports':
        return <FinancialReportsView />;
      case 'invoices':
        return <InvoicePrintCenter />;
      case 'notifications':
        return <NotificationsView />;
      case 'users':
        return <UserManagementView />;
      case 'settings':
        return <SettingsView />;
      case 'backup':
        return <BackupRecoveryView />;
      case 'audit':
        return <AuditLogsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#EBEDF1] text-[#080808] font-sans antialiased">
      {/* Persistent Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Topbar currentViewTitle={viewTitles[activeView] || 'Overview'} />

        {/* Scrollable View Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-[#EBEDF1] to-[#D4D8DF]/30">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Floating Offline AI Help Assistant */}
      <SkythsAssistant />

      {/* Global Toast Notifications Container */}
      {notifications.length > 0 && (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {notifications.slice(0, 3).map((n) => (
            <div
              key={n.id}
              className={`p-3.5 rounded-xl shadow-glass-md border flex items-start gap-2.5 pointer-events-auto transition-all duration-200 ${
                n.type === 'danger'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : n.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : n.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-white border-black/10 text-[#080808]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {n.type === 'danger' ? (
                  <AlertTriangle size={16} className="text-[#DC2626]" />
                ) : n.type === 'warning' ? (
                  <AlertTriangle size={16} className="text-amber-600" />
                ) : n.type === 'success' ? (
                  <CheckCircle size={16} className="text-emerald-600" />
                ) : (
                  <Info size={16} className="text-[#353536]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold leading-tight">{n.title}</h4>
                <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{n.message}</p>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="shrink-0 p-1 rounded hover:bg-black/10 text-current transition-colors"
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
