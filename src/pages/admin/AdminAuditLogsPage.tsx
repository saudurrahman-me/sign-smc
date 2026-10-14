import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { AuditLog } from '../../types/database.types';
import { History, Search } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const DEMO_LOGS: AuditLog[] = [
    {
      id: 'demo-log-1',
      actor_id: 'dev-super_admin-id',
      actor_email: 'super_admin.sign@smc.edu.pk',
      action: 'user_role_updated',
      resource_type: 'profiles',
      resource_id: 'dev-website_admin-id',
      details: {
        target_user_email: 'website_admin.sign@smc.edu.pk',
        previous_role: 'member',
        assigned_role: 'website_admin',
      },
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'demo-log-2',
      actor_id: 'dev-super_admin-id',
      actor_email: 'super_admin.sign@smc.edu.pk',
      action: 'membership_application_approved',
      resource_type: 'membership_applications',
      resource_id: 'demo-app-2',
      details: {
        applicant_email: 'mahnoor.smc@student.edu.pk',
        previous_status: 'pending',
        new_status: 'approved',
      },
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'demo-log-3',
      actor_id: 'dev-event_manager-id',
      actor_email: 'event_manager.sign@smc.edu.pk',
      action: 'event_published',
      resource_type: 'events',
      resource_id: 'demo-evt-1',
      details: {
        title: 'Clinical Neuroscience Symposium 2026',
        venue: 'Saidu Medical College Main Auditorium',
      },
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ];

  const fetchLogs = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      setLogs(DEMO_LOGS);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[SIGN Audit Logs] Error:', error.message);
      } else if (data) {
        setLogs(data as AuditLog[]);
      }
    } catch (err) {
      console.error('[SIGN Audit Logs] Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.actor_email && l.actor_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      l.resource_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 block mb-1">
            Super Administrator Security Trail
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Security & Administrative Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable log tracking role promotions, membership decisions, and sensitive operational changes.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
        >
          Refresh Feed
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, actor, or resource..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-purple-500"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Showing last {filtered.length} audit records
        </span>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading audit events...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Action Taken</th>
                  <th className="py-3.5 px-4">Resource Target</th>
                  <th className="py-3.5 px-4">Metadata Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-200">
                      {log.actor_email || log.actor_id || 'System'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-purple-950/80 text-purple-300 border border-purple-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-300">
                      {log.resource_type}
                      {log.resource_id && (
                        <span className="text-[10px] text-slate-500 font-mono block">
                          ID: {log.resource_id.slice(0, 12)}...
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs font-mono text-[10px] text-slate-400 truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Audit Records Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Privileged administrative actions (role promotions, decision approvals) will automatically appear here.
          </p>
        </div>
      )}
    </div>
  );
};
