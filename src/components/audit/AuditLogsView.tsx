import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AuditLog } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  ScrollText,
  Search,
  Filter,
  User,
  Clock,
  Shield,
  FileCode,
  RefreshCw,
  X
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { addNotification } = useAppStore();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      if (window.skythsAPI) {
        const data = await window.skythsAPI.getAuditLogs({ limit: 100 });
        setLogs(data || []);
      }
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      addNotification({ title: 'Error', message: 'Failed to load audit trail.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      (l.username && l.username.toLowerCase().includes(q)) ||
      (l.details_json && l.details_json.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#353536] to-[#080808] border border-white/20">
              <ScrollText className="text-white" size={20} />
            </div>
            Immutable Audit Trail & System Activity
          </h1>
          <p className="text-xs text-[#ACADB1] mt-0.5">
            Permanent, tamper-evident log of all logins, stock adjustments, financial transactions, and settings updates.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Log
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <GlassCard className="p-3 border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[#706F70]" size={15} />
          <input
            type="text"
            placeholder="Search audit trail by action (e.g. SALE_COMPLETED, STOCK_ADJUSTMENT), user, or entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-[#0E0E0F] text-white placeholder-[#706F70] focus:outline-none focus:border-white/30"
          />
        </div>
      </GlassCard>

      {/* Main Grid: Audit Table + Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={selectedLog ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <GlassCard className="overflow-hidden border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Security & Operation Ledger</span>
              <span className="text-[11px] font-mono text-[#ACADB1]">{filteredLogs.length} events logged</span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0E0E0F] text-[10px] font-mono uppercase tracking-wider text-[#ACADB1] sticky top-0">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">User</th>
                    <th className="py-2.5 px-4">Entity Type</th>
                    <th className="py-2.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#706F70]">
                        Querying audit database...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#706F70]">
                        No audit events match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isSelected = selectedLog?.id === log.id;
                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-white/10 font-medium' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#ACADB1] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-mono text-[11px] font-bold text-white">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="text-[11px] font-medium text-[#D4D8DF]">
                              @{log.username || 'system'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <Badge variant="outline">{log.entity_type}</Badge>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="text-[11px] text-[#D4D8DF] hover:text-white font-mono underline cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Inspection Panel */}
        {selectedLog && (
          <div className="lg:col-span-5">
            <GlassCard className="p-4 space-y-4 sticky top-4 border-white/15">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-[#D4D8DF]" />
                  <span className="font-bold text-xs text-white">Audit Event #{selectedLog.id}</span>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-xs text-[#ACADB1] hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-[#ACADB1]">Action Name:</span>
                  <span className="font-mono font-bold text-white">{selectedLog.action}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-[#ACADB1]">Executing User:</span>
                  <span className="font-medium text-white">@{selectedLog.username || 'system'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-[#ACADB1]">Entity Target:</span>
                  <span className="font-mono text-white">{selectedLog.entity_type} {selectedLog.entity_id ? `(#${selectedLog.entity_id})` : ''}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-[#ACADB1]">Exact Timestamp:</span>
                  <span className="font-mono text-white">{new Date(selectedLog.created_at).toISOString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <FileCode size={13} className="text-[#D4D8DF]" />
                  Payload Snapshot (JSON)
                </span>
                <pre className="p-3 rounded-xl bg-[#080808] border border-white/10 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-[300px] leading-relaxed">
                  {selectedLog.details_json
                    ? JSON.stringify(JSON.parse(selectedLog.details_json), null, 2)
                    : 'No additional details captured.'}
                </pre>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};
