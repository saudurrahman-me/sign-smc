import React, { useState, useEffect } from 'react';
import { useOptionalAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { EventItem, EventRegistration } from '../../types/database.types';
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedReg, setConfirmedReg] = useState<EventRegistration | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync profile details when available
  useEffect(() => {
    if (profile?.full_name && !fullName) {
      setFullName(profile.full_name);
    }
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [profile, user]);

  // Reset or initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmedReg(existingRegistration || null);
      setErrorMessage(null);
      setCopiedCode(false);
    }
  }, [isOpen, event?.id, existingRegistration]);

  if (!isOpen || !event) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Build Google Calendar Add Link
  const getGoogleCalendarUrl = () => {
    if (!event) return '#';
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
      `${event.description}\n\nVenue: ${event.venue}\nOrganized by: ${event.organizer}`
    );
    const location = encodeURIComponent(event.venue);

    // Format dates YYYYMMDDTHHmmssZ
    const dateClean = event.event_date.replace(/-/g, '');
    const startTimeClean = (event.start_time?.slice(0, 5) || '10:00').replace(':', '') + '00';
    const endTimeClean = (event.end_time?.slice(0, 5) || '12:00').replace(':', '') + '00';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dateClean}T${startTimeClean}/${dateClean}T${endTimeClean}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Please fill in your Name, Email, and WhatsApp contact number.');
      return;
    }

    setIsSubmitting(true);

    const regCode = `SMC-REG-${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

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
    };

    try {
      // 1. Save to local storage cache
      try {
        const stored = localStorage.getItem('sign_event_registrations');
        const existing: EventRegistration[] = stored ? JSON.parse(stored) : [];
        // Check if already registered in local storage
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
          const { data, error } = await supabase
            .from('event_registrations')
            .insert({
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
            })
            .select()
            .single();

          if (error) {
            if (error.code === '23505') {
              setErrorMessage('You are already registered for this event with this email.');
              setIsSubmitting(false);
              return;
            }
            console.warn('[SIGN Event Reg] Supabase insert warning:', error.message);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl text-slate-200 text-xs flex flex-col">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 mb-1.5">
              <Ticket className="w-3 h-3 text-emerald-400" />
              <span>{confirmedReg ? 'Attendee Pass & Details' : 'Event Registration'}</span>
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
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                    Confirmed
                  </span>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event Quick Overview Pill */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-4 text-[11px] text-slate-300">
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
                  <div className="flex items-center gap-1.5 truncate">
                    {event.is_virtual ? (
                      <Video className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>
              </div>

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

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
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
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all cursor-pointer shadow-md shadow-emerald-950/40 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>Confirm Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
