import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { resolveStorageViewUrl } from '../../lib/storage-helpers';
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
  const [resolvedProofUrl, setResolvedProofUrl] = useState<string>('');
  const [isResolvingProof, setIsResolvingProof] = useState<boolean>(false);
  const [proofImageError, setProofImageError] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const DEMO_APPLICATIONS: MembershipApplication[] = [
    {
      id: 'demo-app-1',
      user_id: 'dev-applicant-id',
      full_name: 'Zaryab Khan',
      email: 'zaryab.smc@student.edu.pk',
      phone: '0312-9876543',
      mbbs_year: 'MBBS - 3rd Year',
      student_id: 'SMC-2023-089',
      college_name: 'Saidu Medical College',
      degree: 'MBBS',
      year_of_study: '3rd Year',
      expected_graduation_year: '2028',
      payment_proof_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
      previous_experience: 'Active member of SMC Academic Society. Organized college neurology trivia and stroke awareness camp.',
      motivation: 'Passionate about clinical neurology, stroke ward clerkships, and student-led neuroscience research.',
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
      phone: '0301-9876543',
      mbbs_year: 'MBBS - 4th Year',
      student_id: 'SMC-2022-045',
      college_name: 'Saidu Medical College',
      degree: 'MBBS',
      year_of_study: '4th Year',
      expected_graduation_year: '2027',
      payment_proof_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
      previous_experience: 'Volunteer at SGTH Clinical Research Unit, Swat.',
      motivation: 'Eager to contribute to neurological case reporting, academic research, and community health outreaches in Swat.',
      research_interests: 'Epilepsy genetics, pediatric neurological disorders',
      agreed_to_terms: true,
      status: 'approved',
      reviewer_notes: 'Academic standing verified by Faculty Board. Payment proof confirmed. Welcome to SIGN.',
      reviewed_by: 'dev-admin-id',
      reviewed_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const fetchApplications = async () => {
    setIsLoading(true);

    // Merge session storage demo application if present
    let localSubmissions: MembershipApplication[] = [];
    try {
      const stored = sessionStorage.getItem('sign_user_application');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          localSubmissions = [parsed as MembershipApplication];
        }
      }
    } catch {
      // ignore
    }

    if (!isSupabaseConfigured) {
      const merged = [
        ...localSubmissions,
        ...DEMO_APPLICATIONS.filter((d) => !localSubmissions.some((l) => l.id === d.id)),
      ];
      setApplications(merged);
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
        setApplications(DEMO_APPLICATIONS);
      } else if (data) {
        const merged = [
          ...localSubmissions.filter((l) => !data.some((d) => d.id === l.id || d.user_id === l.user_id)),
          ...(data as MembershipApplication[]),
        ];
        setApplications(merged);
      }
    } catch (err) {
      console.error('[SIGN Admin Applications] Unexpected error:', err);
      setApplications(DEMO_APPLICATIONS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openReviewModal = async (app: MembershipApplication) => {
    setSelectedApp(app);
    setReviewerNotes(app.reviewer_notes || '');
    setProofImageError(false);
    setIsLightboxOpen(false);

    if (app.payment_proof_url) {
      setIsResolvingProof(true);
      try {
        const url = await resolveStorageViewUrl(app.payment_proof_url);
        setResolvedProofUrl(url);
      } catch {
        setResolvedProofUrl(app.payment_proof_url);
      } finally {
        setIsResolvingProof(false);
      }
    } else {
      setResolvedProofUrl('');
      setIsResolvingProof(false);
    }
  };

  const handleRetryProofResolution = async () => {
    if (!selectedApp?.payment_proof_url) return;
    setIsResolvingProof(true);
    setProofImageError(false);
    try {
      const url = await resolveStorageViewUrl(selectedApp.payment_proof_url, 'applicant-documents', 7200);
      setResolvedProofUrl(url);
    } catch {
      // keep fallback
    } finally {
      setIsResolvingProof(false);
    }
  };

  const handleDecision = async (newStatus: 'approved' | 'rejected') => {
    if (!selectedApp || !user) return;
    setIsDeciding(true);

    try {
      const timestamp = new Date().toISOString();
      const isDevSession = !isSupabaseConfigured || user.id.startsWith('dev-');

      if (isDevSession) {
        // Update local list
        const updatedList = applications.map((a) =>
          a.id === selectedApp.id
            ? {
                ...a,
                status: newStatus,
                reviewer_notes: reviewerNotes.trim() || null,
                reviewed_by: user.id,
                reviewed_at: timestamp,
              }
            : a
        );
        setApplications(updatedList);

        // Update session storage application
        try {
          const stored = sessionStorage.getItem('sign_user_application');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.id === selectedApp.id) {
              sessionStorage.setItem(
                'sign_user_application',
                JSON.stringify({
                  ...parsed,
                  status: newStatus,
                  reviewer_notes: reviewerNotes.trim() || null,
                })
              );
            }
          }
        } catch {
          // ignore
        }

        // If approved in dev mode, also elevate the applicant's profile to member in persisted profiles
        if (newStatus === 'approved') {
          try {
            const storedProfiles = sessionStorage.getItem('sign_persisted_profiles');
            if (storedProfiles) {
              const parsedProfiles = JSON.parse(storedProfiles);
              const elevated = parsedProfiles.map((p: any) =>
                p.id === selectedApp.user_id ? { ...p, role: 'member' } : p
              );
              sessionStorage.setItem('sign_persisted_profiles', JSON.stringify(elevated));
            }
          } catch {
            // ignore
          }
        }

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

      // AUTOMATIC PRIVILEGE ELEVATION: When approved, upgrade profile role to 'member'
      if (newStatus === 'approved') {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: 'member', updated_at: timestamp })
            .eq('id', selectedApp.user_id);

          if (profileError) {
            console.warn('[SIGN Admin] Notice: Could not update profile role automatically:', profileError.message);
          }
        } catch (profileErr) {
          console.warn('[SIGN Admin] Profile role elevation notice:', profileErr);
        }
      }

      // Record audit log entry
      try {
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
            elevated_role: newStatus === 'approved' ? 'member' : undefined,
          },
        });
      } catch (auditErr) {
        console.warn('[SIGN Admin] Audit log notice:', auditErr);
      }

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
                  <th className="py-3.5 px-4">Institution & Stage</th>
                  <th className="py-3.5 px-4">Contact (WhatsApp)</th>
                  <th className="py-3.5 px-4">Fee Proof</th>
                  <th className="py-3.5 px-4">Submitted</th>
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
                      <span className="font-medium text-slate-200">
                        {app.degree || 'MBBS'} • {app.year_of_study || app.mbbs_year}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {app.college_name || 'Saidu Medical College'}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-400">
                      <div>{app.phone}</div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {app.payment_proof_url ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Rs. 300 Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                          Unverified
                        </span>
                      )}
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Dossier
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
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                  Official Membership Application Dossier
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
                  <span className="text-slate-400 block font-semibold mb-1">Email & WhatsApp</span>
                  <span className="text-slate-200 font-medium block">{selectedApp.email}</span>
                  <span className="text-emerald-400 font-mono block mt-0.5">{selectedApp.phone}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">Institution & Degree</span>
                  <span className="text-slate-200 font-medium block">
                    {selectedApp.college_name || 'Saidu Medical College'}
                  </span>
                  <span className="text-slate-400 block mt-0.5">
                    {selectedApp.degree || 'MBBS'} • {selectedApp.year_of_study || selectedApp.mbbs_year}
                    {selectedApp.expected_graduation_year ? ` (Grad: ${selectedApp.expected_graduation_year})` : ''}
                  </span>
                </div>
              </div>

              {/* Payment Proof Preview */}
              {selectedApp.payment_proof_url && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">
                      Easypaisa Membership Fee Proof (Rs. 300)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Payment Screenshot Attached
                    </span>
                  </div>

                  {isResolvingProof ? (
                    <div className="flex items-center justify-center p-8 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 gap-2">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Resolving secure proof view...</span>
                    </div>
                  ) : proofImageError ? (
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-center space-y-3">
                      <div className="flex items-center justify-center gap-2 text-amber-300 font-semibold text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        Storage Access Notice (Private Bucket or Missing Public Policy)
                      </div>
                      <p className="text-[11px] text-amber-200/80 max-w-md mx-auto leading-relaxed">
                        The screenshot URL could not be rendered directly. In Supabase, if the <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-100 font-mono">applicant-documents</code> storage bucket is set to private, direct unauthenticated access is blocked.
                      </p>
                      <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={handleRetryProofResolution}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer"
                        >
                          Retry with Signed Session Token
                        </button>
                        <a
                          href={resolvedProofUrl || selectedApp.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        >
                          Open Direct URL &rarr;
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 p-2">
                      <div
                        onClick={() => setIsLightboxOpen(true)}
                        className="cursor-zoom-in group relative"
                        title="Click to zoom screenshot"
                      >
                        <img
                          src={resolvedProofUrl || selectedApp.payment_proof_url}
                          alt="Easypaisa Payment Proof"
                          onError={() => setProofImageError(true)}
                          className="max-h-60 mx-auto rounded-lg object-contain bg-black/40 group-hover:opacity-95 transition-opacity"
                        />
                        <div className="text-center mt-2 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsLightboxOpen(true);
                            }}
                            className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold underline cursor-pointer"
                          >
                            Click to Expand In-App &rarr;
                          </button>
                          <span className="text-slate-600">•</span>
                          <a
                            href={resolvedProofUrl || selectedApp.payment_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold underline"
                          >
                            Open Full Screenshot in New Tab &rarr;
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Previous Club Experience */}
              {selectedApp.previous_experience && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">
                    Previous Club Activities & Leadership Experience
                  </span>
                  <p className="text-slate-200 leading-relaxed italic">
                    "{selectedApp.previous_experience}"
                  </p>
                </div>
              )}

              {/* Statement of Motivation */}
              {selectedApp.motivation && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">
                    Statement / Application Record
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11.5px]">
                    {selectedApp.motivation}
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
                  placeholder="Provide internal notes, fee verification confirmation, or message to the student..."
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
                    Approve & Elevate to Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution In-App Lightbox for Receipt Verification */}
      {isLightboxOpen && (resolvedProofUrl || selectedApp?.payment_proof_url) && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[95vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="text-xs font-semibold text-purple-300">
                Easypaisa Payment Proof — {selectedApp?.full_name} (Rs. 300)
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={resolvedProofUrl || selectedApp?.payment_proof_url || undefined}
              alt="Full Resolution Proof"
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain border border-slate-700 bg-black/50 shadow-2xl"
            />
            <div className="mt-3 flex items-center gap-4 text-xs">
              <a
                href={resolvedProofUrl || selectedApp?.payment_proof_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline font-medium"
              >
                Open Original in New Tab &rarr;
              </a>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
