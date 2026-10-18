import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { DEMO_CERTIFICATES } from '../../data/fallback-certificates';
import {
  generateCertificateCode,
  sendCertificateEmailNotification,
} from '../../lib/certificate-notifications';
import type { EventCertificate, CertificateStatus, EventItem } from '../../types/database.types';
import {
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  Mail,
  FileCheck,
  X,
  Loader2,
  Plus,
} from 'lucide-react';

export const AdminCertificatesPage: React.FC = () => {
  const { user } = useAuth();

  const [certificates, setCertificates] = useState<EventCertificate[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CertificateStatus>('All');

  // Review Modal State
  const [selectedCert, setSelectedCert] = useState<EventCertificate | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'decline'>('approve');
  const [generatedCode, setGeneratedCode] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [mailtoBackupUrl, setMailtoBackupUrl] = useState<string | null>(null);

  // Direct Issue Modal State
  const [isDirectIssueOpen, setIsDirectIssueOpen] = useState(false);
  const [directStudentName, setDirectStudentName] = useState('');
  const [directStudentEmail, setDirectStudentEmail] = useState('');
  const [directStudentId, setDirectStudentId] = useState('');
  const [directCollege, setDirectCollege] = useState('Saidu Medical College, Swat');
  const [directMbbsYear, setDirectMbbsYear] = useState('MBBS - 3rd Year');
  const [directEventTitle, setDirectEventTitle] = useState('');
  const [directFile, setDirectFile] = useState<File | null>(null);
  const [isDirectSubmitting, setIsDirectSubmitting] = useState(false);

  // Load events for selection
  useEffect(() => {
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
            venue: 'Auditorium',
            is_virtual: false,
            organizer: 'SIGN SMC',
            cover_image_url: null,
            registration_url: null,
            is_published: true,
            created_by: null,
            created_at: '',
            updated_at: '',
          },
        ]);
        return;
      }
      try {
        const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
        if (data) setEventsList(data as EventItem[]);
      } catch (err) {
        console.warn('[SIGN Admin Certificates] Event list error:', err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch all certificates
  const fetchCertificates = async () => {
    setIsLoading(true);

    // Check local storage for session edits
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

    try {
      const { data, error } = await supabase
        .from('event_certificates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[SIGN Admin Certificates] Fetch error:', error.message);
        setCertificates(localCerts.length > 0 ? localCerts : DEMO_CERTIFICATES);
      } else if (data) {
        const merged = [
          ...localCerts.filter((l) => !data.some((d) => d.id === l.id)),
          ...(data as EventCertificate[]),
        ];
        setCertificates(merged);
      }
    } catch (err) {
      console.warn('[SIGN Admin Certificates] Unexpected error:', err);
      setCertificates(localCerts.length > 0 ? localCerts : DEMO_CERTIFICATES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const openReviewModal = (cert: EventCertificate, defaultAction: 'approve' | 'decline' = 'approve') => {
    setSelectedCert(cert);
    setReviewAction(defaultAction);
    setGeneratedCode(cert.certificate_code || generateCertificateCode());
    setReviewerNotes(cert.reviewer_notes || '');
    setSelectedFile(null);
    setFilePreviewUrl(cert.certificate_file_url || null);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    setMailtoBackupUrl(null);
    setIsReviewModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProcessDecision = async () => {
    if (!selectedCert || !user) return;
    setIsProcessing(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    const isApproved = reviewAction === 'approve';
    const finalCode = isApproved ? (generatedCode.trim() || generateCertificateCode()) : null;
    const timestamp = new Date().toISOString();

    let uploadedUrl = selectedCert.certificate_file_url;
    let uploadedPath = selectedCert.certificate_file_path;

    // 1. Upload Certificate File if approving and new file selected
    if (isApproved && selectedFile) {
      if (isSupabaseConfigured) {
        try {
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `${finalCode || Date.now()}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from('certificates')
            .upload(filePath, selectedFile, { upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabase.storage
              .from('certificates')
              .getPublicUrl(filePath);
            uploadedUrl = publicUrlData.publicUrl;
            uploadedPath = filePath;
          } else {
            console.warn('[SIGN Admin Certificates] Storage upload notice:', uploadErr.message);
            uploadedUrl = filePreviewUrl || 'https://raw.githubusercontent.com/saudurrahman-me/sign-smc/main/public/sample-certificate.pdf';
          }
        } catch (err) {
          console.warn('[SIGN Admin Certificates] Upload exception:', err);
          uploadedUrl = filePreviewUrl || 'https://raw.githubusercontent.com/saudurrahman-me/sign-smc/main/public/sample-certificate.pdf';
        }
      } else {
        uploadedUrl = filePreviewUrl || 'https://raw.githubusercontent.com/saudurrahman-me/sign-smc/main/public/sample-certificate.pdf';
      }
    } else if (isApproved && !uploadedUrl) {
      // Default fallback certificate URL if none uploaded
      uploadedUrl = 'https://raw.githubusercontent.com/saudurrahman-me/sign-smc/main/public/sample-certificate.pdf';
    }

    const updatedRecord: EventCertificate = {
      ...selectedCert,
      status: isApproved ? 'approved' : 'declined',
      certificate_code: finalCode,
      certificate_file_url: isApproved ? uploadedUrl : null,
      certificate_file_path: isApproved ? uploadedPath : null,
      issued_at: isApproved ? timestamp : null,
      reviewer_notes: reviewerNotes.trim() || null,
      reviewed_by: user.id,
      reviewed_at: timestamp,
      updated_at: timestamp,
    };

    try {
      // 1. Cache in local storage for instant sync across tabs
      try {
        const stored = localStorage.getItem('sign_user_certificates');
        const existing: EventCertificate[] = stored ? JSON.parse(stored) : [];
        const nextList = [
          updatedRecord,
          ...existing.filter((e) => e.id !== updatedRecord.id),
        ];
        localStorage.setItem('sign_user_certificates', JSON.stringify(nextList));
      } catch {
        // ignore
      }

      // 2. Persist to Supabase if configured
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('event_certificates')
          .update({
            status: updatedRecord.status,
            certificate_code: updatedRecord.certificate_code,
            certificate_file_url: updatedRecord.certificate_file_url,
            certificate_file_path: updatedRecord.certificate_file_path,
            issued_at: updatedRecord.issued_at,
            reviewer_notes: updatedRecord.reviewer_notes,
            reviewed_by: updatedRecord.reviewed_by,
            reviewed_at: updatedRecord.reviewed_at,
            updated_at: updatedRecord.updated_at,
          })
          .eq('id', selectedCert.id);

        if (error) {
          console.warn('[SIGN Admin Certificates] Supabase update warning:', error.message);
        }
      }

      // 3. Send Notification Email to student
      const emailResult = await sendCertificateEmailNotification({
        studentName: selectedCert.student_name,
        studentEmail: selectedCert.student_email,
        eventTitle: selectedCert.event_title,
        status: isApproved ? 'approved' : 'declined',
        certificateCode: finalCode,
        reviewerNotes: reviewerNotes.trim() || null,
      });

      setMailtoBackupUrl(emailResult.mailtoUrl);

      // Update state
      setCertificates((prev) =>
        prev.map((c) => (c.id === selectedCert.id ? updatedRecord : c))
      );

      setActionSuccessMsg(
        isApproved
          ? `Certificate approved and issued! Notification dispatched to ${selectedCert.student_email}.`
          : `Request marked as declined. Notice dispatched to ${selectedCert.student_email}.`
      );

      setTimeout(() => {
        setIsReviewModalOpen(false);
        setActionSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update certificate request.';
      setActionErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct Issue Handler
  const handleDirectIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directStudentName || !directStudentEmail || !directEventTitle || !user) return;
    setIsDirectSubmitting(true);

    const finalCode = generateCertificateCode();
    const timestamp = new Date().toISOString();

    let uploadedUrl = 'https://raw.githubusercontent.com/saudurrahman-me/sign-smc/main/public/sample-certificate.pdf';
    let uploadedPath = `certificates/${finalCode}.pdf`;

    if (directFile && isSupabaseConfigured) {
      try {
        const fileExt = directFile.name.split('.').pop();
        const fileName = `${finalCode}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('certificates')
          .upload(fileName, directFile, { upsert: true });

        if (!uploadErr) {
          const { data } = supabase.storage.from('certificates').getPublicUrl(fileName);
          uploadedUrl = data.publicUrl;
          uploadedPath = fileName;
        }
      } catch {
        // fallback
      }
    }

    const newCert: EventCertificate = {
      id: `direct-cert-${Date.now()}`,
      user_id: user.id,
      event_title: directEventTitle,
      student_name: directStudentName.trim(),
      student_email: directStudentEmail.trim(),
      student_id: directStudentId.trim() || null,
      college_name: directCollege.trim() || 'Saidu Medical College, Swat',
      mbbs_year: directMbbsYear,
      attendance_notes: 'Direct issued by Chapter Administration',
      status: 'approved',
      certificate_code: finalCode,
      certificate_file_url: uploadedUrl,
      certificate_file_path: uploadedPath,
      issued_at: timestamp,
      reviewer_notes: 'Directly verified and issued by Authorized Administrator.',
      reviewed_by: user.id,
      reviewed_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    };

    try {
      // Local storage cache
      try {
        const stored = localStorage.getItem('sign_user_certificates');
        const existing: EventCertificate[] = stored ? JSON.parse(stored) : [];
        localStorage.setItem('sign_user_certificates', JSON.stringify([newCert, ...existing]));
      } catch {
        // ignore
      }

      // Supabase persist
      if (isSupabaseConfigured) {
        await supabase.from('event_certificates').insert({
          user_id: user.id,
          event_title: newCert.event_title,
          student_name: newCert.student_name,
          student_email: newCert.student_email,
          student_id: newCert.student_id,
          college_name: newCert.college_name,
          mbbs_year: newCert.mbbs_year,
          attendance_notes: newCert.attendance_notes,
          status: 'approved',
          certificate_code: newCert.certificate_code,
          certificate_file_url: newCert.certificate_file_url,
          certificate_file_path: newCert.certificate_file_path,
          issued_at: newCert.issued_at,
          reviewer_notes: newCert.reviewer_notes,
          reviewed_by: user.id,
          reviewed_at: timestamp,
        });
      }

      // Dispatch notification email
      await sendCertificateEmailNotification({
        studentName: newCert.student_name,
        studentEmail: newCert.student_email,
        eventTitle: newCert.event_title,
        status: 'approved',
        certificateCode: finalCode,
        reviewerNotes: newCert.reviewer_notes,
      });

      setCertificates((prev) => [newCert, ...prev]);
      setIsDirectIssueOpen(false);
      setDirectStudentName('');
      setDirectStudentEmail('');
      setDirectStudentId('');
      setDirectFile(null);
    } catch (err) {
      console.error('[SIGN Admin Certificates] Direct issue error:', err);
    } finally {
      setIsDirectSubmitting(false);
    }
  };

  // Filtered Certificates
  const filteredCertificates = certificates.filter((cert) => {
    const matchesStatus = statusFilter === 'All' || cert.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      cert.student_name.toLowerCase().includes(q) ||
      cert.student_email.toLowerCase().includes(q) ||
      cert.event_title.toLowerCase().includes(q) ||
      (cert.student_id && cert.student_id.toLowerCase().includes(q)) ||
      (cert.certificate_code && cert.certificate_code.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const totalCount = certificates.length;
  const pendingCount = certificates.filter((c) => c.status === 'pending').length;
  const approvedCount = certificates.filter((c) => c.status === 'approved').length;
  const declinedCount = certificates.filter((c) => c.status === 'declined').length;

  return (
    <div className="p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
            Academic Operations & Credentials
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Certificates Management & Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Verify event attendance, upload authenticated certificate files, and issue official credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDirectIssueOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-md shadow-emerald-950/40 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Direct Issue Certificate</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Inquiries</span>
          <span className="text-2xl font-black text-white mt-1 block">{totalCount}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-amber-400 block">Pending Review</span>
          <span className="text-2xl font-black text-amber-300 mt-1 block">{pendingCount}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-emerald-400 block">Approved & Issued</span>
          <span className="text-2xl font-black text-emerald-300 mt-1 block">{approvedCount}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-rose-400 block">Declined Requests</span>
          <span className="text-2xl font-black text-rose-300 mt-1 block">{declinedCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, roll no, event..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500"
          />
        </div>

        {/* Status Pills Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
          {(['All', 'pending', 'approved', 'declined'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table / Cards */}
      {isLoading ? (
        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading certificate applications...</p>
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
          <Award className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Certificate Records Found</h3>
          <p className="text-xs text-slate-500">
            {searchQuery ? 'Try adjusting your search criteria.' : 'No students have applied for event certificates yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCertificates.map((cert) => {
            const isApproved = cert.status === 'approved';
            const isPending = cert.status === 'pending';
            const isDeclined = cert.status === 'declined';

            return (
              <div
                key={cert.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        isApproved
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : isPending
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      {cert.status}
                    </span>

                    <span className="text-sm font-bold text-white">{cert.student_name}</span>
                    <span className="text-xs text-slate-400">({cert.student_email})</span>
                    {cert.student_id && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {cert.student_id}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-emerald-300 font-medium">
                    Event: <span className="text-white">{cert.event_title}</span>
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                    <span>{cert.college_name || 'Saidu Medical College'}</span>
                    <span>•</span>
                    <span>{cert.mbbs_year}</span>
                    <span>•</span>
                    <span>Applied: {new Date(cert.created_at).toLocaleDateString()}</span>
                    {cert.certificate_code && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-emerald-400 font-bold">{cert.certificate_code}</span>
                      </>
                    )}
                  </div>

                  {cert.attendance_notes && (
                    <p className="text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      Attendance Note: {cert.attendance_notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
                  {cert.certificate_file_url && (
                    <a
                      href={cert.certificate_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                      title="Download / View Certificate File"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => openReviewModal(cert, isDeclined ? 'decline' : 'approve')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all cursor-pointer shadow-sm"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-slate-950" />
                    <span>{isPending ? 'Verify & Issue' : 'Review / Re-issue'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review & Issue Modal */}
      {isReviewModalOpen && selectedCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isProcessing && setIsReviewModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Verify & Issue Event Certificate
                  </h2>
                  <p className="text-xs text-slate-400">
                    Review attendance record and approve official credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                disabled={isProcessing}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Metadata Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Student Name:</span>
                <span className="font-bold text-white text-sm">{selectedCert.student_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Student Email:</span>
                <span className="text-slate-200 font-mono">{selectedCert.student_email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Event Title:</span>
                <span className="font-semibold text-emerald-300 text-right">{selectedCert.event_title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Roll / ID:</span>
                <span className="text-slate-300">{selectedCert.student_id || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Class & Institution:</span>
                <span className="text-slate-300">
                  {selectedCert.mbbs_year} • {selectedCert.college_name}
                </span>
              </div>
              {selectedCert.attendance_notes && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 block mb-0.5">Student Note:</span>
                  <span className="text-slate-300 italic">{selectedCert.attendance_notes}</span>
                </div>
              )}
            </div>

            {/* Action Toggle (Approve vs Decline) */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setReviewAction('approve')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  reviewAction === 'approve'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Approve & Issue Certificate
              </button>

              <button
                type="button"
                onClick={() => setReviewAction('decline')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  reviewAction === 'decline'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Decline Request
              </button>
            </div>

            {/* Form Fields for Approval */}
            {reviewAction === 'approve' ? (
              <div className="space-y-4">
                {/* Certificate Code */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Certificate Verification ID <span className="text-emerald-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={generatedCode}
                      onChange={(e) => setGeneratedCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs font-bold uppercase tracking-wider text-emerald-300 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setGeneratedCode(generateCertificateCode())}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                      title="Re-generate Code"
                    >
                      New Code
                    </button>
                  </div>
                </div>

                {/* Upload Certificate File (PDF / Image) */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Upload Certificate Document (PDF or High-Res Image)
                  </label>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-800 hover:border-emerald-500/50 transition-colors text-center space-y-2">
                    <input
                      type="file"
                      id="cert-file-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="cert-file-input"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>{selectedFile ? selectedFile.name : 'Choose Certificate PDF / Image'}</span>
                    </label>
                    <p className="text-[10px] text-slate-500">
                      {selectedFile
                        ? `Selected: ${(selectedFile.size / 1024).toFixed(1)} KB`
                        : filePreviewUrl
                        ? 'Certificate file currently attached.'
                        : 'Upload pre-made attendee certificate. If none selected, official chapter template will be used.'}
                    </p>
                  </div>
                </div>

                {/* Committee Reviewer Notes */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Reviewer / Verification Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="e.g. Attendance verified via day 1 clinical register."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            ) : (
              /* Fields for Decline */
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Reason for Declining (Sent to Student) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="e.g. Could not confirm attendance in the official symposium register..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-rose-500"
                />
              </div>
            )}

            {/* Notification Notice */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                An official email notification will be automatically dispatched to{' '}
                <strong className="text-slate-200">{selectedCert.student_email}</strong>.
              </span>
            </div>

            {/* Feedback messages */}
            {actionSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{actionSuccessMsg}</span>
                </div>
                {mailtoBackupUrl && (
                  <a
                    href={mailtoBackupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] underline font-bold text-white shrink-0"
                  >
                    Open Mail App &rarr;
                  </a>
                )}
              </div>
            )}

            {actionErrorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{actionErrorMsg}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProcessDecision}
                disabled={isProcessing}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                  reviewAction === 'approve'
                    ? 'text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 shadow-emerald-950/40'
                    : 'text-white bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : reviewAction === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Issue Certificate</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Confirm Decline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Issue Modal */}
      {isDirectIssueOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isDirectSubmitting && setIsDirectIssueOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Direct Issue Certificate</h2>
                <p className="text-xs text-slate-400">
                  Issue an official verified certificate directly to an attendee.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectIssueOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectIssue} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Event Title <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="admin-direct-events"
                  value={directEventTitle}
                  onChange={(e) => setDirectEventTitle(e.target.value)}
                  placeholder="e.g. Clinical Neuroscience Symposium 2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                />
                <datalist id="admin-direct-events">
                  {eventsList.map((evt) => (
                    <option key={evt.id} value={evt.title} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Recipient Full Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={directStudentName}
                    onChange={(e) => setDirectStudentName(e.target.value)}
                    placeholder="e.g. Zaryab Khan"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Recipient Email <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={directStudentEmail}
                    onChange={(e) => setDirectStudentEmail(e.target.value)}
                    placeholder="e.g. student@smc.edu.pk"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Student ID / Roll No
                  </label>
                  <input
                    type="text"
                    value={directStudentId}
                    onChange={(e) => setDirectStudentId(e.target.value)}
                    placeholder="e.g. SMC-2023-042"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={directCollege}
                    onChange={(e) => setDirectCollege(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Academic Year
                  </label>
                  <select
                    value={directMbbsYear}
                    onChange={(e) => setDirectMbbsYear(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                  >
                    <option value="MBBS - 1st Year">MBBS - 1st Year</option>
                    <option value="MBBS - 2nd Year">MBBS - 2nd Year</option>
                    <option value="MBBS - 3rd Year">MBBS - 3rd Year</option>
                    <option value="MBBS - 4th Year">MBBS - 4th Year</option>
                    <option value="MBBS - Final Year">MBBS - Final Year</option>
                    <option value="House Officer">House Officer</option>
                    <option value="Postgraduate Trainee">Postgraduate Trainee</option>
                    <option value="Faculty / Consultant">Faculty / Consultant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Attach Certificate Document (PDF / Image)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => e.target.files && setDirectFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDirectIssueOpen(false)}
                  disabled={isDirectSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDirectSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-md shadow-emerald-950/40"
                >
                  {isDirectSubmitting ? 'Issuing Certificate...' : 'Direct Issue & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
