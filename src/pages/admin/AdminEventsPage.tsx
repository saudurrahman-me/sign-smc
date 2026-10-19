import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type {
  EventItem,
  EventCategory,
  EventRegistration,
  AttendanceStatus,
  PaymentStatus,
} from '../../types/database.types';
import { useAuth } from '../../context/AuthContext';
import { compressPaymentReceipt } from '../../lib/image-compressor';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Video,
  MapPin,
  Search,
  Filter,
  AlertCircle,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Link as LinkIcon,
  Users,
  Download,
  Mail,
  Phone,
  ExternalLink,
  Check,
  Ticket,
  Clock,
  CreditCard,
  Tag,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { APP_VERSION } from '../../config/version';

export const AdminEventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Attendees & Registration Management State
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<EventItem | null>(null);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [attendees, setAttendees] = useState<EventRegistration[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('');
  const [attendeeStatusFilter, setAttendeeStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [attendeePaymentFilter, setAttendeePaymentFilter] = useState<'all' | 'free' | 'pending' | 'verified'>('all');
  const [selectedReceiptReg, setSelectedReceiptReg] = useState<EventRegistration | null>(null);
  const [copiedEmailsFeedback, setCopiedEmailsFeedback] = useState(false);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Seminars & Guest Lectures');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('Saidu Medical College Auditorium');
  const [isVirtual, setIsVirtual] = useState(false);
  const [organizer, setOrganizer] = useState('SIGN SMC Chapter');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment & Pricing Settings
  const [isPaid, setIsPaid] = useState(false);
  const [registrationFee, setRegistrationFee] = useState<number | string>(500);
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [bankName, setBankName] = useState('Easypaisa');
  const [accountTitle, setAccountTitle] = useState('Waqar Younas');
  const [accountNumber, setAccountNumber] = useState('03179752692');
  const [ambassadorCode, setAmbassadorCode] = useState('AMBASSADOR');
  const [ambassadorDiscountPercent, setAmbassadorDiscountPercent] = useState<number | string>(20);
  const [maxAttendees, setMaxAttendees] = useState<number | string>('');
  const [supportPhone, setSupportPhone] = useState('0317-9752692 (Waqar Younas)');
  const [supportEmail, setSupportEmail] = useState('signsmc.official@gmail.com');
  const [supportInstructions, setSupportInstructions] = useState(
    'If you face any issues while transferring the registration fee, deduction errors, or bank delays, please contact our Chapter Finance Officer or official channels for immediate assistance:'
  );

  const [registrationUrl, setRegistrationUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const categories: EventCategory[] = [
    'Seminars & Guest Lectures',
    'Case Discussions',
    'Journal Clubs',
    'Research Workshops',
    'Neurological Awareness Campaigns',
    'Academic Activities',
  ];

  const DEMO_EVENTS: EventItem[] = [
    {
      id: 'demo-evt-1',
      title: 'Clinical Neuroscience Symposium 2026',
      description: 'An academic conference focused on modern stroke management, neuroimaging breakthroughs, and clinical neuroscience education.',
      category: 'Seminars & Guest Lectures',
      event_date: '2026-11-15',
      start_time: '10:00 AM',
      end_time: '01:00 PM',
      venue: 'Saidu Medical College Main Auditorium',
      is_virtual: false,
      organizer: 'SIGN SMC Chapter',
      cover_image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
      registration_url: null,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      is_paid: false,
      registration_fee: 0,
    },
    {
      id: 'demo-evt-2',
      title: 'Neuro-Anatomy & Stroke Localization Case Discussion',
      description: 'Interactive clinicopathological case discussion on acute ischemic stroke localization and thrombolytic decision-making.',
      category: 'Case Discussions',
      event_date: '2026-11-28',
      start_time: '02:00 PM',
      end_time: '04:00 PM',
      venue: 'SGTH Department of Neurology Conference Room',
      is_virtual: false,
      organizer: 'SIGN Academic Board',
      cover_image_url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800',
      registration_url: null,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      is_paid: true,
      registration_fee: 500,
      bank_name: 'Easypaisa',
      account_title: 'Waqar Younas',
      account_number: '03179752692',
      ambassador_code: 'AMBASSADOR',
      ambassador_discount_percent: 20,
      payment_instructions: 'Please transfer fee via Easypaisa and ensure Transaction ID is visible on screenshot.',
    },
  ];

  const isDevSession = !isSupabaseConfigured || Boolean(user?.id?.startsWith('dev-'));

  const fetchEvents = async () => {
    setIsLoading(true);
    if (isDevSession) {
      try {
        const stored = sessionStorage.getItem('sign_dev_events');
        if (stored) {
          setEvents(JSON.parse(stored));
          setIsLoading(false);
          return;
        }
      } catch {
        // ignore
      }
    }

    if (!isSupabaseConfigured) {
      setEvents(DEMO_EVENTS);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) {
        console.error('[SIGN Admin Events] Error:', error.message);
      } else if (data) {
        setEvents(data as EventItem[]);
      }
    } catch (err) {
      console.error('[SIGN Admin Events] Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendeeCounts = async () => {
    const counts: Record<string, number> = {};
    try {
      const localStored = localStorage.getItem('sign_event_registrations');
      if (localStored) {
        const parsed: EventRegistration[] = JSON.parse(localStored);
        parsed.forEach((r) => {
          if (r.event_id) {
            counts[r.event_id] = (counts[r.event_id] || 0) + 1;
          }
        });
      }
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('event_registrations')
          .select('event_id, attendance_status');

        if (!error && data) {
          const dbCounts: Record<string, number> = {};
          data.forEach((r: { event_id: string; attendance_status: string }) => {
            if (r.event_id) {
              dbCounts[r.event_id] = (dbCounts[r.event_id] || 0) + 1;
            }
          });
          setAttendeeCounts((prev) => ({ ...prev, ...dbCounts }));
          return;
        }
      } catch {
        // Table may not exist yet if migration pending
      }
    }
    setAttendeeCounts(counts);
  };

  useEffect(() => {
    fetchEvents();
    fetchAttendeeCounts();
  }, [user]);

  const openAttendeesModal = async (ev: EventItem | null) => {
    setSelectedEventForAttendees(ev);
    setIsAttendeesModalOpen(true);
    setAttendeeSearchQuery('');
    setAttendeeStatusFilter('all');
    setAttendeePaymentFilter('all');
    setSelectedReceiptReg(null);
    setIsLoadingAttendees(true);

    let list: EventRegistration[] = [];
    try {
      const stored = localStorage.getItem('sign_event_registrations');
      if (stored) {
        const parsed: EventRegistration[] = JSON.parse(stored);
        list = ev ? parsed.filter((r) => r.event_id === ev.id) : parsed;
      }
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('event_registrations')
          .select('*, events(title, event_date)')
          .order('created_at', { ascending: false });

        if (ev && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ev.id)) {
          query = query.eq('event_id', ev.id);
        }

        const { data, error } = await query;
        if (!error && data) {
          const dbMapped: EventRegistration[] = data.map((d: any) => ({
            ...d,
            event_title: d.events?.title || d.event_title,
            event_date: d.events?.event_date || d.event_date,
          }));

          const seenCodes = new Set(dbMapped.map((r) => r.registration_code || r.id));
          const localOnly = list.filter((r) => !seenCodes.has(r.registration_code || r.id));
          list = [...dbMapped, ...localOnly];
        }
      } catch (err) {
        console.warn('[SIGN Admin] Supabase event_registrations query error:', err);
      }
    }

    setAttendees(list);
    setIsLoadingAttendees(false);
  };

  const handleUpdateAttendanceStatus = async (regId: string, newStatus: AttendanceStatus) => {
    setIsUpdatingStatusId(regId);
    try {
      setAttendees((prev) =>
        prev.map((a) => (a.id === regId ? { ...a, attendance_status: newStatus } : a))
      );

      try {
        const stored = localStorage.getItem('sign_event_registrations');
        if (stored) {
          const parsed: EventRegistration[] = JSON.parse(stored);
          const updated = parsed.map((a) =>
            a.id === regId ? { ...a, attendance_status: newStatus } : a
          );
          localStorage.setItem('sign_event_registrations', JSON.stringify(updated));
        }
      } catch {
        // ignore
      }

      if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(regId)) {
        await supabase
          .from('event_registrations')
          .update({ attendance_status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', regId);
      }

      fetchAttendeeCounts();
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  const handleUpdatePaymentStatus = async (regId: string, newStatus: PaymentStatus) => {
    setIsUpdatingStatusId(regId);
    try {
      setAttendees((prev) =>
        prev.map((a) => (a.id === regId ? { ...a, payment_status: newStatus } : a))
      );

      if (selectedReceiptReg && selectedReceiptReg.id === regId) {
        setSelectedReceiptReg((prev) => (prev ? { ...prev, payment_status: newStatus } : null));
      }

      try {
        const stored = localStorage.getItem('sign_event_registrations');
        if (stored) {
          const parsed: EventRegistration[] = JSON.parse(stored);
          const updated = parsed.map((a) =>
            a.id === regId ? { ...a, payment_status: newStatus } : a
          );
          localStorage.setItem('sign_event_registrations', JSON.stringify(updated));
        }
      } catch {
        // ignore
      }

      if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(regId)) {
        await supabase
          .from('event_registrations')
          .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', regId);
      }
    } catch (err) {
      console.warn('[SIGN Admin] Error updating payment status:', err);
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  const handleDeleteRegistration = async (regId: string) => {
    if (!window.confirm('Are you sure you want to remove this registration record?')) return;

    setAttendees((prev) => prev.filter((a) => a.id !== regId));
    if (selectedReceiptReg?.id === regId) {
      setSelectedReceiptReg(null);
    }

    try {
      const stored = localStorage.getItem('sign_event_registrations');
      if (stored) {
        const parsed: EventRegistration[] = JSON.parse(stored);
        const updated = parsed.filter((a) => a.id !== regId);
        localStorage.setItem('sign_event_registrations', JSON.stringify(updated));
      }
    } catch {
      // ignore
    }

    if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(regId)) {
      await supabase.from('event_registrations').delete().eq('id', regId);
    }

    fetchAttendeeCounts();
  };

  const filteredAttendees = attendees.filter((a) => {
    const matchesStatus =
      attendeeStatusFilter === 'all' || a.attendance_status === attendeeStatusFilter;

    let matchesPayment = true;
    if (attendeePaymentFilter === 'free') {
      matchesPayment = !a.is_paid || a.payment_status === 'free';
    } else if (attendeePaymentFilter === 'pending') {
      matchesPayment = Boolean(a.is_paid && a.payment_status === 'pending');
    } else if (attendeePaymentFilter === 'verified') {
      matchesPayment = Boolean(a.is_paid && a.payment_status === 'verified');
    }

    const q = attendeeSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      a.full_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      (a.registration_code && a.registration_code.toLowerCase().includes(q)) ||
      (a.student_id && a.student_id.toLowerCase().includes(q)) ||
      (a.college_name && a.college_name.toLowerCase().includes(q)) ||
      (a.ambassador_code && a.ambassador_code.toLowerCase().includes(q)) ||
      (a.transaction_id && a.transaction_id.toLowerCase().includes(q));

    return matchesStatus && matchesPayment && matchesSearch;
  });

  const copyAllAttendeeEmails = () => {
    const emails = filteredAttendees
      .map((a) => a.email.trim())
      .filter((e) => Boolean(e) && e.includes('@'));
    const unique = Array.from(new Set(emails));
    if (unique.length === 0) return;
    navigator.clipboard.writeText(unique.join(', '));
    setCopiedEmailsFeedback(true);
    setTimeout(() => setCopiedEmailsFeedback(false), 2500);
  };

  const exportAttendeesCsv = () => {
    if (filteredAttendees.length === 0) {
      alert('No attendees to export for current filter.');
      return;
    }

    const headers = [
      'Registration Code',
      'Attendee Name',
      'Email Address',
      'WhatsApp / Phone',
      'College / Institution',
      'MBBS Year / Academic Program',
      'Student ID / Roll No',
      'Attendance Status',
      'Fee Type',
      'Fee Amount (PKR)',
      'Amount Paid (PKR)',
      'Ambassador / Member Code',
      'Discount Applied (PKR)',
      'Payment Status',
      'Transaction ID',
      'Payment Proof URL',
      'Event Title',
      'Event Date',
      'Registered At',
      'Questions / Topics',
    ];

    const rows = filteredAttendees.map((a) => [
      `"${a.registration_code || ''}"`,
      `"${a.full_name.replace(/"/g, '""')}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${(a.college_name || '').replace(/"/g, '""')}"`,
      `"${a.mbbs_year || ''}"`,
      `"${a.student_id || ''}"`,
      `"${a.attendance_status}"`,
      `"${a.is_paid ? 'Paid' : 'Free'}"`,
      `"${a.fee_amount ?? 0}"`,
      `"${a.amount_paid ?? 0}"`,
      `"${a.ambassador_code || ''}"`,
      `"${a.discount_applied ?? 0}"`,
      `"${a.payment_status || (a.is_paid ? 'pending' : 'free')}"`,
      `"${a.transaction_id || ''}"`,
      `"${a.payment_proof_url || ''}"`,
      `"${(a.event_title || selectedEventForAttendees?.title || '').replace(/"/g, '""')}"`,
      `"${a.event_date || selectedEventForAttendees?.event_date || ''}"`,
      `"${new Date(a.created_at).toLocaleString()}"`,
      `"${(a.questions_or_notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const eventSlug = selectedEventForAttendees
      ? selectedEventForAttendees.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)
      : 'all-events';
    link.setAttribute('href', url);
    link.setAttribute('download', `sign-attendees-${eventSlug}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setCategory('Seminars & Guest Lectures');
    setEventDate(new Date().toISOString().split('T')[0]);
    setStartTime('10:00');
    setEndTime('12:00');
    setVenue('Saidu Medical College Auditorium');
    setIsVirtual(false);
    setOrganizer('SIGN SMC Chapter');
    setCoverImageUrl('');
    setImageUploadError(null);
    setShowUrlInput(false);
    setRegistrationUrl('');
    setIsPublished(false);

    // Reset payment fields
    setIsPaid(false);
    setRegistrationFee(500);
    setPaymentInstructions('');
    setBankName('Easypaisa');
    setAccountTitle('Waqar Younas');
    setAccountNumber('03179752692');
    setAmbassadorCode('AMBASSADOR');
    setAmbassadorDiscountPercent(20);
    setMaxAttendees('');
    setSupportPhone('0317-9752692 (Waqar Younas)');
    setSupportEmail('signsmc.official@gmail.com');
    setSupportInstructions(
      'If you face any issues while transferring the registration fee, deduction errors, or bank delays, please contact our Chapter Finance Officer or official channels for immediate assistance:'
    );

    setIsRegistrationOpen(true);
    setRegistrationDeadline('');

    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ev: EventItem) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDescription(ev.description);
    setCategory(ev.category);
    setEventDate(ev.event_date);
    setStartTime(ev.start_time?.slice(0, 5) || '');
    setEndTime(ev.end_time?.slice(0, 5) || '');
    setVenue(ev.venue);
    setIsVirtual(ev.is_virtual);
    setOrganizer(ev.organizer);
    setCoverImageUrl(ev.cover_image_url || '');
    setImageUploadError(null);
    setShowUrlInput(false);
    setRegistrationUrl(ev.registration_url || '');
    setIsPublished(ev.is_published);
    setIsRegistrationOpen(ev.is_registration_open ?? true);
    setRegistrationDeadline(ev.registration_deadline || '');

    // Initialize payment & support fields
    setIsPaid(Boolean(ev.is_paid));
    setRegistrationFee(ev.registration_fee ?? 500);
    setPaymentInstructions(ev.payment_instructions || '');
    setBankName(ev.bank_name || 'Easypaisa');
    setAccountTitle(ev.account_title || 'Waqar Younas');
    setAccountNumber(ev.account_number || '03179752692');
    setAmbassadorCode(ev.ambassador_code || 'AMBASSADOR');
    setAmbassadorDiscountPercent(ev.ambassador_discount_percent ?? 20);
    setMaxAttendees(ev.max_attendees ? String(ev.max_attendees) : '');
    setSupportPhone(ev.support_phone ?? '0317-9752692 (Waqar Younas)');
    setSupportEmail(ev.support_email ?? 'signsmc.official@gmail.com');
    setSupportInstructions(
      ev.support_instructions ??
        'If you face any issues while transferring the registration fee, deduction errors, or bank delays, please contact our Chapter Finance Officer or official channels for immediate assistance:'
    );

    setFormError(null);
    setIsModalOpen(true);
  };

  // Upload and optimize event banner
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setImageUploadError('Image exceeds 15MB limit. Please choose a smaller photo.');
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);

    try {
      const compressed = await compressPaymentReceipt(file, 1600, 900, 0.85);

      if (!isSupabaseConfigured || isDevSession) {
        setCoverImageUrl(compressed.previewUrl);
        return;
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-banners')
        .upload(filePath, compressed.file, {
          upsert: true,
          contentType: compressed.file.type || 'image/jpeg',
        });

      if (uploadError) {
        console.warn('[SIGN Events] Storage upload warning:', uploadError.message);
        setCoverImageUrl(compressed.previewUrl);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('event-banners')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setCoverImageUrl(publicUrlData.publicUrl);
      } else {
        setCoverImageUrl(compressed.previewUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setImageUploadError(msg);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !description.trim() || !eventDate || !venue.trim()) {
      setFormError('Please fill in all mandatory fields (Title, Description, Date, Venue).');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        category,
        event_date: eventDate,
        start_time: startTime || null,
        end_time: endTime || null,
        venue: venue.trim(),
        is_virtual: isVirtual,
        organizer: organizer.trim(),
        cover_image_url: coverImageUrl.trim() || null,
        registration_url: registrationUrl.trim() || null,
        is_published: isPublished,
        updated_at: new Date().toISOString(),

        // Pricing, Payment & Support Settings
        is_paid: isPaid,
        registration_fee: isPaid ? Number(registrationFee) || 0 : 0,
        payment_instructions: isPaid ? paymentInstructions.trim() || null : null,
        bank_name: isPaid ? bankName.trim() || 'Easypaisa' : null,
        account_title: isPaid ? accountTitle.trim() || 'Waqar Younas' : null,
        account_number: isPaid ? accountNumber.trim() || '03179752692' : null,
        ambassador_code: isPaid ? ambassadorCode.trim().toUpperCase() || 'AMBASSADOR' : null,
        ambassador_discount_percent: isPaid ? Number(ambassadorDiscountPercent) || 0 : 0,
        max_attendees: maxAttendees !== '' && Number(maxAttendees) > 0 ? Number(maxAttendees) : null,
        support_phone: supportPhone.trim() || null,
        support_email: supportEmail.trim() || null,
        support_instructions: supportInstructions.trim() || null,

        // Registration Status & Deadline Controls
        is_registration_open: isRegistrationOpen,
        registration_deadline: registrationDeadline ? registrationDeadline : null,
      };

      const basicPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        event_date: eventDate,
        start_time: startTime || null,
        end_time: endTime || null,
        venue: venue.trim(),
        is_virtual: isVirtual,
        organizer: organizer.trim(),
        cover_image_url: coverImageUrl.trim() || null,
        registration_url: registrationUrl.trim() || null,
        is_published: isPublished,
        max_attendees: maxAttendees !== '' && Number(maxAttendees) > 0 ? Number(maxAttendees) : null,
        updated_at: new Date().toISOString(),
      };

      const isMissingColumnError = (err: any): boolean => {
        if (!err) return false;
        const code = String(err.code || '');
        const message = String(err.message || '').toLowerCase();
        return (
          code === 'PGRST204' ||
          code === '42703' ||
          message.includes('schema cache') ||
          message.includes('column') ||
          message.includes('does not exist') ||
          message.includes('account_number') ||
          message.includes('account_title') ||
          message.includes('is_paid') ||
          message.includes('registration_fee') ||
          message.includes('bank_name') ||
          message.includes('ambassador') ||
          message.includes('payment_instructions') ||
          message.includes('max_attendees') ||
          message.includes('support_phone') ||
          message.includes('support_email') ||
          message.includes('support_instructions') ||
          message.includes('is_registration_open') ||
          message.includes('registration_deadline')
        );
      };

      if (isDevSession) {
        let updatedList: EventItem[];
        if (editingEvent) {
          updatedList = events.map((e) =>
            e.id === editingEvent.id
              ? ({ ...e, ...payload } as EventItem)
              : e
          );
        } else {
          const newEv: EventItem = {
            id: `dev-evt-${Date.now()}`,
            ...(payload as any),
            created_by: user?.id || null,
            created_at: new Date().toISOString(),
          };
          updatedList = [newEv, ...events];
        }
        setEvents(updatedList);
        try {
          sessionStorage.setItem('sign_dev_events', JSON.stringify(updatedList));
        } catch {
          // ignore
        }
        setIsModalOpen(false);
        return;
      }

      if (editingEvent) {
        let { data, error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEvent.id)
          .select();

        // Fallback if payment migration hasn't been executed on Supabase yet
        if (error && isMissingColumnError(error)) {
          const res = await supabase
            .from('events')
            .update(basicPayload)
            .eq('id', editingEvent.id)
            .select();
          data = res.data;
          error = res.error;
        }

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Database permission denied: Your admin account does not have update permissions on events in Supabase. Please verify your account role in profiles is website_admin, event_manager, or super_admin.');
        }
      } else {
        let { data, error } = await supabase
          .from('events')
          .insert({
            ...payload,
            created_by: user?.id,
          })
          .select();

        // Fallback if payment migration hasn't been executed on Supabase yet
        if (error && isMissingColumnError(error)) {
          const res = await supabase
            .from('events')
            .insert({
              ...basicPayload,
              created_by: user?.id,
            })
            .select();
          data = res.data;
          error = res.error;
        }

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Database permission denied: Your admin account does not have insert permissions on events in Supabase. Please verify your account role in profiles is website_admin, event_manager, or super_admin.');
        }
      }

      setIsModalOpen(false);
      await fetchEvents();
    } catch (err: unknown) {
      let msg = 'Error saving event';
      if (err instanceof Error) {
        msg = err.message;
      } else if (err && typeof err === 'object') {
        const anyErr = err as Record<string, unknown>;
        if (typeof anyErr.message === 'string' && anyErr.message.trim()) {
          msg = anyErr.message;
        } else if (typeof anyErr.error_description === 'string' && anyErr.error_description.trim()) {
          msg = anyErr.error_description;
        } else if (typeof anyErr.details === 'string' && anyErr.details.trim()) {
          msg = anyErr.details;
        }
      } else if (typeof err === 'string' && err.trim()) {
        msg = err;
      }
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async (ev: EventItem) => {
    const newStatus = !ev.is_published;
    if (isDevSession) {
      const updated = events.map((e) => (e.id === ev.id ? { ...e, is_published: newStatus } : e));
      setEvents(updated);
      try {
        sessionStorage.setItem('sign_dev_events', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return;
    }
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_published: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ev.id);
      if (error) throw error;
      setEvents(events.map((e) => (e.id === ev.id ? { ...e, is_published: newStatus } : e)));
    } catch (err) {
      console.error('[SIGN Admin Events] Error toggling status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    if (isDevSession) {
      const updated = events.filter((e) => e.id !== id);
      setEvents(updated);
      try {
        sessionStorage.setItem('sign_dev_events', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return;
    }
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      setEvents(events.filter((e) => e.id !== id));
    } catch (err) {
      console.error('[SIGN Admin Events] Error deleting event:', err);
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-teal-400" />
              <span>Academic Events & Conferences</span>
            </h1>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full shadow-sm">
              {APP_VERSION}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Publish neurology conferences, workshops, webinars, and configure adjustable fees, ambassador codes, and attendee registrations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => openAttendeesModal(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer shadow-sm"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>All Registrations</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-300 hover:from-teal-300 hover:to-cyan-200 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, venue, keywords..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Table / Card List */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading events catalog...</p>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Event Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Pricing</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Venue</th>
                  <th className="py-3.5 px-4 text-center">Registrations</th>
                  <th className="py-3.5 px-4 text-center">Reg Status</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        {ev.cover_image_url ? (
                          <img
                            src={ev.cover_image_url}
                            alt=""
                            className="w-12 h-9 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-950"
                          />
                        ) : (
                          <div className="w-12 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-slate-600">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-white text-sm line-clamp-1">{ev.title}</div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{ev.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-teal-400 border border-slate-700">
                        {ev.category}
                      </span>
                    </td>
                    {/* Pricing Pill */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {ev.is_paid && ev.registration_fee && ev.registration_fee > 0 ? (
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-950/70 text-amber-300 border border-amber-700/50 inline-flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            PKR {ev.registration_fee}
                          </span>
                          {ev.ambassador_code && (
                            <span className="block text-[9px] text-emerald-400 font-mono">
                              Code: {ev.ambassador_code.split(',')[0]} (-{ev.ambassador_discount_percent ?? 20}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-slate-200 font-medium">{ev.event_date}</div>
                      {ev.start_time && (
                        <span className="text-[11px] text-slate-400">
                          {ev.start_time.slice(0, 5)} - {ev.end_time?.slice(0, 5) || ''}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 max-w-[180px]">
                      <div className="flex items-center gap-1.5 truncate" title={ev.venue}>
                        {ev.is_virtual ? (
                          <Video className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                        )}
                        <span className="truncate">{ev.venue}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openAttendeesModal(ev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 hover:border-emerald-600 transition-all cursor-pointer shadow-xs group/btn"
                        title="View & manage registered attendees for this event"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                        <span>
                          {attendeeCounts[ev.id] || 0}
                          {ev.max_attendees ? ` / ${ev.max_attendees}` : ''}
                        </span>
                        <span className="text-[11px] text-emerald-400/80">
                          {ev.max_attendees ? 'Slots' : 'Registered'}
                        </span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {ev.is_registration_open === false ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          <Lock className="w-2.5 h-2.5 text-rose-400" />
                          Closed
                        </span>
                      ) : ev.registration_deadline ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                          <Clock className="w-2.5 h-2.5 text-amber-400" />
                          {ev.registration_deadline}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Open
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => togglePublish(ev)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          ev.is_published
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                        title="Click to toggle publish status"
                      >
                        {ev.is_published ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-400" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            Draft
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(ev)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Events Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No events match your current filter criteria or have been created in the database yet.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Event</span>
          </button>
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 text-slate-200 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" />
                <span>{editingEvent ? 'Edit Event Details' : 'Create New Event'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Event Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Clinical Neuroscience Symposium 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description & Learning Objectives <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the core topics, keynote speakers, and learning objectives..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
                />
              </div>

              {/* Category & Organizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Organizer</label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="SIGN SMC Chapter"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Event Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Venue & Attendee Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Venue / Location <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Saidu Medical College Auditorium / SGTH Neurology Dept"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      Attendee Slots
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Optional</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    placeholder="e.g. 50 (0 = unlimited)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              {/* Cover Image Upload & Optimization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-semibold">
                    Cover Banner Image
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-teal-400 hover:text-teal-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{showUrlInput ? 'Hide URL link' : 'Or paste direct URL'}</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {imageUploadError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>{imageUploadError}</span>
                  </div>
                )}

                {coverImageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group">
                    <img
                      src={coverImageUrl}
                      alt="Banner Preview"
                      className="w-full h-44 object-cover"
                    />

                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 inline-flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Active Banner
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors cursor-pointer shadow-md"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Change Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCoverImageUrl('')}
                        disabled={isUploadingImage}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                        <span className="text-xs text-slate-300 font-medium">Uploading new banner...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-slate-700 hover:border-teal-400/60 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-950 group ${
                      isUploadingImage ? 'pointer-events-none opacity-60' : ''
                    }`}
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-2" />
                        <span className="text-xs text-slate-300 font-semibold">
                          Optimizing & Uploading Image...
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          Saving to Supabase event-banners storage
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform text-teal-400">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-white group-hover:text-teal-300 transition-colors">
                          Click to upload event banner image
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          PNG, JPG, or WebP up to 15MB • Auto-compressed to 16:9 HD banner
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {showUrlInput && (
                  <div className="pt-1 animate-in fade-in duration-200">
                    <input
                      type="url"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or public image link"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-teal-500"
                    />
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* REGISTRATION FEE & PAYMENT SETUP BLOCK                   */}
              {/* ========================================================= */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Registration Fee & Pricing Configuration
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPaid(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        !isPaid
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Free Event
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPaid(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isPaid
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Paid Event
                    </button>
                  </div>
                </div>

                {isPaid && (
                  <div className="space-y-3.5 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                          Registration Fee (PKR) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          required={isPaid}
                          value={registrationFee}
                          onChange={(e) => setRegistrationFee(e.target.value)}
                          placeholder="500"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                          Bank / Payment Provider
                        </label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. Easypaisa / Meezan Bank"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                          Account Title / Beneficiary Name
                        </label>
                        <input
                          type="text"
                          value={accountTitle}
                          onChange={(e) => setAccountTitle(e.target.value)}
                          placeholder="e.g. Waqar Younas (Finance Secretary)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                          Account Number / Mobile Wallet No
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="e.g. 03179752692"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-[11px] flex items-center gap-1">
                          <Tag className="w-3 h-3 text-teal-400" />
                          <span>Ambassador / Member Discount Code(s)</span>
                        </label>
                        <input
                          type="text"
                          value={ambassadorCode}
                          onChange={(e) => setAmbassadorCode(e.target.value)}
                          placeholder="e.g. AMBASSADOR, SMC2026"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white uppercase tracking-wider font-mono focus:border-teal-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Attendees with this code receive ambassador or member discount
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                          Ambassador / Member Discount Percentage (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={ambassadorDiscountPercent}
                          onChange={(e) => setAmbassadorDiscountPercent(e.target.value)}
                          placeholder="20"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:border-teal-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          e.g. 20% discount (Set 100 for free ambassador / member registration)
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                        Custom Payment Instructions (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={paymentInstructions}
                        onChange={(e) => setPaymentInstructions(e.target.value)}
                        placeholder="e.g. Please transfer fee and upload screenshot with Transaction ID clearly visible."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-teal-500"
                      />
                    </div>

                    {/* Support Contact & Helpline Settings */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                      <div className="text-slate-300 font-semibold text-[11px] flex items-center gap-1.5 text-amber-300">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        <span>Transaction Support & Helpline Contacts</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-medium mb-1 text-[10.5px]">
                            Support WhatsApp / Contact Number
                          </label>
                          <input
                            type="text"
                            value={supportPhone}
                            onChange={(e) => setSupportPhone(e.target.value)}
                            placeholder="e.g. 0317-9752692 (Waqar Younas)"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-medium mb-1 text-[10.5px]">
                            Support Official Email
                          </label>
                          <input
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            placeholder="e.g. signsmc.official@gmail.com"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1 text-[10.5px]">
                          Transaction Error Guidance Notice
                        </label>
                        <textarea
                          rows={2}
                          value={supportInstructions}
                          onChange={(e) => setSupportInstructions(e.target.value)}
                          placeholder="e.g. If you face any issues while transferring the registration fee, deduction errors, or bank delays, please contact our Chapter Finance Officer or official channels for immediate assistance:"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          This notice is displayed to attendees inside the payment section during registration.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Registration Status & Deadline Controls */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Event Registration Availability & Deadline
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRegistrationOpen(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isRegistrationOpen
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Registration Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRegistrationOpen(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        !isRegistrationOpen
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Registration Closed
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Event Registration Deadline / Close Date (Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    If specified, attendees see the countdown duration (e.g. "X Days Left"). After 23:59 on this date, registration automatically closes.
                  </span>
                </div>
              </div>

              {/* Registration Link */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  External Session / Zoom Link (Optional)
                </label>
                <input
                  type="url"
                  value={registrationUrl}
                  onChange={(e) => setRegistrationUrl(e.target.value)}
                  placeholder="https://zoom.us/j/... or session link"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVirtual}
                    onChange={(e) => setIsVirtual(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500 bg-slate-950 border-slate-800"
                  />
                  <span className="text-slate-300">Virtual / Online Meeting</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500 bg-slate-950 border-slate-800"
                  />
                  <span className="text-slate-300 font-semibold text-teal-300">
                    Publish immediately to Public Website
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-slate-950 font-bold bg-gradient-to-r from-teal-400 to-cyan-300 hover:from-teal-300 hover:to-cyan-200 disabled:opacity-50 transition-all shadow-md cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Attendees Management Modal */}
      {isAttendeesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-xs text-slate-300">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 mb-2">
                  <Users className="w-3 h-3 text-emerald-400" />
                  <span>
                    {selectedEventForAttendees
                      ? 'Event Attendees & Payment Records'
                      : 'All Academic Event Registrations'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {selectedEventForAttendees
                    ? selectedEventForAttendees.title
                    : 'Comprehensive Chapter Attendee Directory'}
                </h3>
                {selectedEventForAttendees && (
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-slate-400 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      {selectedEventForAttendees.event_date}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      {selectedEventForAttendees.start_time?.slice(0, 5) || '10:00'} -{' '}
                      {selectedEventForAttendees.end_time?.slice(0, 5) || '12:00'}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedEventForAttendees.venue}
                    </span>
                    {selectedEventForAttendees.is_paid && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/40">
                          Fee: PKR {selectedEventForAttendees.registration_fee}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsAttendeesModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics & Action Bar */}
            <div className="p-5 sm:p-6 border-b border-slate-800 space-y-4 bg-slate-950/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Status & Payment Metrics */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                    <span className="text-slate-400">Total:</span>
                    <span className="font-bold text-white">{attendees.length}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/40 flex items-center gap-1.5 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Registered:</span>
                    <span className="font-bold text-emerald-200">
                      {attendees.filter((a) => a.attendance_status === 'registered').length}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-800/40 flex items-center gap-1.5 text-cyan-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Attended:</span>
                    <span className="font-bold text-cyan-200">
                      {attendees.filter((a) => a.attendance_status === 'attended').length}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center gap-1.5 text-amber-300">
                    <CreditCard className="w-3 h-3 text-amber-400" />
                    <span>Pending Proofs:</span>
                    <span className="font-bold text-amber-200">
                      {attendees.filter((a) => a.is_paid && a.payment_status === 'pending').length}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-1.5 text-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Verified:</span>
                    <span className="font-bold text-emerald-200">
                      {attendees.filter((a) => a.is_paid && a.payment_status === 'verified').length}
                    </span>
                  </div>
                </div>

                {/* Batch Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyAllAttendeeEmails}
                    disabled={filteredAttendees.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                    title="Copy all filtered attendee emails for batch announcements or invites"
                  >
                    {copiedEmailsFeedback ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Emails Copied!</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5 text-teal-400" />
                        <span>Copy Emails</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={exportAttendeesCsv}
                    disabled={filteredAttendees.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all cursor-pointer shadow-md shadow-emerald-950/30 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Search & Multi-Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={attendeeSearchQuery}
                    onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                    placeholder="Search by name, email, code, ambassador / member..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-teal-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 whitespace-nowrap text-[11px]">Attendance:</span>
                    <select
                      value={attendeeStatusFilter}
                      onChange={(e) => setAttendeeStatusFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-teal-500"
                    >
                      <option value="all">All Attendance</option>
                      <option value="registered">Registered Only</option>
                      <option value="attended">Attended Only</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 whitespace-nowrap text-[11px]">Payment:</span>
                    <select
                      value={attendeePaymentFilter}
                      onChange={(e) => setAttendeePaymentFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-teal-500"
                    >
                      <option value="all">All Payments</option>
                      <option value="free">Free Registrations</option>
                      <option value="pending">Paid - Pending</option>
                      <option value="verified">Paid - Verified</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendees Content Area */}
            <div className="p-5 sm:p-6">
              {isLoadingAttendees ? (
                <div className="p-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
                  <p className="text-slate-400">Loading attendee registrations...</p>
                </div>
              ) : filteredAttendees.length > 0 ? (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Attendee & Pass</th>
                          <th className="py-3 px-4">Contact Info</th>
                          <th className="py-3 px-4">Academic Background</th>
                          {!selectedEventForAttendees && <th className="py-3 px-4">Event</th>}
                          <th className="py-3 px-4">Payment & Receipt</th>
                          <th className="py-3 px-4">Questions / Notes</th>
                          <th className="py-3 px-4 text-center">Attendance</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {filteredAttendees.map((att) => (
                          <tr key={att.id} className="hover:bg-slate-900/50 transition-colors">
                            {/* Attendee & Pass */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-bold text-white text-sm">{att.full_name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] text-teal-300 font-semibold bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/40">
                                  {att.registration_code}
                                </span>
                              </div>
                            </td>

                            {/* Contact Info */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <a
                                  href={`mailto:${att.email}`}
                                  className="hover:text-teal-300 transition-colors"
                                >
                                  {att.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-1">
                                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <a
                                  href={`https://wa.me/${att.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
                                  title="Open WhatsApp chat"
                                >
                                  <span>{att.phone}</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
                                </a>
                              </div>
                            </td>

                            {/* Academic Background */}
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-200">{att.mbbs_year}</div>
                              <div className="text-[11px] text-slate-400 line-clamp-1" title={att.college_name}>
                                {att.college_name}
                              </div>
                              {att.student_id && (
                                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                  Roll No: {att.student_id}
                                </div>
                              )}
                            </td>

                            {/* Event if "All" is active */}
                            {!selectedEventForAttendees && (
                              <td className="py-3.5 px-4 max-w-[180px]">
                                <div className="font-semibold text-white line-clamp-1" title={att.event_title}>
                                  {att.event_title || 'Academic Event'}
                                </div>
                                <div className="text-[11px] text-emerald-400">
                                  {att.event_date}
                                </div>
                              </td>
                            )}

                            {/* Payment & Receipt Column */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {att.is_paid ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-white text-xs">
                                      PKR {att.amount_paid ?? att.fee_amount ?? 0}
                                    </span>

                                    {att.ambassador_code && (
                                      <span
                                        className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-700/50 px-1.5 py-0.5 rounded"
                                        title={`Ambassador / Member Code: ${att.ambassador_code} (Discount: PKR ${att.discount_applied ?? 0})`}
                                      >
                                        {att.ambassador_code}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Payment Status Toggle */}
                                    <button
                                      type="button"
                                      disabled={isUpdatingStatusId === att.id}
                                      onClick={() =>
                                        handleUpdatePaymentStatus(
                                          att.id,
                                          att.payment_status === 'verified' ? 'pending' : 'verified'
                                        )
                                      }
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                        att.payment_status === 'verified'
                                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                                          : 'bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900'
                                      }`}
                                      title="Click to toggle payment verification status"
                                    >
                                      {att.payment_status === 'verified' ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                          <span>Verified</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="w-3 h-3 text-amber-400" />
                                          <span>Pending</span>
                                        </>
                                      )}
                                    </button>

                                    {/* Receipt Preview Thumbnail */}
                                    {att.payment_proof_url ? (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedReceiptReg(att)}
                                        className="inline-flex items-center gap-1 text-[10px] text-teal-300 hover:text-teal-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer"
                                        title="Click to view payment proof screenshot"
                                      >
                                        <Eye className="w-3 h-3 text-teal-400" />
                                        <span>Receipt</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 italic">No receipt</span>
                                    )}
                                  </div>

                                  {att.transaction_id && (
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      TRX: {att.transaction_id}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-400">
                                  Free Registration
                                </span>
                              )}
                            </td>

                            {/* Questions / Notes */}
                            <td className="py-3.5 px-4 max-w-[200px]">
                              {att.questions_or_notes ? (
                                <p className="text-[11px] text-slate-300 line-clamp-2" title={att.questions_or_notes}>
                                  "{att.questions_or_notes}"
                                </p>
                              ) : (
                                <span className="text-[11px] text-slate-600 italic">None submitted</span>
                              )}
                            </td>

                            {/* Attendance Status Control */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="inline-flex rounded-lg p-0.5 bg-slate-900 border border-slate-800 text-[10px] font-bold">
                                <button
                                  type="button"
                                  disabled={isUpdatingStatusId === att.id}
                                  onClick={() => handleUpdateAttendanceStatus(att.id, 'registered')}
                                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                                    att.attendance_status === 'registered'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Registered
                                </button>
                                <button
                                  type="button"
                                  disabled={isUpdatingStatusId === att.id}
                                  onClick={() => handleUpdateAttendanceStatus(att.id, 'attended')}
                                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                                    att.attendance_status === 'attended'
                                      ? 'bg-cyan-600 text-white shadow-xs'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Attended
                                </button>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteRegistration(att.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Remove Registration"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800">
                  <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white">No Registrations Found</h4>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                    {attendeeSearchQuery || attendeeStatusFilter !== 'all' || attendeePaymentFilter !== 'all'
                      ? 'No registrations match your current search filters.'
                      : 'No students have registered for this event yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Full Receipt Viewer Modal for Admin */}
      {selectedReceiptReg && selectedReceiptReg.payment_proof_url && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
                  Payment Receipt Verification
                </span>
                <h4 className="text-base font-bold text-white">
                  {selectedReceiptReg.full_name} ({selectedReceiptReg.registration_code})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptReg(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Fee Amount:</span>
                <span className="font-mono font-bold text-white">
                  PKR {selectedReceiptReg.amount_paid ?? selectedReceiptReg.fee_amount ?? 0}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Ambassador / Member Code:</span>
                <span className="font-mono text-emerald-300 font-semibold">
                  {selectedReceiptReg.ambassador_code || 'None'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Verification:</span>
                <span
                  className={`font-semibold ${
                    selectedReceiptReg.payment_status === 'verified'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {selectedReceiptReg.payment_status === 'verified' ? 'Verified' : 'Pending'}
                </span>
              </div>
              {selectedReceiptReg.transaction_id && (
                <div className="col-span-2 sm:col-span-3 pt-1 border-t border-slate-800/60 font-mono">
                  <span className="text-slate-400">Transaction ID: </span>
                  <span className="text-teal-300 font-bold">{selectedReceiptReg.transaction_id}</span>
                </div>
              )}
            </div>

            {/* Receipt Image Display */}
            <div className="max-h-[60vh] overflow-auto flex items-center justify-center rounded-2xl bg-slate-950 p-2 border border-slate-800">
              <img
                src={selectedReceiptReg.payment_proof_url}
                alt="Payment proof receipt screenshot"
                className="max-h-[55vh] w-auto object-contain rounded-xl"
              />
            </div>

            {/* Footer verification actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <a
                href={selectedReceiptReg.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white"
              >
                <span>Open original image</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdatePaymentStatus(selectedReceiptReg.id, 'pending')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                    selectedReceiptReg.payment_status === 'pending'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Mark as Pending
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdatePaymentStatus(selectedReceiptReg.id, 'verified')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    selectedReceiptReg.payment_status === 'verified'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                  Mark as Verified
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
