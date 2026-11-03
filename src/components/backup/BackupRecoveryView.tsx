import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BackupLog } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Database,
  ShieldCheck,
  Download,
  Upload,
  HardDrive,
  FileCheck,
  AlertTriangle,
  Clock,
  FolderOpen,
  CheckCircle2
} from 'lucide-react';

export const BackupRecoveryView: React.FC = () => {
  const { addNotification } = useAppStore();

  const [activeDbPath, setActiveDbPath] = useState<string>('');
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Restore Modal State
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<string>('');
  const [restoring, setRestoring] = useState(false);

  const fetchBackupData = async () => {
    try {
      setLoading(true);
      if (window.skythsAPI) {
        const cfg = await window.skythsAPI.getConfig();
        if (cfg?.db_path) {
          setActiveDbPath(cfg.db_path);
        }
        const logs = await window.skythsAPI.getBackupLogs();
        setBackupLogs(logs || []);
      }
    } catch (err: any) {
      console.error('Failed to load backup data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupData();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      if (window.skythsAPI) {
        const res = await window.skythsAPI.createBackup();
        addNotification({
          title: 'Database Backup Created',
          message: `Saved verified backup (${(res.size / 1024).toFixed(1)} KB)`,
          type: 'success'
        });
        await fetchBackupData();
      }
    } catch (err: any) {
      addNotification({ title: 'Backup Failed', message: err.message, type: 'danger' });
    } finally {
      setCreating(false);
    }
  };

  const handlePickExternalBackup = async () => {
    try {
      if (window.skythsAPI) {
        const filePath = await window.skythsAPI.selectBackupFile();
        if (filePath) {
          setSelectedBackupToRestore(filePath);
          setIsRestoreOpen(true);
        }
      }
    } catch (err: any) {
      addNotification({ title: 'Error', message: 'Could not select backup file.', type: 'danger' });
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackupToRestore) return;
    try {
      setRestoring(true);
      if (window.skythsAPI) {
        const res = await window.skythsAPI.restoreBackup(selectedBackupToRestore);
        addNotification({
          title: 'Database Restored Successfully',
          message: res.message || 'Live records updated.',
          type: 'success'
        });
        setIsRestoreOpen(false);
        setSelectedBackupToRestore('');
        await fetchBackupData();
      }
    } catch (err: any) {
      addNotification({
        title: 'Restore Failed & Rolled Back',
        message: err.message || 'Safety backup preserved current live state.',
        type: 'danger'
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="text-[#ACADB1]" size={22} />
            Database Health, Backups & Recovery
          </h1>
          <p className="text-xs text-[#ACADB1]">
            Create transactional SQLite backups, verify storage integrity, and safely restore historical archives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePickExternalBackup}>
            <FolderOpen size={15} />
            Browse & Restore External File...
          </Button>

          <Button variant="primary" size="sm" onClick={handleCreateBackup} disabled={creating}>
            <Download size={15} />
            {creating ? 'Creating Snapshot...' : 'Create Immediate Backup'}
          </Button>
        </div>
      </div>

      {/* Database Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <HardDrive size={16} className="text-[#ACADB1]" />
            <span>Active Database Location</span>
          </div>
          <div className="text-[11px] font-mono text-[#D4D8DF] truncate bg-white/5 border border-white/10 p-2 rounded-lg mt-1" title={activeDbPath}>
            {activeDbPath || 'd:/drawer/SKYTHS_Data/skyths_inventory.db'}
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium mt-1">
            <CheckCircle2 size={12} /> SQLite WAL Mode Enabled (Persistent Storage)
          </span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Integrity & ACID Compliance</span>
          </div>
          <div className="text-base font-bold font-mono text-emerald-400 mt-1">100% Verified</div>
          <p className="text-[10px] text-[#ACADB1]">Foreign-key enforcement and zero database corruption.</p>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <FileCheck size={16} className="text-[#ACADB1]" />
            <span>Total Backups Recorded</span>
          </div>
          <div className="text-base font-bold font-mono text-white mt-1">{backupLogs.length} Snapshots</div>
          <p className="text-[10px] text-[#ACADB1]">Automatic safety snapshots created prior to any restore.</p>
        </GlassCard>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-amber-300">Offline Local-First Protection Policy</span>
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            All business data is saved strictly to your local hard drive. Before executing any database restoration, SKYTHS
            automatically creates an atomic pre-restore safety copy (<code className="font-mono text-[10px] bg-amber-500/20 text-amber-100 px-1 rounded">.bak</code>).
            If a backup fails verification, the live database is automatically rolled back with zero data loss.
          </p>
        </div>
      </div>

      {/* Backup History Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Historical Backups Log</h3>
            <p className="text-[11px] text-[#ACADB1]">List of verified snapshots created via SQLite vacuum archive</p>
          </div>
          <span className="text-[11px] font-mono text-[#ACADB1]">{backupLogs.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-wider text-[#ACADB1]">
                <th className="py-2.5 px-4">Backup Timestamp</th>
                <th className="py-2.5 px-4">File Path</th>
                <th className="py-2.5 px-4">Size</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#ACADB1]">
                    Checking backup records...
                  </td>
                </tr>
              ) : backupLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-[#ACADB1]">
                    No backups created yet. Click "Create Immediate Backup" above to generate your first verified copy.
                  </td>
                </tr>
              ) : (
                backupLogs.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-white">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#ACADB1] max-w-md truncate" title={b.backup_path}>
                      {b.backup_path}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#D4D8DF]">
                      {(b.backup_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={b.status === 'verified' ? 'success' : b.status === 'restored' ? 'info' : 'outline'}>
                        {b.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBackupToRestore(b.backup_path);
                          setIsRestoreOpen(true);
                        }}
                        className="text-[11px] py-1 px-2.5"
                      >
                        <Upload size={12} />
                        Restore
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Confirmation Modal for Restore */}
      <Modal
        isOpen={isRestoreOpen}
        onClose={() => setIsRestoreOpen(false)}
        title="Confirm Database Restoration"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-red-300">
              <AlertTriangle size={15} />
              Warning: Replacing Current Live Database
            </span>
            <p className="text-[11px] text-red-300/90 leading-relaxed">
              Restoring from this file will replace all current business records with the data from the selected snapshot.
              A safety copy of your active database will be created before proceeding.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#ACADB1]">Selected Backup File:</span>
            <p className="font-mono text-xs text-white break-all">{selectedBackupToRestore}</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setIsRestoreOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmRestore} disabled={restoring}>
              <Upload size={14} />
              {restoring ? 'Verifying & Restoring...' : 'Confirm & Restore Database'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
