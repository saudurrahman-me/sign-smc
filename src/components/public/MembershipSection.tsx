import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { MembershipApplication } from '../../types/database.types';
import { OFFICIAL_MEMBERSHIP_FORM_URL } from '../../data/fallback-content';

export const MembershipSection: React.FC = () => {
  const { user, profile, isConfigured } = useAuth();
  const [existingApp, setExistingApp] = useState<MembershipApplication | null>(null);
  const [isLoadingApp, setIsLoadingApp] = useState<boolean>(true);

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [mbbsYear, setMbbsYear] = useState<string>('3rd Year');
  const [studentId, setStudentId] = useState<string>('');
  const [motivation, setMotivation] = useState<string>('');
  const [researchInterests, setResearchInterests] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

  // Form Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Load existing user application if signed in
  useEffect(() => {
    let isMounted = true;
    const fetchExistingApplication = async () => {
      if (!user || !isSupabaseConfigured) {
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

    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
    return () => {
      isMounted = false;
    };
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!user) {
      setFormError('Authentication required. Please sign in or create an account first.');
      return;
    }

    if (!fullName.trim()) {
      setFormError('Please provide your full legal name as registered at SMC.');
      return;
    }

    if (!phone.trim()) {
      setFormError('Please enter a valid contact phone number.');
      return;
    }

    if (!motivation.trim() || motivation.trim().length < 30) {
      setFormError('Please describe your interest in neurology (at least 30 characters).');
      return;
    }

    if (!agreedToTerms) {
      setFormError('You must review and agree to the membership privacy notice and terms.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!isConfigured) {
        throw new Error(
          'Supabase database is not configured. Please supply VITE_SUPABASE_URL in your .env configuration.'
        );
      }

      const { data, error } = await supabase
        .from('membership_applications')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          email: user.email!,
          phone: phone.trim(),
          mbbs_year: mbbsYear,
          student_id: studentId.trim() || null,
          motivation: motivation.trim(),
          research_interests: researchInterests.trim() || null,
          agreed_to_terms: true,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setFormError('You have already submitted a membership application.');
        } else {
          setFormError(error.message);
        }
      } else {
        setExistingApp(data as MembershipApplication);
        setFormSuccess('Your application has been successfully submitted and is under review!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!existingApp || !user) return;
    const confirmWithdraw = window.confirm(
      'Are you sure you want to withdraw your membership application?'
    );
    if (!confirmWithdraw) return;

    try {
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

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Declined
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <section id="membership" className="py-24 bg-white border-b border-slate-200">
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
            Open to MBBS students at Saidu Medical College seeking structured exposure to clinical neurology,
            journal clubs, and collaborative academic research.
          </p>
        </div>

        {/* State 1: User Already Submitted An Application */}
        {user && isLoadingApp ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[#016533] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : user && existingApp ? (
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/20 border border-slate-200 p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Membership Application Record
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {existingApp.full_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Submitted: {new Date(existingApp.created_at).toLocaleDateString()} • {existingApp.mbbs_year}
                </p>
              </div>
              <div>{statusBadge(existingApp.status)}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200/80">
                <span className="text-slate-400 block font-semibold mb-1">Email & Contact</span>
                <span className="text-slate-800 font-medium">{existingApp.email}</span>
                <span className="text-slate-500 block mt-0.5">{existingApp.phone}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80">
                <span className="text-slate-400 block font-semibold mb-1">Academic Class & ID</span>
                <span className="text-slate-800 font-medium">{existingApp.mbbs_year}</span>
                <span className="text-slate-500 block mt-0.5">
                  {existingApp.student_id ? `Reg: ${existingApp.student_id}` : 'Student ID not recorded'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 text-xs mb-6">
              <span className="text-slate-400 block font-semibold mb-1">Motivation Statement</span>
              <p className="text-slate-700 leading-relaxed italic">
                "{existingApp.motivation}"
              </p>
            </div>

            {existingApp.reviewer_notes && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#016533] mb-6">
                <span className="font-bold block mb-1">Review Committee Feedback:</span>
                <p>{existingApp.reviewer_notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Decision notifications are communicated via your registered SMC institutional email.
              </p>
              {existingApp.status === 'pending' && (
                <button
                  onClick={handleWithdraw}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                >
                  Withdraw Application
                </button>
              )}
            </div>
          </div>
        ) : !user ? (
          /* State 2: Visitor Flow — Official Google Form Application Card */
          <div className="rounded-2xl bg-[#031D12] text-white p-8 sm:p-12 shadow-2xl border border-emerald-900/50 text-center relative overflow-hidden">
            {/* Ambient emerald blur */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-xl mx-auto relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-[#016533]/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-center mx-auto mb-5 shadow-inner">
                <FileText className="w-8 h-8 text-emerald-400" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 border border-emerald-700/50 text-emerald-300 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Academic Cohort Enrollment Open
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Official SIGN SMC Membership Form
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-8 max-w-lg mx-auto">
                Ready to join the Student Interest Group in Neurology at Saidu Medical College?
                Complete your official registration via Google Forms or access the student portal.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={OFFICIAL_MEMBERSHIP_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 transition-all shadow-xl shadow-emerald-950/40 border border-emerald-400/40"
                >
                  <FileText className="w-4 h-4" />
                  Fill Official Membership Form
                  <ExternalLink className="w-4 h-4 ml-0.5" />
                </a>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-emerald-950/70 hover:bg-emerald-900/60 border border-emerald-800/40 transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Sign In to Member Portal
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-emerald-950/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-emerald-200/70">
                <span>• Open to All MBBS Classes (SMC)</span>
                <span>• Official Inquiries: signsmc.official@gmail.com</span>
                <span>• KMU Affiliated Chapter</span>
              </div>
            </div>
          </div>
        ) : (
          /* State 3: Authenticated User Application Form */
          <div className="rounded-2xl bg-white border border-slate-200 p-8 sm:p-10 shadow-sm">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  MBBS Membership Application
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authenticated applicant: <span className="font-semibold text-slate-700">{user.email}</span>
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-[#016533] border border-emerald-200">
                Verified Account
              </span>
            </div>

            {formError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. / Mr. / Ms. Full Name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="mbbsYear" className="block text-xs font-bold text-slate-700 mb-1.5">
                    MBBS Class / Training Stage <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="mbbsYear"
                    value={mbbsYear}
                    onChange={(e) => setMbbsYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                  >
                    <option value="1st Year">1st Year MBBS</option>
                    <option value="2nd Year">2nd Year MBBS</option>
                    <option value="3rd Year">3rd Year MBBS</option>
                    <option value="4th Year">4th Year MBBS</option>
                    <option value="Final Year">Final Year MBBS</option>
                    <option value="House Officer">House Officer</option>
                    <option value="Faculty/Alumni">Faculty / Alumni</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="studentId" className="block text-xs font-bold text-slate-700 mb-1.5">
                    SMC Student ID / Registration <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. SMC-2023-XXXX"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="motivation" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Statement of Interest & Motivation <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="motivation"
                  required
                  rows={4}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Describe your interest in clinical neurology, neuroscience research, or academic society involvement at SMC (minimum 30 characters)..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {motivation.length} characters (minimum 30 required)
                </span>
              </div>

              <div>
                <label htmlFor="researchInterests" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Research Interests or Topics of Curiosity <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="researchInterests"
                  type="text"
                  value={researchInterests}
                  onChange={(e) => setResearchInterests(e.target.value)}
                  placeholder="e.g. Epilepsy, Stroke epidemiology, Movement disorders, Neuroimaging, Mental health"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#016533] focus:ring-1 focus:ring-[#016533]"
                />
              </div>

              {/* Privacy Notice Agreement */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#016533] focus:ring-[#016533] border-slate-300"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I confirm that I am a student or trainee at Saidu Medical College. I agree that my application data
                    will be handled strictly for SIGN Chapter academic membership selection in accordance with the
                    chapter privacy policy and will never be published publicly.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting || !agreedToTerms}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-950/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Membership Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};
