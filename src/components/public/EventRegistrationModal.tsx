import React, { useState, useEffect } from 'react';
import { useOptionalAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { EventItem, EventRegistration, SiteSettings } from '../../types/database.types';
import { OFFICIAL_SETTINGS } from '../../data/fallback-content';
import { evaluateEventRegistration } from '../../lib/event-registration-schedule';
import {
  compressPaymentReceipt,
  formatBytes,
  type CompressionResult,
} from '../../lib/image-compressor';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  Ticket,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  CreditCard,
  Tag,
  Zap,
  Upload,
  Eye,
  Building2,
  FileCheck,
  MessageCircle,
  Mail,
  Users,
  Lock,
} from 'lucide-react';

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  existingRegistration?: EventRegistration | null;
  onRegistrationSuccess?: (reg: EventRegistration) => void;
}

export const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  isOpen,
  onClose,
  event,
  existingRegistration = null,
  onRegistrationSuccess,
}) => {
  const auth = useOptionalAuth();
  const user = auth?.user || null;
  const profile = auth?.profile || null;

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('Saidu Medical College, Swat');
  const [mbbsYear, setMbbsYear] = useState('MBBS - 3rd Year');
  const [studentId, setStudentId] = useState('');
  const [questions, setQuestions] = useState('');

  // Payment & Ambassador States
  const [ambassadorInput, setAmbassadorInput] = useState('');
  const [appliedAmbassadorCode, setAppliedAmbassadorCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [ambassadorMessage, setAmbassadorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [isViewingReceiptLightbox, setIsViewingReceiptLightbox] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedReg, setConfirmedReg] = useState<EventRegistration | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(OFFICIAL_SETTINGS);

  useEffect(() => {
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
  }, [isOpen]);

  const regSchedule = evaluateEventRegistration(event, siteSettings);

  // Reset or initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Validate that existing registration strictly matches the active user
      if (auth && existingRegistration) {
        if (user) {
          const matchesUser =
            (existingRegistration.user_id && existingRegistration.user_id === user.id) ||
            (user.email && existingRegistration.email?.toLowerCase() === user.email.toLowerCase());
          setConfirmedReg(matchesUser ? existingRegistration : null);
        } else {
          // If logged out inside app, do not display someone else's attendee pass
          setConfirmedReg(null);
        }
      } else {
        // Fallback for isolated unit tests without an AuthProvider
        setConfirmedReg(existingRegistration || null);
      }

      setFullName(profile?.full_name || '');
      setEmail(user?.email || profile?.email || '');
      setPhone('');
      setStudentId('');
      setQuestions('');
      setErrorMessage(null);
      setCopiedCode(false);
      setCopiedBank(false);
      setAmbassadorInput('');
      setAppliedAmbassadorCode(null);
      setDiscountPercent(0);
      setAmbassadorMessage(null);
      setTransactionId('');
      setPaymentFile(null);
      setPaymentPreview(null);
      setCompressionStats(null);
      setIsViewingReceiptLightbox(false);
    }
  }, [isOpen, event?.id, existingRegistration, user, profile]);

  if (!isOpen || !event) return null;

  // Pricing calculations
  const isPaidEvent = Boolean(event.is_paid && event.registration_fee && event.registration_fee > 0);
  const originalFee = isPaidEvent ? Number(event.registration_fee) : 0;
  const discountAmount = appliedAmbassadorCode ? Math.round((originalFee * discountPercent) / 100) : 0;
  const finalFee = Math.max(0, originalFee - discountAmount);
  const isFeeWaived = isPaidEvent && finalFee === 0;

  // Account details (admin configurable)
  const bankName = event.bank_name || 'Easypaisa';
  const accountTitle = event.account_title || 'Waqar Younas';
  const accountNumber = event.account_number || '03179752692';

  // Support & Helpline details (admin configurable)
  const supportPhone = event.support_phone || '0317-9752692 (Waqar Younas)';
  const supportEmail = event.support_email || 'signsmc.official@gmail.com';
  const supportInstructions =
    event.support_instructions ||
    'If you face any issues while transferring the registration fee, deduction errors, or bank delays, please contact our Chapter Finance Officer or official channels for immediate assistance:';

  // Dynamic WhatsApp link from support phone
  const cleanPhoneDigits = supportPhone.replace(/[^0-9]/g, '');
  const whatsAppUrl = cleanPhoneDigits
    ? cleanPhoneDigits.startsWith('0')
      ? `https://wa.me/92${cleanPhoneDigits.slice(1)}`
      : cleanPhoneDigits.startsWith('92')
      ? `https://wa.me/${cleanPhoneDigits}`
      : `https://wa.me/${cleanPhoneDigits}`
    : 'https://wa.me/923179752692';

  // Slots & Capacity (admin configurable)
  const maxSlots = event.max_attendees ? Number(event.max_attendees) : null;
  const [totalRegistered, setTotalRegistered] = useState<number>(0);

  useEffect(() => {
    if (!event?.id) return;
    try {
      const stored = localStorage.getItem('sign_event_registrations');
      const existing: EventRegistration[] = stored ? JSON.parse(stored) : [];
      const count = existing.filter((r) => r.event_id === event.id).length;
      setTotalRegistered(count);
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .then(({ count }) => {
          if (typeof count === 'number') {
            setTotalRegistered(count);
          }
        });
    }
  }, [event?.id, isOpen]);

  const isSlotsFull = Boolean(maxSlots && totalRegistered >= maxSlots);
  const remainingSlots = maxSlots ? Math.max(0, maxSlots - totalRegistered) : null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyBank = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // Build Google Calendar Add Link
  const getGoogleCalendarUrl = () => {
    if (!event) return '#';
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
      `${event.description}\n\nVenue: ${event.venue}\nOrganized by: ${event.organizer}`
    );
    const location = encodeURIComponent(event.venue);

    const dateClean = event.event_date.replace(/-/g, '');
    const startTimeClean = (event.start_time?.slice(0, 5) || '10:00').replace(':', '') + '00';
    const endTimeClean = (event.end_time?.slice(0, 5) || '12:00').replace(':', '') + '00';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dateClean}T${startTimeClean}/${dateClean}T${endTimeClean}`;
  };

  // Validate and apply ambassador discount code
  const handleApplyAmbassadorCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAmbassadorMessage(null);

    const raw = ambassadorInput.trim();
    if (!raw) {
      setAmbassadorMessage({ type: 'error', text: 'Please enter an ambassador or member code.' });
      return;
    }

    const cleanInput = raw.toUpperCase();
    const allowedCodes = (event.ambassador_code || 'AMBASSADOR')
      .split(/[,;\s]+/)
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    // If allowedCodes is empty, default to AMBASSADOR
    if (allowedCodes.length === 0) {
      allowedCodes.push('AMBASSADOR');
    }

    if (allowedCodes.includes(cleanInput)) {
      const pct = Number(event.ambassador_discount_percent ?? 20);
      setDiscountPercent(pct);
      setAppliedAmbassadorCode(cleanInput);
      const saved = Math.round((originalFee * pct) / 100);
      setAmbassadorMessage({
        type: 'success',
        text: `✓ Code applied! ${pct}% discount (Saves PKR ${saved}).`,
      });
    } else {
      setAmbassadorMessage({
        type: 'error',
        text: 'Invalid ambassador or member code. Please verify with your campus ambassador or executive team.',
      });
    }
  };

  const handleRemoveAmbassadorCode = () => {
    setAppliedAmbassadorCode(null);
    setDiscountPercent(0);
    setAmbassadorInput('');
    setAmbassadorMessage(null);
  };

  // Payment proof image compression and handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid screenshot image (PNG, JPG, WebP) or PDF.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File exceeds 15MB limit. Please choose a smaller photo.');
      return;
    }

    setIsCompressing(true);
    setErrorMessage(null);

    try {
      const result = await compressPaymentReceipt(file);
      setPaymentFile(result.file);
      setPaymentPreview(result.previewUrl);
      setCompressionStats(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error optimizing payment screenshot';
      setErrorMessage(msg);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!existingRegistration && !regSchedule.canRegister) {
      setErrorMessage(regSchedule.message);
      return;
    }

    if (isSlotsFull) {
      setErrorMessage(
        `Registration is closed as all ${maxSlots} slots for this event have been filled.`
      );
      return;
    }

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Please fill in your Name, Email, and WhatsApp contact number.');
      return;
    }

    // If event is paid and fee is greater than 0, transaction ID and payment proof are mandatory
    if (isPaidEvent && finalFee > 0) {
      if (!transactionId.trim()) {
        setErrorMessage(
          'Please enter your Transaction ID or Bank Reference Number for payment verification.'
        );
        return;
      }
      if (!paymentFile && !paymentPreview) {
        setErrorMessage(
          `Please upload proof of your event fee payment (PKR ${finalFee}) before confirming registration.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    const regCode = `SMC-REG-${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let uploadedReceiptUrl: string | null = paymentPreview;

    try {
      // If we have a file and Supabase is connected, upload to storage
      if (paymentFile && isSupabaseConfigured) {
        try {
          const fileExt = paymentFile.name.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `event_reg_${event.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `event-receipts/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('applicant-documents')
            .upload(filePath, paymentFile, {
              upsert: true,
              contentType: paymentFile.type || 'image/jpeg',
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('applicant-documents')
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              uploadedReceiptUrl = publicUrlData.publicUrl;
            }
          } else {
            console.warn('[SIGN Event Payment] Supabase storage upload notice:', uploadError.message);
          }
        } catch (uploadErr) {
          console.warn('[SIGN Event Payment] Receipt upload error:', uploadErr);
        }
      }

      const newRegistration: EventRegistration = {
        id: `reg-${Date.now()}`,
        event_id: event.id,
        user_id: user?.id || null,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        college_name: collegeName.trim(),
        mbbs_year: mbbsYear,
        student_id: studentId.trim() || null,
        questions_or_notes: questions.trim() || null,
        attendance_status: 'registered',
        registration_code: regCode,
        created_at: new Date().toISOString(),
        event_title: event.title,
        event_date: event.event_date,

        // Payment details
        is_paid: isPaidEvent,
        fee_amount: originalFee,
        amount_paid: finalFee,
        ambassador_code: appliedAmbassadorCode,
        discount_applied: discountAmount,
        payment_proof_url: uploadedReceiptUrl,
        payment_status: isPaidEvent && finalFee > 0 ? 'pending' : 'free',
        transaction_id: transactionId.trim() || null,
      };

      // 1. Save to local storage cache
      try {
        const stored = localStorage.getItem('sign_event_registrations');
        const existing: EventRegistration[] = stored ? JSON.parse(stored) : [];
        const alreadyRegistered = existing.some(
          (r) => r.event_id === event.id && r.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (alreadyRegistered) {
          setErrorMessage('You have already registered for this event with this email address.');
          setIsSubmitting(false);
          return;
        }
        localStorage.setItem(
          'sign_event_registrations',
          JSON.stringify([newRegistration, ...existing])
        );
      } catch {
        // ignore
      }

      // 2. Persist to Supabase if configured and event has valid UUID
      if (isSupabaseConfigured) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.id);

        if (isUuid) {
          const insertPayload: Record<string, unknown> = {
            event_id: event.id,
            user_id: user?.id || null,
            full_name: newRegistration.full_name,
            email: newRegistration.email,
            phone: newRegistration.phone,
            college_name: newRegistration.college_name,
            mbbs_year: newRegistration.mbbs_year,
            student_id: newRegistration.student_id,
            questions_or_notes: newRegistration.questions_or_notes,
            attendance_status: 'registered',
            registration_code: regCode,
            is_paid: newRegistration.is_paid,
            fee_amount: newRegistration.fee_amount,
            amount_paid: newRegistration.amount_paid,
            ambassador_code: newRegistration.ambassador_code,
            discount_applied: newRegistration.discount_applied,
            payment_proof_url: newRegistration.payment_proof_url,
            payment_status: newRegistration.payment_status,
            transaction_id: newRegistration.transaction_id,
          };

          const { data, error } = await supabase
            .from('event_registrations')
            .insert(insertPayload)
            .select()
            .single();

          if (error) {
            if (error.code === '23505') {
              setErrorMessage('You are already registered for this event with this email.');
              setIsSubmitting(false);
              return;
            }
            // If column missing due to pending migration, retry without payment columns
            if (error.code === '42703' || error.message?.includes('is_paid')) {
              const fallbackPayload = {
                event_id: event.id,
                user_id: user?.id || null,
                full_name: newRegistration.full_name,
                email: newRegistration.email,
                phone: newRegistration.phone,
                college_name: newRegistration.college_name,
                mbbs_year: newRegistration.mbbs_year,
                student_id: newRegistration.student_id,
                questions_or_notes: newRegistration.questions_or_notes,
                attendance_status: 'registered',
                registration_code: regCode,
              };
              const { data: fallbackData, error: fallbackError } = await supabase
                .from('event_registrations')
                .insert(fallbackPayload)
                .select()
                .single();
              if (!fallbackError && fallbackData) {
                newRegistration.id = fallbackData.id;
              }
            } else {
              console.warn('[SIGN Event Reg] Supabase insert warning:', error.message);
            }
          } else if (data) {
            newRegistration.id = data.id;
          }
        }
      }

      setConfirmedReg(newRegistration);
      if (onRegistrationSuccess) {
        onRegistrationSuccess(newRegistration);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl text-slate-200 text-xs flex flex-col">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 mb-1.5">
              <Ticket className="w-3 h-3 text-emerald-400" />
              <span>{confirmedReg ? 'Attendee Pass & Receipt' : 'Event Registration'}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug">
              {event.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Confirmed State (Digital Attendee Pass) */}
          {confirmedReg ? (
            <div className="space-y-5 animate-in zoom-in-95 duration-200 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div>
                <h4 className="text-xl font-black text-white">
                  {existingRegistration ? 'Your Event Registration' : 'Registration Confirmed!'}
                </h4>
                <p className="text-slate-400 text-xs mt-1">
                  {existingRegistration
                    ? 'You are registered for this session. Here are your attendee pass and session details.'
                    : 'You are officially registered for this academic session.'}
                </p>
              </div>

              {/* Digital Pass Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 text-left space-y-4 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    SIGN SMC • Attendee Pass
                  </span>
                  <div className="flex items-center gap-1.5">
                    {confirmedReg.is_paid ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          confirmedReg.payment_status === 'verified'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                            : 'bg-amber-950/70 text-amber-300 border border-amber-700/50'
                        }`}
                      >
                        {confirmedReg.payment_status === 'verified' ? 'Payment Verified' : 'Payment Pending Verification'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                        Free Registration
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Attendee</span>
                  <span className="text-sm font-bold text-white">{confirmedReg.full_name}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {confirmedReg.mbbs_year} • {confirmedReg.college_name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] py-2 border-y border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block">Date & Time</span>
                    <span className="text-slate-200 font-semibold">{event.event_date}</span>
                    <span className="text-slate-400 block text-[10px]">
                      {event.start_time?.slice(0, 5) || '10:00'} - {event.end_time?.slice(0, 5) || '12:00'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Venue</span>
                    <span className="text-slate-200 font-semibold truncate block" title={event.venue}>
                      {event.venue}
                    </span>
                    <span className="text-slate-400 block text-[10px]">
                      {event.is_virtual ? 'Virtual Session' : 'In-Person Session'}
                    </span>
                  </div>
                </div>

                {/* Pass Code */}
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase mb-1">
                    Registration Reference Code
                  </span>
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-emerald-300 font-bold text-xs">
                    <span>{confirmedReg.registration_code}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(confirmedReg.registration_code)}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy Pass Code"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Payment Breakdown on Pass if Paid */}
                {confirmedReg.is_paid && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Registration Fee:</span>
                      <span className="text-slate-200 font-semibold">
                        PKR {confirmedReg.amount_paid ?? confirmedReg.fee_amount ?? 0}
                      </span>
                    </div>

                    {confirmedReg.ambassador_code && (
                      <div className="flex items-center justify-between text-emerald-400">
                        <span className="inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Ambassador / Member Code ({confirmedReg.ambassador_code}):
                        </span>
                        <span>-PKR {confirmedReg.discount_applied || 0}</span>
                      </div>
                    )}

                    {confirmedReg.transaction_id && (
                      <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60 font-mono text-[10px]">
                        <span>Transaction ID:</span>
                        <span className="text-teal-300 font-bold">{confirmedReg.transaction_id}</span>
                      </div>
                    )}

                    {confirmedReg.payment_proof_url && (
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                        <span className="text-slate-400">Payment Proof Receipt:</span>
                        <button
                          type="button"
                          onClick={() => setIsViewingReceiptLightbox(true)}
                          className="inline-flex items-center gap-1 text-teal-300 hover:text-teal-200 font-bold text-[11px] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Detailed Registration Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Your Registration Info
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/60">
                    Status: {confirmedReg.attendance_status === 'attended' ? 'Attended' : 'Registered'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Email Address</span>
                    <span className="text-slate-200 font-medium truncate block">{confirmedReg.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">WhatsApp / Phone</span>
                    <span className="text-slate-200 font-medium">{confirmedReg.phone}</span>
                  </div>
                  {confirmedReg.student_id && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">College Roll No / Student ID</span>
                      <span className="text-slate-200 font-medium">{confirmedReg.student_id}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 block text-[10px]">Registered On</span>
                    <span className="text-slate-200 font-medium">
                      {new Date(confirmedReg.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {confirmedReg.questions_or_notes && (
                  <div className="pt-2 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-500 block text-[10px]">Submitted Questions / Topics:</span>
                    <p className="text-slate-300 italic mt-0.5">"{confirmedReg.questions_or_notes}"</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer text-xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add to Calendar</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all cursor-pointer text-xs shadow-md shadow-emerald-950/40"
                >
                  Close & Done
                </button>
              </div>
            </div>
          ) : (
            /* Registration Input Form */
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Event Quick Overview Pill */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{event.event_date}</span>
                    </div>
                    {event.start_time && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span>{event.start_time.slice(0, 5)}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing & Slots Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {maxSlots !== null && maxSlots > 0 && (
                      <span className="text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5 font-mono text-[11px] font-bold">
                        <Users className="w-3 h-3 text-cyan-400" />
                        <span>
                          {isSlotsFull ? (
                            <span className="text-rose-400 font-semibold">0 / {maxSlots} Slots Left</span>
                          ) : (
                            <span>{remainingSlots} / {maxSlots} Slots Left</span>
                          )}
                        </span>
                      </span>
                    )}

                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                      {isPaidEvent ? (
                        <span className="text-amber-300 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                          <CreditCard className="w-3 h-3" />
                          PKR {event.registration_fee}
                        </span>
                      ) : (
                        <span className="text-emerald-300 bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                          Free Registration
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                  {event.is_virtual ? (
                    <Video className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate">{event.venue}</span>
                </div>
              </div>

              {/* Event Registration Closed Notice */}
              {!regSchedule.canRegister && (
                <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <strong className="block text-white font-semibold">Event Registration Closed</strong>
                    <span className="text-[11px] text-amber-300/90">
                      {regSchedule.message}
                    </span>
                  </div>
                </div>
              )}

              {/* Slots Full Notice */}
              {isSlotsFull && (
                <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <strong className="block text-white font-semibold">Registration Capacity Reached</strong>
                    <span className="text-[11px] text-amber-300/90">
                      All {maxSlots} attendee slots for this event have been filled. Registrations are currently closed.
                    </span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Muhammad Ahmad / Ayesha Khan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    WhatsApp / Phone <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* College & Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    College / Institution
                  </label>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="Saidu Medical College, Swat"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Academic Year / Program
                  </label>
                  <select
                    value={mbbsYear}
                    onChange={(e) => setMbbsYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500"
                  >
                    <option value="MBBS - 1st Year">MBBS - 1st Year</option>
                    <option value="MBBS - 2nd Year">MBBS - 2nd Year</option>
                    <option value="MBBS - 3rd Year">MBBS - 3rd Year</option>
                    <option value="MBBS - 4th Year">MBBS - 4th Year</option>
                    <option value="Final Year MBBS">Final Year MBBS</option>
                    <option value="BDS Student">BDS Student</option>
                    <option value="House Officer / Intern">House Officer / Intern</option>
                    <option value="Medical Officer / Resident">Medical Officer / Resident</option>
                  </select>
                </div>
              </div>

              {/* Roll No / ID */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  College Roll No / Student ID (Optional)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. SMC-2024-042"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500"
                />
              </div>

              {/* Questions / Topic of Interest */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Questions or Topics for the Speakers (Optional)
                </label>
                <textarea
                  rows={2}
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  placeholder="Any particular clinical case scenario or clinical question you'd like discussed?"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500"
                />
              </div>

              {/* ========================================================= */}
              {/* PAID EVENT PAYMENT SECTION & AMBASSADOR DISCOUNT CODE     */}
              {/* ========================================================= */}
              {isPaidEvent && (
                <div className="pt-2 border-t border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Registration Fee & Payment Details</span>
                  </div>

                  {/* Fee Breakdown & Ambassador Code Input */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/80">
                      <span className="text-slate-400">Standard Registration Fee:</span>
                      <span className="text-white font-bold font-mono text-sm">
                        PKR {originalFee}
                      </span>
                    </div>

                    {/* Ambassador / Member Code Input */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-teal-400" />
                          Ambassador / Member Code
                        </span>
                        {appliedAmbassadorCode && (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-700/50 px-2 py-0.5 rounded">
                            {discountPercent}% OFF APPLIED
                          </span>
                        )}
                      </label>

                      {appliedAmbassadorCode ? (
                        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-emerald-400" />
                            <span className="font-mono font-bold">{appliedAmbassadorCode}</span>
                            <span className="text-[11px] text-emerald-400">
                              (-PKR {discountAmount})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveAmbassadorCode}
                            className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded hover:bg-rose-950/30 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={ambassadorInput}
                            onChange={(e) => {
                              setAmbassadorInput(e.target.value);
                              if (ambassadorMessage) setAmbassadorMessage(null);
                            }}
                            placeholder="Enter Ambassador / Member Code (e.g. AMBASSADOR, SMC2026)"
                            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-teal-500 uppercase tracking-wider font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyAmbassadorCode()}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-colors cursor-pointer shrink-0"
                          >
                            Apply
                          </button>
                        </div>
                      )}

                      {ambassadorMessage && (
                        <p
                          className={`text-[11px] font-medium ${
                            ambassadorMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {ambassadorMessage.text}
                        </p>
                      )}
                    </div>

                    {/* Payable Total */}
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
                      <span className="text-slate-300 font-semibold">Total Payable Amount:</span>
                      <div className="text-right">
                        <span className="text-emerald-400 font-extrabold text-base font-mono">
                          PKR {finalFee}
                        </span>
                        {isFeeWaived && (
                          <span className="block text-[10px] text-emerald-400 font-semibold">
                            ✓ 100% Fee Waived via Ambassador / Member Code!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bank Details & Proof Upload if Fee > 0 */}
                  {finalFee > 0 && (
                    <>
                      {/* Bank / Wallet Account Card */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-950 to-teal-950/60 border border-emerald-500/30 space-y-2.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                            <span>{bankName} Payment Details</span>
                          </div>
                          <span className="text-[10px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/50">
                            Pay: PKR {finalFee}
                          </span>
                        </div>

                        <div className="text-[11.5px] space-y-1 text-slate-300">
                          <div>
                            <span className="text-slate-400">Account Title: </span>
                            <strong className="text-white font-semibold">{accountTitle}</strong>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <div>
                              <span className="text-slate-400">Account / Mobile Number: </span>
                              <span className="font-mono font-bold text-emerald-300 text-xs">
                                {accountNumber}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleCopyBank}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold hover:bg-emerald-900 transition-colors cursor-pointer"
                              title="Copy Account Number"
                            >
                              {copiedBank ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <p className="text-[10.5px] text-slate-400 pt-1 border-t border-emerald-900/40 italic">
                          {event.payment_instructions ||
                            `Please transfer PKR ${finalFee} via ${bankName} to ${accountNumber} (${accountTitle}) and attach a screenshot of your successful transaction below. Ensure Transaction ID is clearly visible.`}
                        </p>
                      </div>

                      {/* Transaction Support / Issue Instructions (Configurable by admin) */}
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold text-amber-300">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Encountering a Transaction Error or Payment Issue?</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">
                          {supportInstructions}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                          {supportPhone && (
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-semibold transition-colors bg-emerald-950/70 hover:bg-emerald-900/80 px-2.5 py-1.5 rounded-lg border border-emerald-700/50"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>WhatsApp: {supportPhone}</span>
                            </a>
                          )}
                          {supportEmail && (
                            <a
                              href={`mailto:${supportEmail}`}
                              className="inline-flex items-center gap-1.5 text-teal-300 hover:text-teal-200 font-semibold transition-colors bg-teal-950/70 hover:bg-teal-900/80 px-2.5 py-1.5 rounded-lg border border-teal-700/50"
                            >
                              <Mail className="w-3.5 h-3.5 text-teal-400" />
                              <span>{supportEmail}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Transaction ID Input (Mandatory reference) */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-300 font-semibold text-[11px] flex items-center gap-1.5">
                          <span>Transaction ID / Ref Number</span>
                          <span className="text-rose-400 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. TRX-9823487192 / Easypaisa TID"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:border-teal-500 transition-colors"
                        />
                      </div>

                      {/* Upload Payment Screenshot Dropzone */}
                      <div className="space-y-2">
                        <label className="block text-slate-300 font-semibold text-[11px] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                            Upload Payment Proof Screenshot <span className="text-rose-400">*</span>
                          </span>
                          <span className="text-[10px] text-slate-500">Auto-compressed</span>
                        </label>

                        {isCompressing ? (
                          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-5 flex flex-col items-center justify-center gap-2 text-center">
                            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                            <span className="text-xs font-bold text-white">
                              Optimizing payment screenshot...
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Compressing image to save storage and bandwidth while keeping transaction details sharp.
                            </span>
                          </div>
                        ) : paymentPreview ? (
                          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={paymentPreview}
                                  alt="Payment Proof Receipt"
                                  className="w-14 h-14 rounded-lg object-cover border border-emerald-500/40 shadow-xs shrink-0 bg-slate-900"
                                />
                                <div className="min-w-0 text-xs">
                                  <span className="font-bold text-white block truncate">
                                    {paymentFile?.name || 'Payment Receipt Screenshot'}
                                  </span>
                                  <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                                    ✓ Payment proof attached
                                  </span>
                                  {paymentFile && (
                                    <span className="text-[10px] text-slate-400 font-mono block">
                                      Size: {formatBytes(paymentFile.size)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentFile(null);
                                  setPaymentPreview(null);
                                  setCompressionStats(null);
                                }}
                                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 transition-colors shrink-0"
                              >
                                Remove
                              </button>
                            </div>

                            {compressionStats && compressionStats.savedPercentage > 0 && (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-[11px]">
                                <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>
                                  Compressed: <strong>{formatBytes(compressionStats.originalSize)}</strong> &rarr;{' '}
                                  <strong>{formatBytes(compressionStats.compressedSize)}</strong> ({compressionStats.savedPercentage}% smaller)
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <label className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-emerald-400 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-emerald-950/20 transition-all text-center">
                              <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/50">
                                <Upload className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-bold text-slate-200">
                                Click to select payment receipt screenshot
                              </span>
                              <span className="text-[10px] text-slate-400">
                                PNG, JPG, or WebP up to 15MB (automatically optimized)
                              </span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isSlotsFull || !regSchedule.canRegister}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all cursor-pointer shadow-md shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : isSlotsFull ? (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Slots Full (Closed)</span>
                    </>
                  ) : !regSchedule.canRegister ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{regSchedule.buttonText}</span>
                    </>
                  ) : (
                    <>
                      {isPaidEvent && finalFee > 0 ? (
                        <>
                          <FileCheck className="w-4 h-4" />
                          <span>Submit Registration & Payment</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-4 h-4" />
                          <span>Confirm Registration</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Viewing Uploaded Receipt */}
      {isViewingReceiptLightbox && confirmedReg?.payment_proof_url && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-xs">Payment Receipt Proof</span>
              <button
                type="button"
                onClick={() => setIsViewingReceiptLightbox(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center rounded-xl bg-slate-950 p-2">
              <img
                src={confirmedReg.payment_proof_url}
                alt="Receipt Full Preview"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Attendee: {confirmedReg.full_name}</span>
              <a
                href={confirmedReg.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>Open original</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
