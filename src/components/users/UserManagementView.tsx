import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { User } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  UserCog,
  UserPlus,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Key,
  Lock,
  Mail,
  User as UserIcon
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { user: currentUser, addNotification } = useAppStore();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'cashier'>('cashier');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (window.skythsAPI) {
        const u = await window.skythsAPI.getUsers();
        setUsers(u || []);
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
      addNotification({ title: 'Error', message: 'Failed to load user list.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      addNotification({ title: 'Weak Password', message: 'Password must be at least 6 characters.', type: 'danger' });
      return;
    }

    try {
      setSubmitting(true);
      if (window.skythsAPI) {
        await window.skythsAPI.createUser({
          username,
          full_name: fullName,
          email: email || undefined,
          password,
          role
        });

        addNotification({ title: 'User Created', message: `User @${username} added with role: ${role}`, type: 'success' });
        setIsCreateOpen(false);
        setUsername('');
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('cashier');
        await fetchUsers();
      }
    } catch (err: any) {
      addNotification({ title: 'Creation Failed', message: err.message, type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      addNotification({ title: 'Forbidden', message: 'You cannot deactivate your own active session.', type: 'warning' });
      return;
    }

    try {
      if (window.skythsAPI) {
        const isCurrentlyActive = targetUser.status === 'active';
        const newStatus = isCurrentlyActive ? 'inactive' : 'active';
        await window.skythsAPI.updateUser(targetUser.id, { status: newStatus });
        addNotification({
          title: 'User Status Updated',
          message: `@${targetUser.username} is now ${newStatus === 'active' ? 'Active' : 'Disabled'}`,
          type: 'info'
        });
        await fetchUsers();
      }
    } catch (err: any) {
      addNotification({ title: 'Update Failed', message: err.message, type: 'danger' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#080808] flex items-center gap-2">
            <UserCog className="text-[#353536]" size={22} />
            User Accounts & Role Permissions
          </h1>
          <p className="text-xs text-[#706F70]">
            Manage staff credentials, access levels (Administrator, Manager, Cashier), and account activation.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          <UserPlus size={15} />
          Add Staff Member
        </Button>
      </div>

      {/* Role Summary Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4 space-y-1.5 border-l-4 border-l-[#080808]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#080808]" />
            <span className="font-bold text-xs text-[#080808]">Administrator</span>
          </div>
          <p className="text-[11px] text-[#706F70]">
            Full unrestricted control: configuration, database backups, financial reports, user administration, and system settings.
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-1.5 border-l-4 border-l-[#706F70]">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#706F70]" />
            <span className="font-bold text-xs text-[#080808]">Store Manager</span>
          </div>
          <p className="text-[11px] text-[#706F70]">
            Operational control: inventory management, supplier purchases, stock adjustments, returns authorization, and sales history.
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-1.5 border-l-4 border-l-[#ACADB1]">
          <div className="flex items-center gap-2">
            <UserIcon size={16} className="text-[#ACADB1]" />
            <span className="font-bold text-xs text-[#080808]">Point of Sale Cashier</span>
          </div>
          <p className="text-[11px] text-[#706F70]">
            Fast POS billing: product scan/search, customer cart processing, payment tender, and receipt issuance.
          </p>
        </GlassCard>
      </div>

      {/* User Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-black/5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#080808]">Registered Accounts</span>
          <span className="text-[11px] font-mono text-[#706F70]">{users.length} active users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/5 bg-[#EBEDF1]/60 text-[10px] font-mono uppercase tracking-wider text-[#706F70]">
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Role Access</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Created Date</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#706F70]">
                    Loading accounts...
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#080808] text-white flex items-center justify-center font-mono font-bold text-[11px]">
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[#080808] flex items-center gap-1.5">
                              {u.full_name || u.username}
                              {isSelf && (
                                <span className="text-[9px] font-mono px-1 py-0.2 bg-black/10 rounded text-[#080808]">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-[#706F70]">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            u.role === 'admin'
                              ? 'default'
                              : u.role === 'manager'
                              ? 'info'
                              : 'outline'
                          }
                        >
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#706F70]">
                        {u.email || '—'}
                      </td>

                      <td className="py-3 px-4">
                        {u.status === 'active' ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 size={13} /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[#DC2626] font-semibold text-[11px]">
                            <XCircle size={13} /> Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#706F70]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isSelf && (
                          <Button
                            variant={u.status === 'active' ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => handleToggleActive(u)}
                            className="text-[11px] py-1 px-2.5"
                          >
                            {u.status === 'active' ? 'Disable' : 'Enable'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Staff Account"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Username (Login ID)"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            placeholder="e.g. cashier1"
            required
            autoFocus
          />

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Muhammad Usman"
            required
          />

          <Input
            label="Email Address (Optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@business.com"
          />

          <div>
            <label className="block text-xs font-medium text-[#353536] mb-1">Role & Permission Tier</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="cashier">Point of Sale Cashier (Billing & Receipts Only)</option>
              <option value="manager">Store Manager (Inventory, Purchases & Sales Operations)</option>
              <option value="admin">Administrator (Complete System & Financial Authority)</option>
            </select>
          </div>

          <Input
            label="Initial Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
            <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              <UserPlus size={15} />
              {submitting ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
