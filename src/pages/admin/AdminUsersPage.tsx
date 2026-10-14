import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Profile, UserRole } from '../../types/database.types';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  User,
  Lock,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    targetUser: Profile;
    newRole: UserRole;
  } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const DEMO_USERS: Profile[] = [
    {
      id: 'dev-super_admin-id',
      full_name: 'Dr. Fawad Ali (Chairman)',
      email: 'fawad.sgth@gmail.com',
      role: 'super_admin',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'dev-website_admin-id',
      full_name: 'Adil Khan (Founding President)',
      email: 'adilmusawir@gmail.com',
      role: 'website_admin',
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'dev-event_manager-id',
      full_name: 'Saleem Jan (General Secretary)',
      email: 'sj3463586@gmail.com',
      role: 'event_manager',
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'dev-media_head-id',
      full_name: 'Irshad Ahmad (Media & Communication Head)',
      email: 'irshadahmad.access@gmail.com',
      role: 'member',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'dev-applicant-id',
      full_name: 'Zaryab Khan (3rd Year MBBS)',
      email: 'zaryab.smc@student.edu.pk',
      role: 'applicant',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const isDevSession = !isSupabaseConfigured || Boolean(currentUser?.id?.startsWith('dev-'));

  const fetchUsers = async () => {
    setIsLoading(true);
    if (isDevSession) {
      try {
        const stored = sessionStorage.getItem('sign_persisted_profiles');
        if (stored) {
          setProfiles(JSON.parse(stored));
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error('[SIGN Admin Users] Failed to load local profiles:', e);
      }
      setProfiles(DEMO_USERS);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[SIGN Admin Users] Error:', error.message);
        // Fallback to local if remote error
        setProfiles(DEMO_USERS);
      } else if (data) {
        setProfiles(data as Profile[]);
      }
    } catch (err) {
      console.error('[SIGN Admin Users] Unexpected error:', err);
      setProfiles(DEMO_USERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const requestRoleChange = (targetUser: Profile, newRole: UserRole) => {
    if (targetUser.role === newRole) return;

    // Safety Guard: Check if demoting the only super admin
    if (targetUser.role === 'super_admin' && newRole !== 'super_admin') {
      const superAdmins = profiles.filter((p) => p.role === 'super_admin');
      if (superAdmins.length <= 1) {
        setFeedbackMessage({
          type: 'error',
          text: 'Safety Guard Active: Cannot demote the last remaining Super Admin. Platform must retain at least one Super Admin.',
        });
        return;
      }
    }

    setConfirmModal({ targetUser, newRole });
  };

  const executeRoleChange = async () => {
    if (!confirmModal) return;
    const { targetUser, newRole } = confirmModal;
    setConfirmModal(null);
    setIsUpdating(targetUser.id);
    setFeedbackMessage(null);

    try {
      const updatedList = profiles.map((p) =>
        p.id === targetUser.id ? { ...p, role: newRole, updated_at: new Date().toISOString() } : p
      );

      if (isDevSession) {
        setProfiles(updatedList);
        try {
          sessionStorage.setItem('sign_persisted_profiles', JSON.stringify(updatedList));
        } catch {
          // ignore
        }
        setFeedbackMessage({
          type: 'success',
          text: `Role for ${targetUser.full_name || targetUser.email} updated to "${newRole}".`,
        });
        setIsUpdating(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', targetUser.id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error(
          'Privilege Escalation Blocked: The database rejected this change. Only confirmed Super Administrators can alter user roles in the database.'
        );
      }

      // Record audit log safely (non-blocking)
      if (currentUser) {
        try {
          await supabase.from('audit_logs').insert({
            actor_id: currentUser.id,
            actor_email: currentUser.email,
            action: 'user_role_updated',
            resource_type: 'profiles',
            resource_id: targetUser.id,
            details: {
              target_user_email: targetUser.email,
              previous_role: targetUser.role,
              assigned_role: newRole,
            },
          });
        } catch (auditErr) {
          console.warn('[SIGN Admin Users] Note: Audit log could not be saved:', auditErr);
        }
      }

      setProfiles(updatedList);
      setFeedbackMessage({
        type: 'success',
        text: `Role for ${targetUser.full_name || targetUser.email} successfully updated to "${newRole}".`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating user role';
      setFeedbackMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const filtered = profiles.filter(
    (p) =>
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.full_name && p.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 block mb-1">
            Super Administrator Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            User Roles & Privilege Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Delegate Website Admin and Event Manager authority. Enforce least-privilege access.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Privilege escalation strictly blocked at database level</span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/80 border-rose-800 text-rose-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          {profiles.length} total registered accounts
        </span>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading user profiles...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">User Identity</th>
                  <th className="py-3.5 px-4">Current Role</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Assign Elevated Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filtered.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                            {u.full_name ? u.full_name[0].toUpperCase() : u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{u.full_name || 'Name not provided'}</span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400 text-[11px]">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            u.role === 'super_admin'
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : u.role === 'website_admin'
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                              : u.role === 'event_manager'
                              ? 'bg-teal-950 text-teal-300 border-teal-800'
                              : u.role === 'member'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          }`}
                        >
                          {u.role === 'applicant' ? 'Applicant (Pending)' : u.role.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <select
                          value={u.role}
                          disabled={isUpdating === u.id}
                          onChange={(e) => requestRoleChange(u, e.target.value as UserRole)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                        >
                          <option value="applicant">Applicant (Pending)</option>
                          <option value="member">Member (Approved)</option>
                          <option value="event_manager">Event Manager</option>
                          <option value="website_admin">Website Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <User className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Users Found</h3>
          <p className="text-xs text-slate-400 mt-1">No profiles match your search query.</p>
        </div>
      )}

      {/* Explicit Role Confirmation Dialog */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Role Assignment</h3>
                <p className="text-xs text-slate-400">Authorized Super Administrator Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to alter the platform role for{' '}
              <strong className="text-white">
                {confirmModal.targetUser.full_name || confirmModal.targetUser.email}
              </strong>{' '}
              from <span className="font-mono text-purple-300">{confirmModal.targetUser.role}</span> to{' '}
              <span className="font-mono text-emerald-300 uppercase font-bold">"{confirmModal.newRole}"</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRoleChange}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-950/40 transition-all"
              >
                Confirm & Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
