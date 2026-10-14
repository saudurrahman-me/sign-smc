import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Calendar,
  Users,
  FileCheck,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Database,
  CheckCircle,
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const { user, profile, isSuperAdmin, isWebsiteAdmin, isEventManager } = useAuth();

  const [stats, setStats] = useState({
    eventsCount: 0,
    publishedEvents: 0,
    leadershipCount: 0,
    publishedLeadership: 0,
    pendingApps: 0,
    totalApps: 0,
    usersCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      if (!isSupabaseConfigured) {
        setStats({
          eventsCount: 2,
          publishedEvents: 2,
          leadershipCount: 7,
          publishedLeadership: 7,
          pendingApps: 1,
          totalApps: 2,
          usersCount: 4,
        });
        setIsLoading(false);
        return;
      }

      try {
        // Fetch events count
        if (isEventManager || isSuperAdmin) {
          const { data: evData } = await supabase.from('events').select('id, is_published');
          if (evData && isMounted) {
            setStats((prev) => ({
              ...prev,
              eventsCount: evData.length,
              publishedEvents: evData.filter((e) => e.is_published).length,
            }));
          }
        }

        // Fetch leadership count
        if (isWebsiteAdmin || isSuperAdmin) {
          const { data: leadData } = await supabase.from('leadership_profiles').select('id, is_published');
          if (leadData && isMounted) {
            setStats((prev) => ({
              ...prev,
              leadershipCount: leadData.length,
              publishedLeadership: leadData.filter((l) => l.is_published).length,
            }));
          }
        }

        // Fetch applications & users (Super Admin only per RLS)
        if (isSuperAdmin) {
          const { data: appData } = await supabase.from('membership_applications').select('id, status');
          if (appData && isMounted) {
            setStats((prev) => ({
              ...prev,
              totalApps: appData.length,
              pendingApps: appData.filter((a) => a.status === 'pending').length,
            }));
          }

          const { data: userData } = await supabase.from('profiles').select('id');
          if (userData && isMounted) {
            setStats((prev) => ({
              ...prev,
              usersCount: userData.length,
            }));
          }
        }
      } catch (err) {
        console.error('[SIGN Admin] Count fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCounts();
    return () => {
      isMounted = false;
    };
  }, [isSuperAdmin, isWebsiteAdmin, isEventManager]);

  return (
    <div className="p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 block mb-1">
            Administration Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome, {profile?.full_name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Chapter Operations & Content Administration • Saidu Medical College, Swat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">Database Status:</span>
            <span className={`font-semibold ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isSupabaseConfigured ? 'Connected' : 'Setup Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Role-Aware KPI Metrics Cards */}
      {isLoading ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Aggregating platform metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Events KPI (Event Manager & Super Admin) */}
        {(isEventManager || isSuperAdmin) && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Academic Events</span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{stats.eventsCount}</div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-teal-400" />
              <span>{stats.publishedEvents} published to public</span>
            </div>
          </div>
        )}

        {/* Leadership KPI (Website Admin & Super Admin) */}
        {(isWebsiteAdmin || isSuperAdmin) && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Leadership Profiles</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{stats.leadershipCount}</div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-cyan-400" />
              <span>{stats.publishedLeadership} active in directory</span>
            </div>
          </div>
        )}

        {/* Applications KPI (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Membership Inquiries</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{stats.totalApps}</div>
            <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{stats.pendingApps} pending committee review</span>
            </div>
          </div>
        )}

        {/* Users KPI (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Registered Users</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{stats.usersCount}</div>
            <div className="mt-2 text-[11px] text-slate-400">
              Managed via Row Level Security
            </div>
          </div>
        )}
      </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-bold text-white mb-4">Quick Role Workflows</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(isEventManager || isSuperAdmin) && (
            <Link
              to="/admin/events"
              className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/50 transition-all group flex items-start justify-between"
            >
              <div>
                <Calendar className="w-5 h-5 text-teal-400 mb-2" />
                <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                  Schedule or Edit Event
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Create seminars, case discussions, or publish drafts.
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
            </Link>
          )}

          {(isWebsiteAdmin || isSuperAdmin) && (
            <Link
              to="/admin/leadership"
              className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 transition-all group flex items-start justify-between"
            >
              <div>
                <Users className="w-5 h-5 text-cyan-400 mb-2" />
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Manage Leadership & Nominees
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Update candidate rosters, faculty mentors, and biographies.
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </Link>
          )}

          {isSuperAdmin && (
            <Link
              to="/admin/applications"
              className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 transition-all group flex items-start justify-between"
            >
              <div>
                <FileCheck className="w-5 h-5 text-purple-400 mb-2" />
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Review Membership Applications
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Inspect student applicants, record decisions and reviewer notes.
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
