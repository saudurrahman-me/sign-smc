import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { OFFICIAL_SETTINGS } from '../../data/fallback-content';
import { evaluateMembershipIntake } from '../../lib/membership-schedule';
import type { SiteSettings } from '../../types/database.types';
import {
  Calendar,
  Users,
  FileCheck,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Database,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Sliders,
  CalendarDays,
  Save,
  Loader2,
  X,
  ExternalLink,
  Award,
} from 'lucide-react';
import { APP_VERSION } from '../../config/version';

export const AdminOverviewPage: React.FC = () => {
  const { user, profile, isSuperAdmin, isWebsiteAdmin, isEventManager } = useAuth();

  const [stats, setStats] = useState({
    eventsCount: 0,
    publishedEvents: 0,
    leadershipCount: 0,
    publishedLeadership: 0,
    pendingApps: 0,
    totalApps: 0,
    certificatesCount: 0,
    pendingCertificates: 0,
    usersCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Academic Semester Intake & Schedule State
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(OFFICIAL_SETTINGS);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState<boolean>(true);
  const [scheduleTermName, setScheduleTermName] = useState<string>('');
  const [scheduleStartDate, setScheduleStartDate] = useState<string>('');
  const [scheduleEndDate, setScheduleEndDate] = useState<string>('');
  const [scheduleClosedMessage, setScheduleClosedMessage] = useState<string>('');
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);
  const [scheduleErrorMsg, setScheduleErrorMsg] = useState<string | null>(null);

  // Load site settings (with localStorage & sessionStorage cache fallback)
  const loadSettings = useCallback(async () => {
    try {
      const cached =
        localStorage.getItem('sign_site_settings') ||
        sessionStorage.getItem('sign_site_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) setSiteSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }

    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (!error && data) {
        setSiteSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('[SIGN Admin Overview] Notice loading site settings:', err);
    }
  }, []);

  useEffect(() => {
    loadSettings();

    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<SiteSettings>;
      if (customEvent.detail) {
        setSiteSettings((prev) => ({ ...prev, ...customEvent.detail }));
      } else {
        loadSettings();
      }
    };

    window.addEventListener('sign_settings_updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('sign_settings_updated', handleSettingsUpdated);
    };
  }, [loadSettings]);

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
          certificatesCount: 2,
          pendingCertificates: 1,
          usersCount: 4,
        });
        setIsLoading(false);
        return;
      }

      try {
        // Fetch events count (Event Manager, Website Admin & Super Admin)
        if (isEventManager || isSuperAdmin || isWebsiteAdmin) {
          const { data: evData } = await supabase.from('events').select('id, is_published');
          if (evData && isMounted) {
            setStats((prev) => ({
              ...prev,
              eventsCount: evData.length,
              publishedEvents: evData.filter((e) => e.is_published).length,
            }));
          }
        }

        // Fetch leadership count (Website Admin & Super Admin)
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

        // Fetch applications (Website Admin & Super Admin)
        if (isSuperAdmin || isWebsiteAdmin) {
          const { data: appData } = await supabase.from('membership_applications').select('id, status');
          if (appData && isMounted && appData.length > 0) {
            setStats((prev) => ({
              ...prev,
              totalApps: appData.length,
              pendingApps: appData.filter((a) => a.status === 'pending').length,
            }));
          } else if (user?.id?.startsWith('dev-') && isMounted) {
            setStats((prev) => ({
              ...prev,
              totalApps: 2,
              pendingApps: 1,
            }));
          }
        }

        // Fetch certificates (Event Manager, Website Admin & Super Admin)
        if (isEventManager || isSuperAdmin || isWebsiteAdmin) {
          const { data: certData } = await supabase.from('event_certificates').select('id, status');
          if (certData && isMounted && certData.length > 0) {
            setStats((prev) => ({
              ...prev,
              certificatesCount: certData.length,
              pendingCertificates: certData.filter((c) => c.status === 'pending').length,
            }));
          } else {
            // Check local storage fallback (ignore mock demo items)
            try {
              const local = localStorage.getItem('sign_user_certificates');
              if (local && isMounted) {
                const parsed: any[] = JSON.parse(local);
                const realOnly = parsed.filter((c) => !c.id?.startsWith('demo-'));
                setStats((prev) => ({
                  ...prev,
                  certificatesCount: realOnly.length,
                  pendingCertificates: realOnly.filter((c: any) => c.status === 'pending').length,
                }));
              }
            } catch {
              // ignore
            }
          }
        }

        // Fetch users (Super Admin strictly)
        if (isSuperAdmin) {
          const { data: userData } = await supabase.from('profiles').select('id');
          if (userData && isMounted && userData.length > 0) {
            setStats((prev) => ({
              ...prev,
              usersCount: userData.length,
            }));
          } else if (user?.id?.startsWith('dev-') && isMounted) {
            setStats((prev) => ({
              ...prev,
              usersCount: 4,
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
  }, [isSuperAdmin, isWebsiteAdmin, isEventManager, user?.id]);

  const openScheduleModal = () => {
    setScheduleOpen(siteSettings.membership_open ?? true);
    setScheduleTermName(siteSettings.membership_term_name || 'Fall 2026 Semester Intake');
    setScheduleStartDate(siteSettings.membership_start_date || '');
    setScheduleEndDate(siteSettings.membership_end_date || '');
    setScheduleClosedMessage(
      siteSettings.membership_closed_message ||
        'Membership applications for the current academic session are currently closed. The next cohort enrollment will open at the start of the upcoming semester.'
    );
    setScheduleSuccessMsg(null);
    setScheduleErrorMsg(null);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSchedule(true);
    setScheduleErrorMsg(null);
    setScheduleSuccessMsg(null);

    const updatedSettings: SiteSettings = {
      ...siteSettings,
      membership_open: scheduleOpen,
      membership_term_name: scheduleTermName.trim() || 'Academic Semester Intake',
      membership_start_date: scheduleStartDate || null,
      membership_end_date: scheduleEndDate || null,
      membership_closed_message:
        scheduleClosedMessage.trim() ||
        'Membership applications for the current academic session are currently closed. The next cohort enrollment will open at the start of the upcoming semester.',
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Immediate local persistence for dev & real-time UI synchronization
      try {
        localStorage.setItem('sign_site_settings', JSON.stringify(updatedSettings));
        sessionStorage.setItem('sign_site_settings', JSON.stringify(updatedSettings));
      } catch {
        // ignore
      }
      setSiteSettings(updatedSettings);

      // Notify other components in the session
      window.dispatchEvent(
        new CustomEvent('sign_settings_updated', { detail: updatedSettings })
      );

      // 2. Persist to Supabase if connected
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            membership_open: updatedSettings.membership_open,
            membership_term_name: updatedSettings.membership_term_name,
            membership_start_date: updatedSettings.membership_start_date,
            membership_end_date: updatedSettings.membership_end_date,
            membership_closed_message: updatedSettings.membership_closed_message,
            updated_at: updatedSettings.updated_at,
          })
          .eq('id', 1);

        // Safe fallback if new columns are not yet added to remote database schema
        if (error && (error.message?.includes('column') || (error as { code?: string }).code === '42703')) {
          const { error: fallbackErr } = await supabase
            .from('site_settings')
            .update({
              membership_open: updatedSettings.membership_open,
              updated_at: updatedSettings.updated_at,
            })
            .eq('id', 1);

          if (fallbackErr) {
            console.warn('[SIGN Admin Overview] Fallback update failed:', fallbackErr.message);
          }
        }
      }

      setScheduleSuccessMsg('Academic semester schedule updated successfully!');
      setTimeout(() => {
        setIsScheduleModalOpen(false);
        setScheduleSuccessMsg(null);
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save schedule settings.';
      setScheduleErrorMsg(msg);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const intakeEvaluation = evaluateMembershipIntake(siteSettings);

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

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Platform:</span>
            <span className="font-bold text-emerald-300 font-mono">{APP_VERSION}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs shadow-sm">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">Database:</span>
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
          {/* Events KPI (Event Manager, Website Admin & Super Admin) */}
          {(isEventManager || isSuperAdmin || isWebsiteAdmin) && (
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

          {/* Certificates KPI (Event Manager, Website Admin & Super Admin) */}
          {(isEventManager || isSuperAdmin || isWebsiteAdmin) && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">Event Certificates</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white">{stats.certificatesCount}</div>
              <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{stats.pendingCertificates} pending review</span>
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

          {/* Applications KPI (Website Admin & Super Admin) */}
          {(isSuperAdmin || isWebsiteAdmin) && (
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

      {/* Academic Semester & Intake Schedule Management Widget (Website Admin & Super Admin) */}
      {(isWebsiteAdmin || isSuperAdmin) && (
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-800/40 relative overflow-hidden shadow-xl shadow-cyan-950/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      Academic Intake & Semester Schedule
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                        intakeEvaluation.isOpen
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          intakeEvaluation.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                      {intakeEvaluation.badgeText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Controls public application intake windows, semester cohort dates, and student notices.
                  </p>
                </div>
              </div>

              {/* Summary Metadata Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Current Semester Cohort
                  </span>
                  <span className="text-white font-medium truncate block">
                    {siteSettings.membership_term_name || 'Fall 2026 Semester Intake'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Enrollment Window
                  </span>
                  <span className="text-slate-200 font-medium block">
                    {siteSettings.membership_start_date
                      ? new Date(siteSettings.membership_start_date).toLocaleDateString()
                      : 'Immediate Start'}{' '}
                    &rarr;{' '}
                    {siteSettings.membership_end_date
                      ? new Date(siteSettings.membership_end_date).toLocaleDateString()
                      : 'Open Ended'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Intake Master Status
                  </span>
                  <span
                    className={`font-semibold block ${
                      siteSettings.membership_open ?? true ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {siteSettings.membership_open ?? true ? 'Applications Enabled' : 'Applications Paused'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Button to Open Adjust Schedule Modal */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={openScheduleModal}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 transition-all shadow-lg shadow-cyan-950/40 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-slate-950" />
                <span>Adjust Semester Schedule</span>
              </button>

              <Link
                to="/admin/applications"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/60 transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Review Applications ({stats.pendingApps} pending)</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-bold text-white mb-4">Quick Role Workflows</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(isEventManager || isSuperAdmin || isWebsiteAdmin) && (
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

          {(isWebsiteAdmin || isSuperAdmin) && (
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

          {(isEventManager || isSuperAdmin || isWebsiteAdmin) && (
            <Link
              to="/admin/certificates"
              className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 transition-all group flex items-start justify-between"
            >
              <div>
                <Award className="w-5 h-5 text-amber-400 mb-2" />
                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Verify & Issue Certificates
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Review student requests, upload PDFs, verify attendance & send email confirmation.
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </Link>
          )}
        </div>
      </div>

      {/* Adjust Semester Schedule & Intake Control Modal */}
      {isScheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isSavingSchedule && setIsScheduleModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Academic Intake & Semester Schedule
                  </h2>
                  <p className="text-xs text-slate-400">
                    Control membership window timing, semester cohort, and enrollment notices.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isSavingSchedule}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close schedule modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Evaluation Preview Banner */}
            {(() => {
              const previewEval = evaluateMembershipIntake({
                ...siteSettings,
                membership_open: scheduleOpen,
                membership_term_name: scheduleTermName,
                membership_start_date: scheduleStartDate,
                membership_end_date: scheduleEndDate,
                membership_closed_message: scheduleClosedMessage,
              });

              return (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                    previewEval.isOpen
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        previewEval.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <div>
                      <span className="font-bold block">{previewEval.badgeText}</span>
                      <span className="text-[11px] opacity-80">{previewEval.headline}</span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/30 border border-white/10 shrink-0">
                    Live Status Preview
                  </span>
                </div>
              );
            })()}

            {/* Form */}
            <form onSubmit={handleSaveSchedule} className="space-y-4">
              {/* Master Intake Toggle */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold text-white block">
                    Membership Intake Status
                  </span>
                  <span className="text-xs text-slate-400">
                    Toggle whether the chapter is currently accepting new applicant submissions.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setScheduleOpen(!scheduleOpen)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    scheduleOpen ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      scheduleOpen ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Academic Term Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Academic Semester / Cohort Name <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={scheduleTermName}
                  onChange={(e) => setScheduleTermName(e.target.value)}
                  placeholder="e.g. Fall 2026 Semester Intake or Spring 2027 Cohort"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Intake Window Start Date
                  </label>
                  <input
                    type="date"
                    value={scheduleStartDate}
                    onChange={(e) => setScheduleStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Optional start of semester enrollment
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Official Application Deadline
                  </label>
                  <input
                    type="date"
                    value={scheduleEndDate}
                    onChange={(e) => setScheduleEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Intake auto-closes at 23:59 on this date
                  </span>
                </div>
              </div>

              {/* Closed Notice Message */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Institutional Notice for Closed Period
                </label>
                <textarea
                  rows={3}
                  value={scheduleClosedMessage}
                  onChange={(e) => setScheduleClosedMessage(e.target.value)}
                  placeholder="Explanation shown to students when applications are closed..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-cyan-500"
                />
              </div>

              {/* Success / Error Feedback */}
              {scheduleSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{scheduleSuccessMsg}</span>
                </div>
              )}

              {scheduleErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{scheduleErrorMsg}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <Link
                  to="/admin/settings?tab=settings"
                  className="text-xs text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors order-2 sm:order-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Full Content & Settings Page
                </Link>

                <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    disabled={isSavingSchedule}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSchedule}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 transition-all shadow-md shadow-cyan-950/40 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingSchedule ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving Schedule...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save Schedule
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

