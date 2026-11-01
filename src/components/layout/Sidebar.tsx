import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  ArrowLeftRight,
  ShoppingBag,
  Truck,
  Users,
  Receipt,
  Undo2,
  RotateCcw,
  CreditCard,
  Wallet,
  Coins,
  BarChart3,
  Printer,
  Bell,
  Bot,
  UserCog,
  Settings,
  Database,
  ScrollText,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles?: ('admin' | 'manager' | 'cashier')[];
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, user, logout } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['admin', 'manager'] },
    { id: 'pos', label: 'Point of Sale', icon: <ShoppingCart size={18} />, roles: ['admin', 'manager', 'cashier'], badge: 'POS' },
    { id: 'products', label: 'Products & Stock', icon: <Package size={18} />, roles: ['admin', 'manager'] },
    { id: 'categories', label: 'Categories', icon: <Layers size={18} />, roles: ['admin', 'manager'] },
    { id: 'movements', label: 'Stock Movements', icon: <ArrowLeftRight size={18} />, roles: ['admin', 'manager'] },
    { id: 'purchases', label: 'Purchases & Receiving', icon: <ShoppingBag size={18} />, roles: ['admin', 'manager'] },
    { id: 'suppliers', label: 'Suppliers & Payables', icon: <Truck size={18} />, roles: ['admin', 'manager'] },
    { id: 'customers', label: 'Customers & Credit', icon: <Users size={18} />, roles: ['admin', 'manager', 'cashier'] },
    { id: 'sales', label: 'Sales History', icon: <Receipt size={18} />, roles: ['admin', 'manager', 'cashier'] },
    { id: 'sales_returns', label: 'Sales Returns', icon: <Undo2 size={18} />, roles: ['admin', 'manager'] },
    { id: 'purchase_returns', label: 'Purchase Returns', icon: <RotateCcw size={18} />, roles: ['admin', 'manager'] },
    { id: 'payments', label: 'Payments Ledger', icon: <CreditCard size={18} />, roles: ['admin', 'manager'] },
    { id: 'expenses', label: 'Expenses', icon: <Wallet size={18} />, roles: ['admin', 'manager'] },
    { id: 'cash', label: 'Cash Management', icon: <Coins size={18} />, roles: ['admin', 'manager', 'cashier'] },
    { id: 'reports', label: 'Financial Reports', icon: <BarChart3 size={18} />, roles: ['admin', 'manager'] },
    { id: 'invoices', label: 'Invoice & Print Center', icon: <Printer size={18} />, roles: ['admin', 'manager', 'cashier'] },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, roles: ['admin', 'manager', 'cashier'] },
    { id: 'assistant', label: 'Help Assistant', icon: <Bot size={18} />, roles: ['admin', 'manager', 'cashier'] },
    { id: 'users', label: 'User Management', icon: <UserCog size={18} />, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} />, roles: ['admin'] },
    { id: 'backup', label: 'Database & Backups', icon: <Database size={18} />, roles: ['admin'] },
    { id: 'audit', label: 'Audit Logs', icon: <ScrollText size={18} />, roles: ['admin'] },
  ];

  const userRole = user?.role || 'cashier';
  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(userRole));

  return (
    <aside
      className={`relative z-40 h-screen bg-[#080808] border-r border-white/10 flex flex-col transition-all duration-300 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#353536] to-[#080808] border border-white/20 flex items-center justify-center font-mono font-bold text-white text-sm shadow-glass-sm">
              SK
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-wider text-sm text-white uppercase font-sans">SKYTHS</span>
              <span className="text-[9px] text-[#706F70] uppercase font-mono tracking-widest leading-none">Management</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-[#141415] border border-white/20 flex items-center justify-center font-mono font-bold text-white text-sm">
            SK
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-[#706F70] hover:text-white hover:bg-white/10 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Items (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {visibleItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white text-[#080808] shadow-glass-sm font-semibold'
                  : 'text-[#ACADB1] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`shrink-0 ${isActive ? 'text-[#080808]' : 'text-[#706F70]'}`}>
                {item.icon}
              </span>

              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-[#080808] text-white' : 'bg-white/10 text-[#D4D8DF]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Logout Action at Bottom */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          onClick={logout}
          title="Sign Out"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#F87171] hover:bg-[#DC2626]/10 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
