import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  UserCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  CreditCard,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { resolveStorageViewUrl } from '../../lib/storage-helpers';
import type { MembershipApplication } from '../../types/database.types';
import { MembershipApplicationModal } from './MembershipApplicationModal';
import { LoginRequiredModal } from './LoginRequiredModal';

export const MembershipSection: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [existingApp, setExistingApp] = useState<MembershipApplication | null>(null);
  const [isLoadingApp, setIsLoadingApp] = useState<boolean>(true);
  const [resolvedProofUrl, setResolvedProofUrl] = useState<string>('');
  const [proofLoadError, setProofLoadError] = useState<boolean>(false);

  // Modals state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Auto-open application modal if coming from login with apply=true
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('openApply') === 'true' && user) {
      setIsApplyModalOpen(true);
    }
  }, [location.search, user]);

  // Load existing user application
  useEffect(() => {
    let isMounted = true;

    const fetchExistingApplication = async () => {
      if (!user) {
        setIsLoadingApp(false);
        return;
      }

      // Check dev session storage first
      try {
        const stored = sessionStorage.getItem('sign_user_application');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.user_id === user.id || user.id.startsWith('dev-'))) {
            setExistingApp(parsed as MembershipApplication);
            setIsLoadingApp(false);
            return;
          }
        }
      } catch {
        // ignore
      }

      if (!isSupabaseConfigured) {
        setIsLoadingApp(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('membership_applications')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('[SIGN Membership] Error checking existing app:', error.message);
        } else if (data && isMounted) {
          setExistingApp(data as MembershipApplication);
        }
      } catch (err) {
        console.error('[SIGN Membership] Unexpected error:', err);
      } finally {
        if (isMounted) setIsLoadingApp(false);
      }
    };

    fetchExistingApplication();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Resolve accessible proof URL when application or details modal is loaded
  useEffect(() => {
    let isMounted = true;
    if (existingApp?.payment_proof_url) {
      setProofLoadError(false);
      resolveStorageViewUrl(existingApp.payment_proof_url).then((url) => {
        if (isMounted) setResolvedProofUrl(url);
      });
    } else {
      setResolvedProofUrl('');
    }
    return () => {
      isMounted = false;
    };
  }, [existingApp?.payment_proof_url, isDetailsModalOpen]);

  const handleWithdraw = async () => {
    if (!existingApp || !user) return;
    const confirmWithdraw = window.confirm(
      'Are you sure you want to withdraw your membership application?'
    );
    if (!confirmWithdraw) return;

    try {
      if (!isSupabaseConfigured || user.id.startsWith('dev-')) {
        const updated = { ...existingApp, status: 'withdrawn' as const };
        setExistingApp(updated);
        try {
          sessionStorage.setItem('sign_user_application', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return;
      }

      const { error } = await supabase
        .from('membership_applications')
        .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
        .eq('id', existingApp.id)
        .eq('user_id', user.id);

      if (error) {
        alert(error.message);
      } else {
        setExistingApp({ ...existingApp, status: 'withdrawn' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error withdrawing application';
      alert(message);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else {
      setIsApplyModalOpen(true);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved Member
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Declined
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Admin Review
          </span>
        );
    }
  };

  return (
    <section id="membership" className="py-24 bg-white border-b border-slate-200 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#016533] border border-emerald-200 mb-4">
            <UserCheck className="w-3.5 h-3.5 text-[#016533]" />
            Student Cohort Enrollment
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Apply for Membership
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Open to MBBS and BDS students at Saidu Medical College seeking structured exposure to clinical neurology,
            journal clubs, and collaborative academic research.
          </p>
        </div>

        {/* Loading State */}
        {user && isLoadingApp ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#016533] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : user && existingApp ? (
          /* State 1: Logged-in User has ALREADY Applied */
          <div className="rounded-3xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Official Membership Application Record
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {existingApp.full_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted: {new Date(existingApp.created_at).toLocaleDateString()} •{' '}
                  {existingApp.college_name || 'Saidu Medical College'}
                </p>
              </div>
              <div>{statusBadge(existingApp.status)}</div>
            </div>

            {/* Application Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-slate-400 block font-semibold mb-1">Contact WhatsApp</span>
                <span className="text-slate-800 font-bold block">{existingApp.phone}</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">{existingApp.email}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-slate-400 block font-semibold mb-1">Academic Program</span>
                <span className="text-slate-800 font-bold block">
                  {existingApp.degree || 'MBBS'} • {existingApp.year_of_study || existingApp.mbbs_year}
                </span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  {existingApp.college_name || 'Saidu Medical College'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-slate-400 block font-semibold mb-1">Payment Status</span>
                <span className="text-[#016533] font-bold block">Rs. 300 (Easypaisa)</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  {existingApp.payment_proof_url ? '✓ Proof screenshot attached' : 'Proof pending'}
                </span>
              </div>
            </div>

            {/* Committee Feedback Notice if provided */}
            {existingApp.reviewer_notes && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-[#016533]">
                <span className="font-bold block mb-1">Committee Feedback:</span>
                <p className="text-slate-700 leading-relaxed">{existingApp.reviewer_notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
              <p className="text-slate-500 text-[11px]">
                {existingApp.status === 'approved'
                  ? 'Congratulations! Your membership is active. You are officially recognized as a member.'
                  : 'Your application is under evaluation by the SIGN SMC Executive Review Board.'}
              </p>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </button>

                {existingApp.status === 'pending' && (
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                  >
                    Withdraw Application
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* State 2 & 3: Button view (Unauthenticated or Logged-in without application) */
          <div className="rounded-3xl bg-[#031D12] text-white p-8 sm:p-12 shadow-2xl border border-emerald-900/50 text-center relative overflow-hidden">
            {/* Ambient emerald blur */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-xl mx-auto relative z-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#016533]/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-center mx-auto mb-2 shadow-inner">
                <FileText className="w-8 h-8 text-emerald-400" />
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 border border-emerald-700/50 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Annual Membership Cohort Open
              </span>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Official SIGN SMC Membership
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
                Join our vibrant student community at Saidu Medical College. Get started in medical
                research, clinical neurology workshops, journal clubs, and student-led scientific publications.
              </p>

              {/* Easypaisa Fee Highlight */}
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 max-w-md mx-auto text-xs text-emerald-200/90 text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    Membership Fee: Rs. 300
                  </span>
                  <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
                    Easypaisa
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300/80">
                  Account Name: <strong>Waqar Younas</strong> • Number:{' '}
                  <span className="font-mono font-bold text-white">03179752692</span>
                </p>
              </div>

              {/* Main Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleApplyClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 shadow-xl shadow-emerald-950/50 border border-emerald-400/40 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Apply for Membership
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                {!user && (
                  <Link
                    to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-800/40 transition-all"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    Sign In
                  </Link>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-emerald-950/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-emerald-200/70">
                <span>• Open to MBBS & BDS Students</span>
                <span>• Official Inquiries: signsmc.official@gmail.com</span>
                <span>• KMU Affiliated Chapter</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Native Google Form Replica Popup Sub-Window */}
      <MembershipApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onApplicationSubmitted={(newApp) => {
          setExistingApp(newApp);
        }}
      />

      {/* Modal 2: Sign-in Required Prompt for Unauthenticated Visitors */}
      <LoginRequiredModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Modal 3: View Submitted Application Details */}
      {isDetailsModalOpen && existingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Submitted Application Dossier</h3>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block font-semibold mb-1">Full Name & Email</span>
                <span className="text-slate-900 font-bold block">{existingApp.full_name}</span>
                <span className="text-slate-600 block">{existingApp.email}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block font-semibold mb-1">WhatsApp & College</span>
                <span className="text-slate-900 font-bold block">{existingApp.phone}</span>
                <span className="text-slate-600 block">
                  {existingApp.college_name || 'Saidu Medical College'} • {existingApp.degree || 'MBBS'}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  Year of Study: {existingApp.year_of_study || existingApp.mbbs_year} | Expected Grad:{' '}
                  {existingApp.expected_graduation_year || 'N/A'}
                </span>
              </div>

              {existingApp.previous_experience && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block font-semibold mb-1">
                    Previous Experience / Roles
                  </span>
                  <p className="text-slate-700 leading-relaxed">{existingApp.previous_experience}</p>
                </div>
              )}

              {existingApp.payment_proof_url && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block font-semibold mb-2">
                    Easypaisa Payment Proof Receipt
                  </span>
                  {proofLoadError ? (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center space-y-1.5">
                      <p className="text-xs text-amber-800 font-medium">
                        Payment proof receipt image could not be loaded directly.
                      </p>
                      <a
                        href={resolvedProofUrl || existingApp.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-xs font-semibold text-[#016533] underline"
                      >
                        Open Proof in New Tab &rarr;
                      </a>
                    </div>
                  ) : (
                    <a
                      href={resolvedProofUrl || existingApp.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <img
                        src={resolvedProofUrl || existingApp.payment_proof_url}
                        alt="Payment Proof"
                        onError={() => setProofLoadError(true)}
                        className="max-h-48 rounded-lg object-contain border border-slate-200 bg-white mx-auto shadow-sm group-hover:opacity-90 transition-opacity"
                      />
                      <span className="text-[11px] text-[#016533] font-semibold text-center block mt-1.5 group-hover:underline">
                        Click to view full image &rarr;
                      </span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#016533] hover:bg-[#015229] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
