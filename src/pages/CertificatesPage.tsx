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
  Eye,
} from 'lucide-react';

export const CertificatesPage: React.FC = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // URL Query Params handling (?verify=CODE or ?tab=apply)
  const searchParams = new URLSearchParams(location.search);
  const verifyParam = searchParams.get('verify') || '';
  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'apply'
      ? 'apply'
      : tabParam === 'verify' || verifyParam
      ? 'verify'
      : 'my-certificates';

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

  // Modal States
  const [selectedQrCert, setSelectedQrCert] = useState<EventCertificate | null>(null);
  const [viewingCert, setViewingCert] = useState<EventCertificate | null>(null);
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

  // Fetch student certificates strictly for the logged-in user
  const fetchMyCertificates = async () => {
    setIsLoading(true);

    if (!user) {
      setCertificates([]);
      setIsLoading(false);
      return;
    }

    // 1. Retrieve locally submitted certificates strictly for this user account
    let userLocalCerts: EventCertificate[] = [];
    try {
      const stored = localStorage.getItem('sign_user_certificates');
      if (stored) {
        const parsed: EventCertificate[] = JSON.parse(stored);
        // Automatically purge btwerror test records requested by user
        const cleaned = parsed.filter(
          (c) => !c.student_email?.toLowerCase().includes('btwerror')
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('sign_user_certificates', JSON.stringify(cleaned));
        }

        userLocalCerts = cleaned.filter((c) => {
          // Never include mock demo certificates
          if (c.id?.startsWith('demo-')) return false;
          // Must match current authenticated user ID or email
          const matchesUid = Boolean(c.user_id && c.user_id === user.id);
          const matchesEmail = Boolean(
            user.email &&
              c.student_email &&
              c.student_email.trim().toLowerCase() === user.email.trim().toLowerCase()
          );
          return matchesUid || matchesEmail;
        });
      }
    } catch {
      // ignore
    }

    if (!isSupabaseConfigured) {
      // Offline / local preview: strictly show this user's records
      setCertificates(userLocalCerts);
      setIsLoading(false);
      return;
    }

    // 2. Query Supabase for this authenticated user's records
    try {
      let remoteCerts: EventCertificate[] = [];

      if (user.email) {
        const { data, error } = await supabase
          .from('event_certificates')
          .select('*')
          .or(`user_id.eq.${user.id},student_email.ilike.${user.email.trim()}`)
          .order('created_at', { ascending: false });

        if (!error && data) {
          remoteCerts = data as EventCertificate[];
        } else {
          // Fallback to user_id filter
          const { data: idData } = await supabase
            .from('event_certificates')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (idData) {
            remoteCerts = idData as EventCertificate[];
          }
        }
      } else {
        const { data: idData } = await supabase
          .from('event_certificates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (idData) {
          remoteCerts = idData as EventCertificate[];
        }
      }

      // Merge remote and local records for this user (remote records take priority)
      const merged = [
        ...remoteCerts,
        ...userLocalCerts.filter((l) => !remoteCerts.some((r) => r.id === l.id)),
      ];

      // Sanitize any dead blob: or legacy 404 github URLs
      const sanitized = merged.map((c) => ({
        ...c,
        certificate_file_url:
          c.certificate_file_url?.startsWith('blob:') ||
          (c.certificate_file_url?.includes('raw.githubusercontent.com') &&
            c.certificate_file_url?.includes('sample-certificate.pdf'))
            ? '/sample-certificate.pdf'
            : c.certificate_file_url || '/sample-certificate.pdf',
      }));

      setCertificates(sanitized);
    } catch (err) {
      console.warn('[SIGN Certificates] User certificates query notice:', err);
      // Strictly show only this user's local requests, sanitized
      const sanitized = userLocalCerts.map((c) => ({
        ...c,
        certificate_file_url:
          c.certificate_file_url?.startsWith('blob:') ||
          (c.certificate_file_url?.includes('raw.githubusercontent.com') &&
            c.certificate_file_url?.includes('sample-certificate.pdf'))
            ? '/sample-certificate.pdf'
            : c.certificate_file_url || '/sample-certificate.pdf',
      }));
      setCertificates(sanitized);
    } finally {
      setIsLoading(false);
    }
  };

  // Resolves the file format (PNG, JPG, WEBP, PDF)
  const getCertificateExtension = (fileUrl: string, filePath?: string | null): string => {
    if (fileUrl.startsWith('data:image/png')) return 'png';
    if (fileUrl.startsWith('data:image/jpeg') || fileUrl.startsWith('data:image/jpg')) return 'jpg';
    if (fileUrl.startsWith('data:image/webp')) return 'webp';
    if (fileUrl.startsWith('data:application/pdf')) return 'pdf';

    const check = (filePath || fileUrl.split('?')[0]).toLowerCase();
    if (check.endsWith('.png')) return 'png';
    if (check.endsWith('.jpg') || check.endsWith('.jpeg')) return 'jpg';
    if (check.endsWith('.webp')) return 'webp';
    return 'pdf';
  };

  // Safe certificate downloader that supports PNG, JPG, and PDF without extension mismatch
  const handleDownloadCertificate = async (cert: EventCertificate) => {
    const fileUrl =
      cert.certificate_file_url?.startsWith('blob:') ||
      (cert.certificate_file_url?.includes('raw.githubusercontent.com') &&
        cert.certificate_file_url?.includes('sample-certificate.pdf'))
        ? '/sample-certificate.pdf'
        : cert.certificate_file_url || '/sample-certificate.pdf';

    const ext = getCertificateExtension(fileUrl, cert.certificate_file_path);
    const fileName = cert.certificate_code
      ? `${cert.certificate_code}.${ext}`
      : `SIGN_Certificate.${ext}`;

    // 1. Base64 Data URL (e.g. data:image/png;base64,... or data:application/pdf;base64,...)
    if (fileUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 2. Fetch binary blob to guarantee a clean, uncorrupted download with matching MIME type
    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error('File download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(fileUrl, '_blank');
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
      // 1. Persist to Supabase if configured
      if (isSupabaseConfigured) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newRequest.event_id || '');
        const { error } = await supabase.from('event_certificates').insert({
          user_id: user.id,
          event_id: isUuid ? newRequest.event_id : null,
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
          console.error('[SIGN Certificates] Insert error:', error.message);
          setApplyErrorMsg(
            error.code === 'PGRST205'
              ? 'Database setup in progress: The event_certificates table has not been created in Supabase yet. Please notify the administrator to run the database migration.'
              : `Unable to submit application: ${error.message}`
          );
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Cache locally for instant UX
      try {
        const stored = localStorage.getItem('sign_user_certificates');
        const existing: EventCertificate[] = stored ? JSON.parse(stored) : [];
        const updated = [newRequest, ...existing.filter((e) => e.id !== newRequest.id)];
        localStorage.setItem('sign_user_certificates', JSON.stringify(updated));
      } catch {
        // ignore
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#016533] border border-emerald-200">
            <Award className="w-3.5 h-3.5 text-[#016533]" />
            <span>Official Academic Certification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Event Certificates & Verification
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Apply for, download, and verify authenticated certificates of participation for academic seminars, workshops, and clinical neuroscience sessions organized by the SIGN Chapter at Saidu Medical College.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300/70 text-xs sm:text-sm font-bold shadow-xs max-w-md sm:max-w-xl w-full">
            <button
              onClick={() => setActiveTab('my-certificates')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'my-certificates'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Award className={`w-4 h-4 ${activeTab === 'my-certificates' ? 'text-[#016533]' : 'text-slate-500'}`} />
              <span>My Certificates</span>
            </button>

            <button
              onClick={() => setActiveTab('apply')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'apply'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <PlusCircle className={`w-4 h-4 ${activeTab === 'apply' ? 'text-[#016533]' : 'text-slate-500'}`} />
              <span>Apply for Certificate</span>
            </button>

            <button
              onClick={() => setActiveTab('verify')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'verify'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'verify' ? 'text-[#016533]' : 'text-slate-500'}`} />
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
              <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-xl mx-auto shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#016533] flex items-center justify-center mx-auto">
                  <LogIn className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Student Account Login Required</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  To view and download your verified event certificates, please sign in with your student account credentials.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <Link
                    to="/login?from=/certificates"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#016533] hover:bg-[#014d27] transition-all shadow-sm"
                  >
                    <span>Sign In to Student Portal</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : isLoading ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                <Loader2 className="w-8 h-8 text-[#016533] animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Loading your certificate records...</p>
              </div>
            ) : certificates.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#016533] flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Certificate Requests Yet</h3>
                <p className="text-xs text-slate-600">
                  You have not applied for any event certificates yet. Attended a SIGN SMC academic session or workshop?
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#016533] hover:bg-[#014d27] transition-all shadow-sm cursor-pointer"
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
                      className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                            {isDeclined && <AlertCircle className="w-3 h-3 text-rose-600" />}
                            <span>{cert.status.toUpperCase()}</span>
                          </span>

                          <span className="text-[11px] text-slate-500">
                            Requested: {new Date(cert.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                            {cert.event_title}
                          </h3>
                          <div className="mt-1 text-xs text-slate-600 space-y-0.5">
                            <p>
                              Recipient: <strong className="text-slate-900">{cert.student_name}</strong>
                              {cert.student_id ? ` • Roll No: ${cert.student_id}` : ''}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {cert.college_name || 'Saidu Medical College'} • {cert.mbbs_year}
                            </p>
                          </div>
                        </div>

                        {/* Status Messages */}
                        {isPending && (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                            <p className="font-semibold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              Pending Committee Attendance Review
                            </p>
                            <p className="text-[11px] text-amber-700 mt-1">
                              Your attendance register is being cross-checked. You will receive an email once approved and can download your certificate here.
                            </p>
                          </div>
                        )}

                        {isDeclined && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                            <p className="font-semibold flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              Attendance Record Could Not Be Confirmed
                            </p>
                            {cert.reviewer_notes && (
                              <p className="text-[11px] text-rose-700 mt-1">
                                Note: {cert.reviewer_notes}
                              </p>
                            )}
                          </div>
                        )}

                        {isApproved && (
                          <div className="space-y-3">
                            {/* Certificate Image Thumbnail Preview if PNG/JPG */}
                            {cert.certificate_file_url && (() => {
                              const fileUrl =
                                cert.certificate_file_url?.startsWith('blob:') ||
                                (cert.certificate_file_url?.includes('raw.githubusercontent.com') &&
                                  cert.certificate_file_url?.includes('sample-certificate.pdf'))
                                  ? '/sample-certificate.pdf'
                                  : cert.certificate_file_url;
                              const ext = getCertificateExtension(fileUrl, cert.certificate_file_path);
                              if (ext === 'png' || ext === 'jpg' || ext === 'webp') {
                                return (
                                  <div
                                    onClick={() => setViewingCert(cert)}
                                    className="relative h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group/thumb"
                                    title="Click to view full certificate"
                                  >
                                    <img
                                      src={fileUrl}
                                      alt={cert.event_title}
                                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent flex items-end justify-between p-2.5">
                                      <span className="text-[10px] uppercase font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                                        {ext.toUpperCase()} Certificate
                                      </span>
                                      <span className="text-[11px] text-white flex items-center gap-1 font-semibold opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                        <Eye className="w-3.5 h-3.5 text-emerald-400" /> View Full
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-[#016533]">
                                  Certificate Verification ID
                                </span>
                                <span className="font-mono font-bold text-slate-900 text-xs bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-xs">
                                  {cert.certificate_code}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'Active'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {isApproved && (
                        <div className="pt-3 flex flex-col sm:flex-row items-center gap-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setViewingCert(cert)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#016533]" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadCertificate(cert)}
                            className="flex-1 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white bg-[#016533] hover:bg-[#014d27] transition-all shadow-sm cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download ({getCertificateExtension(cert.certificate_file_url || '', cert.certificate_file_path).toUpperCase()})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedQrCert(cert)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Verify QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#016533]" />
                            <span>QR</span>
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
              <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#016533] flex items-center justify-center mx-auto">
                  <LogIn className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Sign In to Apply for Certificates</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Please log in with your account so your verified certificate is securely linked to your profile and available for instant download.
                </p>
                <div className="pt-2">
                  <Link
                    to="/login?from=/certificates?tab=apply"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#016533] hover:bg-[#014d27] transition-all shadow-sm"
                  >
                    <span>Sign In to Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-[#016533] border border-emerald-200">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Apply for Event Certificate</h2>
                      <p className="text-xs text-slate-500">
                        Submit your details to receive an official verified certificate for an event you attended.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleApplySubmit} className="space-y-4">
                  {/* Select Event */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">
                      Attended Event / Seminar <span className="text-emerald-600">*</span>
                    </label>
                    {isLoadingEvents ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400">
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:border-[#016533] focus:ring-1 focus:ring-[#016533] outline-none"
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
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        Full Name (Printed on Certificate) <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Zaryab Khan"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#016533] focus:ring-1 focus:ring-[#016533] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        Student Email (For Notification) <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="e.g. student@smc.edu.pk"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#016533] focus:ring-1 focus:ring-[#016533] outline-none"
                      />
                    </div>
                  </div>

                  {/* College Roll No & Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        College Roll / Student ID <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g. SMC-2023-042"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#016533] focus:ring-1 focus:ring-[#016533] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        Academic Class / Year <span className="text-emerald-600">*</span>
                      </label>
                      <select
                        value={mbbsYear}
                        onChange={(e) => setMbbsYear(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:border-[#016533] focus:ring-1 focus:ring-[#016533] outline-none"
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
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">
                      Institution / Medical College <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="e.g. Saidu Medical College, Swat"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#016533] focus:ring-1 focus:ring-[#016533] outline-none"
                    />
                  </div>

                  {/* Attendance reference / Notes */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">
                      Session / Attendance Reference (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={attendanceNotes}
                      onChange={(e) => setAttendanceNotes(e.target.value)}
                      placeholder="e.g. Attended clinical workshops Day 1 & Day 2 in SMC Auditorium..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#016533] focus:ring-1 focus:ring-[#016533] outline-none"
                    />
                  </div>

                  {/* Feedback Messages */}
                  {applySuccessMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{applySuccessMsg}</span>
                    </div>
                  )}

                  {applyErrorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{applyErrorMsg}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#016533] hover:bg-[#014d27] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
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
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#016533] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Verify Certificate Authenticity</h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Enter the unique Certificate ID printed on your document or scanned from the QR code to verify its legitimacy directly from our official registry.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={verifyCodeInput}
                    onChange={(e) => setVerifyCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    placeholder="e.g. SIGN-CERT-2026-NEURO01"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono uppercase tracking-wider text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#016533] focus:ring-1 focus:ring-[#016533] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleVerify()}
                  disabled={isVerifying}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#016533] hover:bg-[#014d27] transition-all cursor-pointer shrink-0 disabled:opacity-50 shadow-sm"
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
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}
            </div>

            {/* Official Verification Seal Card */}
            {verifiedCert && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-[#016533] shadow-md relative overflow-hidden space-y-5 animate-in fade-in duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-[#016533] border border-emerald-200">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#016533] block">
                        Official Verification Certificate
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        Authenticated SIGN SMC Record
                      </h3>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    VERIFIED LEGITIMATE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                      Recipient Student
                    </span>
                    <span className="font-bold text-slate-900 text-sm block mt-0.5">
                      {verifiedCert.student_name}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {verifiedCert.college_name || 'Saidu Medical College'}
                      {verifiedCert.student_id ? ` • Roll: ${verifiedCert.student_id}` : ''}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                      Academic Event
                    </span>
                    <span className="font-bold text-[#016533] text-sm block mt-0.5 line-clamp-2">
                      {verifiedCert.event_title}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                      Unique Certificate ID
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                      {verifiedCert.certificate_code}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                      Issuance Details
                    </span>
                    <span className="text-slate-800 text-xs block mt-0.5 font-medium">
                      Issued on {verifiedCert.issued_at ? new Date(verifiedCert.issued_at).toLocaleDateString() : 'Verified Record'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Authority: SIGN Chapter, Saidu Medical College
                    </span>
                  </div>
                </div>

                {verifiedCert.certificate_file_url && (
                  <div className="pt-2 flex items-center justify-end gap-2 flex-wrap border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setViewingCert(verifiedCert)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#016533]" />
                      <span>View Full Certificate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadCertificate(verifiedCert)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#016533] hover:bg-[#014d27] transition-colors shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download ({getCertificateExtension(verifiedCert.certificate_file_url || '', verifiedCert.certificate_file_path).toUpperCase()})</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* QR Code Modal Dialog */}
        {selectedQrCert && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedQrCert(null)}
          >
            <div
              className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedQrCert(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#016533] flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Certificate Verification QR</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scan to verify authentic certificate status
                </p>
              </div>

              {/* QR Image */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `${window.location.origin}/certificates?verify=${selectedQrCert.certificate_code}`
                  )}`}
                  alt="Certificate Verification QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-[#016533]">
                {selectedQrCert.certificate_code}
              </div>

              <button
                type="button"
                onClick={() => handleCopyVerificationLink(selectedQrCert.certificate_code || '')}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
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

        {/* Certificate Viewer Modal Dialog (PNG / Image / PDF) */}
        {viewingCert && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setViewingCert(null)}
          >
            <div
              className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setViewingCert(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start justify-between pr-8 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#016533] shrink-0" />
                    <span className="line-clamp-1">{viewingCert.event_title || 'Certificate of Participation'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Awarded to <strong className="text-slate-800">{viewingCert.student_name}</strong> &bull; Verification Code: <span className="font-mono text-[#016533] font-semibold">{viewingCert.certificate_code}</span>
                  </p>
                </div>
              </div>

              {/* Certificate Media Viewer */}
              <div className="flex-1 overflow-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center p-2 min-h-[320px]">
                {(() => {
                  const fileUrl =
                    viewingCert.certificate_file_url?.startsWith('blob:') ||
                    (viewingCert.certificate_file_url?.includes('raw.githubusercontent.com') &&
                      viewingCert.certificate_file_url?.includes('sample-certificate.pdf'))
                      ? '/sample-certificate.pdf'
                      : viewingCert.certificate_file_url || '/sample-certificate.pdf';
                  const ext = getCertificateExtension(fileUrl, viewingCert.certificate_file_path);

                  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
                    return (
                      <img
                        src={fileUrl}
                        alt={`${viewingCert.student_name}'s Certificate`}
                        className="max-h-[62vh] max-w-full object-contain rounded-xl shadow-lg"
                      />
                    );
                  }

                  return (
                    <iframe
                      src={fileUrl}
                      title="Certificate Document Viewer"
                      className="w-full h-[62vh] rounded-xl border-0 bg-white"
                    />
                  );
                })()}
              </div>

              {/* Viewer Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-500">
                  Format:{' '}
                  <strong className="text-[#016533] uppercase font-mono font-bold">
                    {getCertificateExtension(viewingCert.certificate_file_url || '', viewingCert.certificate_file_path)}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={() => handleDownloadCertificate(viewingCert)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-[#016533] hover:bg-[#014d27] transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {getCertificateExtension(viewingCert.certificate_file_url || '', viewingCert.certificate_file_path).toUpperCase()} File</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

