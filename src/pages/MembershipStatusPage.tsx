import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { MembershipApplication } from '../types/database.types';
import { SignLogo } from '../components/brand/SignLogo';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  BookOpen,
} from 'lucide-react';

export const MembershipStatusPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [app, setApp] = useState<MembershipApplication | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchApp = async () => {
      if (!user || !isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('membership_applications')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('[SIGN Status] Error loading application:', error.message);
        } else if (data && isMounted) {
          setApp(data as MembershipApplication);
        }
      } catch (err) {
        console.error('[SIGN Status] Unexpected error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchApp();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleWithdraw = async () => {
    if (!app || !user) return;
    const confirm = window.confirm(
      'Are you sure you want to withdraw your membership application? This action can be reviewed by committee administrators.'
    );
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('membership_applications')
        .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
        .eq('id', app.id)
        .eq('user_id', user.id);

      if (error) {
        alert(error.message);
      } else {
        setApp({ ...app, status: 'withdrawn' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error withdrawing';
      alert(msg);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Approved Chapter Member
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Declined for Current Intake
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
            Application Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-4 h-4 text-amber-600" />
            Under Committee Review
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <SignLogo variant="full" size="sm" inverted={true} />
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400 hidden sm:inline">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-slate-300 hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#016533] hover:text-[#015229]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Public Website
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Student Membership Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Saidu Medical College (SMC) • Student Interest Group in Neurology (SIGN)
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-8 h-8 border-3 border-[#016533] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Retrieving application status...</p>
          </div>
        ) : app ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Application Record
                </span>
                <h2 className="text-xl font-bold text-slate-900">{app.full_name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-[#016533]" />
                  <span>Submitted on {new Date(app.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{app.mbbs_year}</span>
                </div>
              </div>
              <div>{statusBadge(app.status)}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-semibold mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#016533]" />
                  Applicant Contact
                </span>
                <span className="text-slate-800 font-medium block">{app.email}</span>
                <span className="text-slate-600 block mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {app.phone}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-semibold mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#016533]" />
                  Class & Identification
                </span>
                <span className="text-slate-800 font-medium block">{app.mbbs_year}</span>
                <span className="text-slate-500 block mt-0.5">
                  {app.student_id ? `Reg ID: ${app.student_id}` : 'Student ID: Not provided'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs mb-6">
              <span className="text-slate-400 block font-semibold mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#016533]" />
                Statement of Interest
              </span>
              <p className="text-slate-700 leading-relaxed italic mt-1">
                "{app.motivation}"
              </p>
            </div>

            {app.research_interests && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs mb-6">
                <span className="text-slate-400 block font-semibold mb-1">
                  Research Topics of Interest
                </span>
                <p className="text-slate-700">{app.research_interests}</p>
              </div>
            )}

            {app.reviewer_notes && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#016533] mb-6">
                <span className="font-bold block mb-1">Executive Review Notes:</span>
                <p>{app.reviewer_notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Need to update details? Contact the chapter secretary or advisory mentors.
              </p>
              {app.status === 'pending' && (
                <button
                  onClick={handleWithdraw}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                >
                  Withdraw Application
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#016533] flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-[#016533]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No Application Submitted Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              You are signed in as <span className="font-semibold text-slate-700">{user?.email}</span>,
              but have not yet submitted a membership application for the current academic intake.
            </p>
            <div className="mt-6">
              <Link
                to="/#membership"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 transition-all shadow-md shadow-emerald-950/20"
              >
                Complete Membership Form
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
