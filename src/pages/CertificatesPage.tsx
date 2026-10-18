import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/public/Navbar';
import { Footer } from '../components/public/Footer';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_CERTIFICATES } from '../data/fallback-certificates';
import type { EventCertificate, EventItem } from '../types/database.types';
import {
  Award,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  QrCode,
  ShieldCheck,
  ChevronRight,
  Loader2,
  X,
  Copy,
  Check,
  PlusCircle,
  LogIn,
} from 'lucide-react';

export const CertificatesPage: React.FC = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // URL Query Params handling (?verify=CODE or ?tab=apply)
  const searchParams = new URLSearchParams(location.search);
  const verifyParam = searchParams.get('verify') || '';
  const initialTab = searchParams.get('tab') === 'apply' ? 'apply' : verifyParam ? 'verify' : 'my-certificates';

  const [activeTab, setActiveTab] = useState<'my-certificates' | 'apply' | 'verify'>(initialTab);

  // Certificates list state
  const [certificates, setCertificates] = useState<EventCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Events list for dropdown
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Application Form State
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [studentName, setStudentName] = useState(profile?.full_name || '');
  const [studentEmail, setStudentEmail] = useState(user?.email || '');
  const [studentId, setStudentId] = useState('');
  const [collegeName, setCollegeName] = useState('Saidu Medical College, Swat');
  const [mbbsYear, setMbbsYear] = useState('MBBS - 3rd Year');
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);
  const [applyErrorMsg, setApplyErrorMsg] = useState<string | null>(null);

  // Verification Search State
  const [verifyCodeInput, setVerifyCodeInput] = useState(verifyParam);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCert, setVerifiedCert] = useState<EventCertificate | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // QR Code Modal State
  const [selectedQrCert, setSelectedQrCert] = useState<EventCertificate | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Keep studentName & email updated with auth
  useEffect(() => {
    if (profile?.full_name && !studentName) {
      setStudentName(profile.full_name);
    }
    if (user?.email && !studentEmail) {
      setStudentEmail(user.email);
    }
  }, [profile, user, studentName, studentEmail]);

  // Load Events for the dropdown
  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      if (!isSupabaseConfigured) {
        setEventsList([
          {
            id: 'demo-evt-1',
            title: 'Clinical Neuroscience Symposium 2026',
            description: '',
            category: 'Seminars & Guest Lectures',
            event_date: '2026-10-10',
            start_time: '09:00',
            end_time: '14:00',
            venue: 'Saidu Medical College Auditorium',
            is_virtual: false,
            organizer: 'SIGN SMC Chapter',
            cover_image_url: null,
            registration_url: null,
            is_published: true,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'demo-evt-2',
            title: 'Acute Ischemic Stroke & Neuro-Imaging Masterclass',
            description: '',
            category: 'Case Discussions',
            event_date: '2026-10-24',
            start_time: '10:00',
            end_time: '13:00',
            venue: 'Clinical Skills Lab, SMC',
            is_virtual: false,
            organizer: 'SIGN SMC Chapter',
            cover_image_url: null,
            registration_url: null,
            is_published: true,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        setIsLoadingEvents(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: false });

        if (!error && data && isMounted) {
          setEventsList(data as EventItem[]);
        }
      } catch (err) {
        console.warn('[SIGN Certificates] Error fetching events:', err);
      } finally {
        if (isMounted) setIsLoadingEvents(false);
      }
    };

    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch student certificates
  const fetchMyCertificates = async () => {
    setIsLoading(true);

    // Retrieve locally submitted certificates from cache
    let localCerts: EventCertificate[] = [];
    try {
      const stored = localStorage.getItem('sign_user_certificates');
      if (stored) {
        localCerts = JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    if (!isSupabaseConfigured) {
      const combined = [
        ...localCerts,
        ...DEMO_CERTIFICATES.filter((d) => !localCerts.some((l) => l.id === d.id)),
      ];
      setCertificates(combined);
      setIsLoading(false);
      return;
    }

    if (!user) {
      setCertificates([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('event_certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[SIGN Certificates] Fetch error:', error.message);
        setCertificates(localCerts.length > 0 ? localCerts : DEMO_CERTIFICATES);
      } else if (data) {
        const merged = [
          ...localCerts.filter((l) => !data.some((d) => d.id === l.id)),
          ...(data as EventCertificate[]),
        ];
        setCertificates(merged);
      }
    } catch (err) {
      console.warn('[SIGN Certificates] Unexpected error:', err);
      setCertificates(localCerts.length > 0 ? localCerts : DEMO_CERTIFICATES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCertificates();
  }, [user]);

  // Handle direct verification lookup
  const handleVerify = async (codeToVerify?: string) => {
    const code = (codeToVerify || verifyCodeInput).trim().toUpperCase();
    if (!code) {
      setVerifyError('Please enter a certificate verification code.');
      setVerifiedCert(null);
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setVerifiedCert(null);

    // Check local demo / cached certificates first
    try {
      const local = localStorage.getItem('sign_user_certificates');
      const allLocal: EventCertificate[] = local ? JSON.parse(local) : [];
      const match = [...DEMO_CERTIFICATES, ...allLocal].find(
        (c) => c.certificate_code?.toUpperCase() === code
      );
      if (match && match.status === 'approved') {
        setVerifiedCert(match);
        setIsVerifying(false);
        return;
      }
    } catch {
      // ignore
    }

    if (!isSupabaseConfigured) {
      const match = DEMO_CERTIFICATES.find((c) => c.certificate_code?.toUpperCase() === code);
      if (match && match.status === 'approved') {
        setVerifiedCert(match);
      } else {
        setVerifyError(`No approved certificate found matching code "${code}". Please check for typing errors.`);
      }
      setIsVerifying(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('event_certificates')
        .select('*')
        .eq('certificate_code', code)
        .eq('status', 'approved')
        .maybeSingle();

      if (error || !data) {
        setVerifyError(`No authentic certificate found matching code "${code}".`);
      } else {
        setVerifiedCert(data as EventCertificate);
      }
    } catch (err) {
      setVerifyError('Verification lookup could not be completed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // If page loaded with ?verify=CODE, run lookup automatically
  useEffect(() => {
    if (verifyParam) {
      setActiveTab('verify');
      handleVerify(verifyParam);
    }
  }, [verifyParam]);

  // Handle Application Submit
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?from=/certificates?tab=apply');
      return;
    }

    if (!selectedEventTitle) {
      setApplyErrorMsg('Please select the event you attended.');
      return;
    }

    setIsSubmitting(true);
    setApplyErrorMsg(null);
    setApplySuccessMsg(null);

    const newRequest: EventCertificate = {
      id: `cert-req-${Date.now()}`,
      user_id: user.id,
      event_id: selectedEventId || null,
      event_title: selectedEventTitle,
      student_name: studentName.trim() || profile?.full_name || 'Medical Student',
      student_email: studentEmail.trim() || user.email || '',
      student_id: studentId.trim() || null,
      college_name: collegeName.trim() || 'Saidu Medical College, Swat',
      mbbs_year: mbbsYear,
      attendance_notes: attendanceNotes.trim() || null,
      status: 'pending',
      certificate_code: null,
      certificate_file_url: null,
      certificate_file_path: null,
      issued_at: null,
      reviewer_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Cache locally for instant UX
      try {
        const stored = localStorage.getItem('sign_user_certificates');
        const existing: EventCertificate[] = stored ? JSON.parse(stored) : [];
        const updated = [newRequest, ...existing.filter((e) => e.id !== newRequest.id)];
        localStorage.setItem('sign_user_certificates', JSON.stringify(updated));
      } catch {
        // ignore
      }

      // 2. Persist to Supabase if configured
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('event_certificates').insert({
          user_id: user.id,
          event_id: newRequest.event_id,
          event_title: newRequest.event_title,
          student_name: newRequest.student_name,
          student_email: newRequest.student_email,
          student_id: newRequest.student_id,
          college_name: newRequest.college_name,
          mbbs_year: newRequest.mbbs_year,
          attendance_notes: newRequest.attendance_notes,
          status: 'pending',
        });

        if (error) {
          console.warn('[SIGN Certificates] Insert error:', error.message);
        }
      }

      setApplySuccessMsg('Your certificate request has been submitted successfully! The organizing committee will verify your attendance record and notify you.');
      setAttendanceNotes('');
      setSelectedEventId('');
      setSelectedEventTitle('');
      fetchMyCertificates();

      setTimeout(() => {
        setActiveTab('my-certificates');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setApplyErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyVerificationLink = (code: string) => {
    const url = `${window.location.origin}/certificates?verify=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#021A0F] text-slate-100">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Official Academic Certification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Event Certificates & Verification
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Apply for, download, and verify authenticated certificates of participation for academic seminars, workshops, and clinical neuroscience sessions organized by the SIGN Chapter at Saidu Medical College.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center justify-center mb-8">
          <div className="p-1 rounded-2xl bg-slate-900/90 border border-emerald-900/40 backdrop-blur-md flex items-center gap-1 shadow-lg max-w-md w-full">
            <button
              onClick={() => setActiveTab('my-certificates')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'my-certificates'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>My Certificates</span>
            </button>

            <button
              onClick={() => setActiveTab('apply')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'apply'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Apply for Certificate</span>
            </button>

            <button
              onClick={() => setActiveTab('verify')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'verify'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Authenticity</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: MY CERTIFICATES */}
        {/* ========================================================================= */}
        {activeTab === 'my-certificates' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {!user ? (
              <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-emerald-900/40 text-center space-y-4 max-w-xl mx-auto shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <LogIn className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white">Student Account Login Required</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  To view and download your verified event certificates, please sign in with your student account credentials.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <Link
                    to="/login?from=/certificates"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/50"
                  >
                    <span>Sign In to Student Portal</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : isLoading ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Loading your certificate records...</p>
              </div>
            ) : certificates.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">No Certificate Requests Yet</h3>
                <p className="text-xs text-slate-400">
                  You have not applied for any event certificates yet. Attended a SIGN SMC academic session or workshop?
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Apply for Your First Certificate
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {certificates.map((cert) => {
                  const isApproved = cert.status === 'approved';
                  const isPending = cert.status === 'pending';
                  const isDeclined = cert.status === 'declined';

                  return (
                    <div
                      key={cert.id}
                      className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-800/60 transition-all shadow-xl flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                              isApproved
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : isPending
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-rose-950 text-rose-300 border-rose-800'
                            }`}
                          >
                            {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                            {isPending && <Clock className="w-3 h-3 text-amber-400" />}
                            {isDeclined && <AlertCircle className="w-3 h-3 text-rose-400" />}
                            <span>{cert.status.toUpperCase()}</span>
                          </span>

                          <span className="text-[11px] text-slate-500">
                            Requested: {new Date(cert.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white line-clamp-2">
                            {cert.event_title}
                          </h3>
                          <div className="mt-1 text-xs text-slate-400 space-y-0.5">
                            <p>
                              Recipient: <strong className="text-slate-200">{cert.student_name}</strong>
                              {cert.student_id ? ` • Roll No: ${cert.student_id}` : ''}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {cert.college_name || 'Saidu Medical College'} • {cert.mbbs_year}
                            </p>
                          </div>
                        </div>

                        {/* Status Messages */}
                        {isPending && (
                          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-300 text-xs">
                            <p className="font-semibold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              Pending Committee Attendance Review
                            </p>
                            <p className="text-[11px] text-amber-200/80 mt-1">
                              Your attendance register is being cross-checked. You will receive an email once approved and can download your certificate here.
                            </p>
                          </div>
                        )}

                        {isDeclined && (
                          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/40 text-rose-300 text-xs">
                            <p className="font-semibold flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              Attendance Record Could Not Be Confirmed
                            </p>
                            {cert.reviewer_notes && (
                              <p className="text-[11px] text-rose-200/80 mt-1">
                                Note: {cert.reviewer_notes}
                              </p>
                            )}
                          </div>
                        )}

                        {isApproved && (
                          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-900/60 text-emerald-300 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-emerald-400">
                                Certificate Verification ID
                              </span>
                              <span className="font-mono font-bold text-white text-xs">
                                {cert.certificate_code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'Active'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {isApproved && (
                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 border-t border-slate-800/80">
                          <a
                            href={cert.certificate_file_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={cert.certificate_code ? `${cert.certificate_code}.pdf` : 'SIGN_Certificate.pdf'}
                            className="flex-1 w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-md shadow-emerald-950/30"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Certificate</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setSelectedQrCert(cert)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                          >
                            <QrCode className="w-4 h-4 text-emerald-400" />
                            <span>Verify QR</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: APPLY FOR CERTIFICATE */}
        {/* ========================================================================= */}
        {activeTab === 'apply' && (
          <div className="max-w-2xl mx-auto">
            {!user ? (
              <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-emerald-900/40 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <LogIn className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white">Sign In to Apply for Certificates</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Please log in with your account so your verified certificate is securely linked to your profile and available for instant download.
                </p>
                <div className="pt-2">
                  <Link
                    to="/login?from=/certificates?tab=apply"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/50"
                  >
                    <span>Sign In to Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Apply for Event Certificate</h2>
                      <p className="text-xs text-slate-400">
                        Submit your details to receive an official verified certificate for an event you attended.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleApplySubmit} className="space-y-4">
                  {/* Select Event */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs">
                      Attended Event / Seminar <span className="text-emerald-400">*</span>
                    </label>
                    {isLoadingEvents ? (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500">
                        Loading events roster...
                      </div>
                    ) : (
                      <select
                        required
                        value={selectedEventTitle}
                        onChange={(e) => {
                          setSelectedEventTitle(e.target.value);
                          const ev = eventsList.find((item) => item.title === e.target.value);
                          setSelectedEventId(ev?.id || '');
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                      >
                        <option value="">-- Select an event from list --</option>
                        {eventsList.map((ev) => (
                          <option key={ev.id} value={ev.title}>
                            {ev.title} ({new Date(ev.event_date).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Student Full Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-xs">
                        Full Name (Printed on Certificate) <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Zaryab Khan"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-xs">
                        Student Email (For Notification) <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="e.g. student@smc.edu.pk"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* College Roll No & Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-xs">
                        College Roll / Student ID <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g. SMC-2023-042"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-xs">
                        Academic Class / Year <span className="text-emerald-400">*</span>
                      </label>
                      <select
                        value={mbbsYear}
                        onChange={(e) => setMbbsYear(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                      >
                        <option value="MBBS - 1st Year">MBBS - 1st Year</option>
                        <option value="MBBS - 2nd Year">MBBS - 2nd Year</option>
                        <option value="MBBS - 3rd Year">MBBS - 3rd Year</option>
                        <option value="MBBS - 4th Year">MBBS - 4th Year</option>
                        <option value="MBBS - Final Year">MBBS - Final Year</option>
                        <option value="BDS">BDS Student</option>
                        <option value="House Officer / Intern">House Officer / Intern</option>
                        <option value="Postgraduate Trainee">Postgraduate Trainee</option>
                      </select>
                    </div>
                  </div>

                  {/* Institution */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs">
                      Institution / Medical College <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="e.g. Saidu Medical College, Swat"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                    />
                  </div>

                  {/* Attendance reference / Notes */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs">
                      Session / Attendance Reference (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={attendanceNotes}
                      onChange={(e) => setAttendanceNotes(e.target.value)}
                      placeholder="e.g. Attended clinical workshops Day 1 & Day 2 in SMC Auditorium..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500"
                    />
                  </div>

                  {/* Feedback Messages */}
                  {applySuccessMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{applySuccessMsg}</span>
                    </div>
                  )}

                  {applyErrorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{applyErrorMsg}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Application...</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          <span>Submit Certificate Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: VERIFY AUTHENTICITY */}
        {/* ========================================================================= */}
        {activeTab === 'verify' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Verify Certificate Authenticity</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Enter the unique Certificate ID printed on your document or scanned from the QR code to verify its legitimacy directly from our official registry.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={verifyCodeInput}
                    onChange={(e) => setVerifyCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    placeholder="e.g. SIGN-CERT-2026-NEURO01"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono uppercase tracking-wider text-white placeholder-slate-500 focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleVerify()}
                  disabled={isVerifying}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </div>

              {verifyError && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}
            </div>

            {/* Official Verification Seal Card */}
            {verifiedCert && (
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/60 shadow-2xl relative overflow-hidden space-y-5 animate-in fade-in duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-emerald-900/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                        Official Verification Certificate
                      </span>
                      <h3 className="text-base font-bold text-white">
                        Authenticated SIGN SMC Record
                      </h3>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    VERIFIED LEGITIMATE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                      Recipient Student
                    </span>
                    <span className="font-bold text-white text-sm block mt-0.5">
                      {verifiedCert.student_name}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {verifiedCert.college_name || 'Saidu Medical College'}
                      {verifiedCert.student_id ? ` • Roll: ${verifiedCert.student_id}` : ''}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                      Academic Event
                    </span>
                    <span className="font-bold text-emerald-300 text-sm block mt-0.5 line-clamp-2">
                      {verifiedCert.event_title}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                      Unique Certificate ID
                    </span>
                    <span className="font-mono font-bold text-white text-xs block mt-0.5">
                      {verifiedCert.certificate_code}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                      Issuance Details
                    </span>
                    <span className="text-slate-300 text-xs block mt-0.5">
                      Issued on {verifiedCert.issued_at ? new Date(verifiedCert.issued_at).toLocaleDateString() : 'Verified Record'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Authority: SIGN Chapter, Saidu Medical College
                    </span>
                  </div>
                </div>

                {verifiedCert.certificate_file_url && (
                  <div className="pt-2 flex justify-end">
                    <a
                      href={verifiedCert.certificate_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Official Certificate File</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* QR Code Modal Dialog */}
        {selectedQrCert && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedQrCert(null)}
          >
            <div
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedQrCert(null)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Certificate Verification QR</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scan to verify authentic certificate status
                </p>
              </div>

              {/* QR Image */}
              <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `${window.location.origin}/certificates?verify=${selectedQrCert.certificate_code}`
                  )}`}
                  alt="Certificate Verification QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-emerald-300">
                {selectedQrCert.certificate_code}
              </div>

              <button
                type="button"
                onClick={() => handleCopyVerificationLink(selectedQrCert.certificate_code || '')}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verification Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Verification URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
