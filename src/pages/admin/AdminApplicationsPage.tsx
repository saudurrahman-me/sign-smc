import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { MembershipApplication, ApplicationStatus } from '../../types/database.types';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Eye,
} from 'lucide-react';

export const AdminApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | ApplicationStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for review modal
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);

  const DEMO_APPLICATIONS: MembershipApplication[] = [
    {
      id: 'demo-app-1',
      user_id: 'user-app-1',
      full_name: 'Zaryab Khan',
      email: 'zaryab.smc@student.edu.pk',
      phone: '+92 300 1234567',
      mbbs_year: '3rd Year MBBS',
      student_id: 'SMC-2023-089',
      motivation: 'Passionate about clinical neurology, stroke ward clerkships, and student-led neuroscience awareness campaigns.',
      research_interests: 'Acute ischemic stroke, neuro-epidemiology in Malakand division',
      agreed_to_terms: true,
      status: 'pending',
      reviewer_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'demo-app-2',
      user_id: 'user-app-2',
      full_name: 'Mahnoor Bibi',
      email: 'mahnoor.smc@student.edu.pk',
      phone: '+92 301 9876543',
      mbbs_year: '4th Year MBBS',
      student_id: 'SMC-2022-045',
      motivation: 'Eager to contribute to neurological case reporting, academic research, and community health outreaches in Swat.',
      research_interests: 'Epilepsy genetics, pediatric neurological disorders',
      agreed_to_terms: true,
      status: 'approved',
      reviewer_notes: 'Academic standing verified by Faculty Board. Welcome to SIGN.',
      reviewed_by: 'dev-admin-id',
      reviewed_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const fetchApplications = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      setApplications(DEMO_APPLICATIONS);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('membership_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[SIGN Admin Applications] Error:', error.message);
      } else if (data) {
        setApplications(data as MembershipApplication[]);
      }
    } catch (err) {
      console.error('[SIGN Admin Applications] Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openReviewModal = (app: MembershipApplication) => {
    setSelectedApp(app);
    setReviewerNotes(app.reviewer_notes || '');
  };

  const handleDecision = async (newStatus: 'approved' | 'rejected') => {
    if (!selectedApp || !user) return;
    setIsDeciding(true);

    try {
      const timestamp = new Date().toISOString();

      if (!isSupabaseConfigured) {
        setApplications(
          applications.map((a) =>
            a.id === selectedApp.id
              ? {
                  ...a,
                  status: newStatus,
                  reviewer_notes: reviewerNotes.trim() || null,
                  reviewed_by: user.id,
                  reviewed_at: timestamp,
                }
              : a
          )
        );
        setSelectedApp(null);
        setIsDeciding(false);
        return;
      }

      const { error } = await supabase
        .from('membership_applications')
        .update({
          status: newStatus,
          reviewer_notes: reviewerNotes.trim() || null,
          reviewed_by: user.id,
          reviewed_at: timestamp,
          updated_at: timestamp,
        })
        .eq('id', selectedApp.id);

      if (error) throw error;

      // Also record audit log entry
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: `membership_application_${newStatus}`,
        resource_type: 'membership_applications',
        resource_id: selectedApp.id,
        details: {
          applicant_email: selectedApp.email,
          previous_status: selectedApp.status,
          new_status: newStatus,
          notes: reviewerNotes.trim(),
        },
      });

      // Update state locally
      setApplications(
        applications.map((a) =>
          a.id === selectedApp.id
            ? {
                ...a,
                status: newStatus,
                reviewer_notes: reviewerNotes.trim() || null,
                reviewed_by: user.id,
                reviewed_at: timestamp,
              }
            : a
        )
      );

      setSelectedApp(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating decision';
      alert(msg);
    } finally {
      setIsDeciding(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Declined
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
            <Clock className="w-3 h-3 text-amber-400" />
            Pending Review
          </span>
        );
    }
  };

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.student_id && app.student_id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 block mb-1">
            Super Administrator Restricted
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Membership Applications Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Evaluate prospective MBBS student applicants, inspect credentials, and record committee decisions.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
          <FileCheck className="w-4 h-4 text-purple-400" />
          <span>{applications.filter((a) => a.status === 'pending').length} Pending Review</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or student ID..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {(['All', 'pending', 'approved', 'rejected', 'withdrawn'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading student applications...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Class Stage</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-bold text-white text-sm">{app.full_name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{app.email}</div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-200">{app.mbbs_year}</span>
                      {app.student_id && (
                        <span className="text-[10px] text-slate-500 block">ID: {app.student_id}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-400">
                      <div>{app.phone}</div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-400">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {statusBadge(app.status)}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openReviewModal(app)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect & Decide
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <FileCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Applications Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No applicant records match your current filter criteria.
          </p>
        </div>
      )}

      {/* Review & Decision Inspection Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Application Dossier
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedApp.full_name}</h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">Email & Phone</span>
                  <span className="text-slate-200 font-medium">{selectedApp.email}</span>
                  <span className="text-slate-400 block mt-0.5">{selectedApp.phone}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">Class & Registration</span>
                  <span className="text-slate-200 font-medium">{selectedApp.mbbs_year}</span>
                  <span className="text-slate-400 block mt-0.5">
                    {selectedApp.student_id ? `Reg ID: ${selectedApp.student_id}` : 'None provided'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-1">
                  Statement of Interest & Motivation
                </span>
                <p className="text-slate-200 leading-relaxed italic mt-1">
                  "{selectedApp.motivation}"
                </p>
              </div>

              {selectedApp.research_interests && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">
                    Research Topics of Interest
                  </span>
                  <p className="text-slate-200 leading-relaxed">
                    {selectedApp.research_interests}
                  </p>
                </div>
              )}

              {/* Reviewer Notes Field */}
              <div className="pt-2">
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Committee Review Notes / Feedback to Applicant
                </label>
                <textarea
                  rows={3}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Provide internal feedback or formal reason for committee decision..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-purple-500"
                />
              </div>

              {/* Decision Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Current Status:</span>
                  {statusBadge(selectedApp.status)}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDecision('rejected')}
                    disabled={isDeciding}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleDecision('approved')}
                    disabled={isDeciding}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-md disabled:opacity-50"
                  >
                    Approve for Membership
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
