import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { EventItem, EventCategory, EventRegistration, AttendanceStatus } from '../../types/database.types';
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
} from 'lucide-react';

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

  const [registrationUrl, setRegistrationUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);

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

  const handleDeleteRegistration = async (regId: string) => {
    if (!window.confirm('Are you sure you want to remove this registration record?')) return;

    setAttendees((prev) => prev.filter((a) => a.id !== regId));

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
    const q = attendeeSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      a.full_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      (a.registration_code && a.registration_code.toLowerCase().includes(q)) ||
      (a.student_id && a.student_id.toLowerCase().includes(q)) ||
      (a.college_name && a.college_name.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
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

  const totalRegistrationsCount = Object.values(attendeeCounts).reduce((acc, c) => acc + c, 0);

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
      // Compress to optimal web banner dimensions (1600x900)
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
      const payload = {
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
      };

      if (isDevSession) {
        let updatedList: EventItem[];
        if (editingEvent) {
          updatedList = events.map((e) =>
            e.id === editingEvent.id
              ? { ...e, ...payload, cover_image_url: payload.cover_image_url }
              : e
          );
        } else {
          const newEv: EventItem = {
            id: `dev-evt-${Date.now()}`,
            ...payload,
            created_by: user?.id || null,
            cover_image_url: payload.cover_image_url,
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
        const { data, error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEvent.id)
          .select();
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Database permission denied: Supabase RLS blocked the update. Check that your account has event_manager or super_admin permissions.');
        }
      } else {
        const { data, error } = await supabase.from('events').insert({
          ...payload,
          created_by: user?.id,
        }).select();
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Database permission denied: Supabase RLS blocked the insert. Check that your account has event_manager or super_admin permissions.');
        }
      }

      setIsModalOpen(false);
      await fetchEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving event';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async (ev: EventItem) => {
    if (isDevSession) {
      const updatedList = events.map((e) => (e.id === ev.id ? { ...e, is_published: !e.is_published } : e));
      setEvents(updatedList);
      try {
        sessionStorage.setItem('sign_dev_events', JSON.stringify(updatedList));
      } catch {
        // ignore
      }
      return;
    }
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ is_published: !ev.is_published, updated_at: new Date().toISOString() })
        .eq('id', ev.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Permission denied: Supabase RLS blocked the update.');
      }
      setEvents(events.map((e) => (e.id === ev.id ? { ...e, is_published: !e.is_published } : e)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating publication status';
      alert(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be reversed.')) {
      return;
    }

    if (isDevSession) {
      const updatedList = events.filter((e) => e.id !== id);
      setEvents(updatedList);
      try {
        sessionStorage.setItem('sign_dev_events', JSON.stringify(updatedList));
      } catch {
        // ignore
      }
      return;
    }

    try {
      const { data, error } = await supabase.from('events').delete().eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Permission denied: Supabase RLS blocked the deletion.');
      }
      setEvents(events.filter((e) => e.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting event';
      alert(msg);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || ev.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 block mb-1">
            Event Management Suite
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Academic Activities & Seminars
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, publish, and manage neurology seminars, clinical case clubs, and community drives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openAttendeesModal(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-xs"
            title="View all attendees registered across all academic events"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>All Registrations ({totalRegistrationsCount})</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 transition-all shadow-md shadow-emerald-950/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Event
          </button>
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
            placeholder="Search events by title or venue..."
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
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Venue</th>
                  <th className="py-3.5 px-4 text-center">Registrations</th>
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
                        <span>{attendeeCounts[ev.id] || 0}</span>
                        <span className="text-[11px] text-emerald-400/80">Registered</span>
                      </button>
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
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-colors"
          >
            Create First Event
          </button>
        </div>
      )}

      {/* Modal Dialog for Event Creation & Editing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingEvent ? 'Edit Academic Event' : 'Schedule New Event'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Event Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Clinical Neurology Case Conference: Status Epilepticus"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Event Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Venue / Meeting Info <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Saidu Medical College Auditorium or Zoom"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Organizer</label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description & Agenda <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline the session agenda, faculty lead, target student year, and learning objectives..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                />
              </div>

              {/* Event Cover Image / Banner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-semibold">
                    Event Cover Banner (16:9 Image)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{showUrlInput ? 'Hide URL input' : 'Or paste image URL'}</span>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />

                {/* Upload Error Alert */}
                {imageUploadError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[11px] text-rose-300 flex items-center justify-between">
                    <span>{imageUploadError}</span>
                    <button
                      type="button"
                      onClick={() => setImageUploadError(null)}
                      className="text-rose-400 hover:text-rose-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Live Banner Preview OR Upload Dropzone */}
                {coverImageUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video max-h-56 shadow-lg">
                    <img
                      src={coverImageUrl}
                      alt="Event Banner Preview"
                      className="w-full h-full object-cover"
                    />

                    {/* Active Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/85 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Active Banner
                      </span>
                    </div>

                    {/* Action Bar on hover/overlay */}
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

                {/* Optional Direct URL Input Field */}
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

              {/* Registration Link */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Registration Link (Optional)
                </label>
                <input
                  type="url"
                  value={registrationUrl}
                  onChange={(e) => setRegistrationUrl(e.target.value)}
                  placeholder="https://zoom.us/j/... or session link"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
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
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-slate-950 font-bold bg-gradient-to-r from-teal-400 to-cyan-300 hover:from-teal-300 hover:to-cyan-200 disabled:opacity-50 transition-all shadow-md"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-xs text-slate-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 mb-2">
                  <Users className="w-3 h-3 text-emerald-400" />
                  <span>
                    {selectedEventForAttendees
                      ? 'Event Attendees & Registrations'
                      : 'All Academic Event Registrations'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">
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
            <div className="p-6 border-b border-slate-800 space-y-4 bg-slate-950/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Status Metrics */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="text-slate-400">Total:</span>
                    <span className="font-bold text-white">{attendees.length}</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/40 flex items-center gap-2 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Registered:</span>
                    <span className="font-bold text-emerald-200">
                      {attendees.filter((a) => a.attendance_status === 'registered').length}
                    </span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-800/40 flex items-center gap-2 text-cyan-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Attended:</span>
                    <span className="font-bold text-cyan-200">
                      {attendees.filter((a) => a.attendance_status === 'attended').length}
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

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={attendeeSearchQuery}
                    onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                    placeholder="Search by name, email, roll no, college..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-slate-400 whitespace-nowrap text-[11px]">Status:</span>
                  <select
                    value={attendeeStatusFilter}
                    onChange={(e) => setAttendeeStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-teal-500"
                  >
                    <option value="all">All Registrations</option>
                    <option value="registered">Registered Only</option>
                    <option value="attended">Attended Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Attendees Content Area */}
            <div className="p-6">
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
                                <div className="text-[10px] text-slate-500 mt-0.5">
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
                    {attendeeSearchQuery || attendeeStatusFilter !== 'all'
                      ? 'No registrations match your current search filters.'
                      : 'No students have registered for this event yet. Once they register on the public website, their details and reference codes will be listed here.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
