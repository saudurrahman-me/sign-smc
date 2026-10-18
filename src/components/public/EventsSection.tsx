import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, MapPin, Video, Filter, Sparkles, BookOpen, Ticket, ArrowRight, CheckCircle2, CreditCard } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useOptionalAuth } from '../../context/AuthContext';
import type { EventItem, EventCategory, EventRegistration } from '../../types/database.types';
import { EventRegistrationModal } from './EventRegistrationModal';
import { LoginRequiredModal } from './LoginRequiredModal';

export const EventsSection: React.FC = () => {
  const auth = useOptionalAuth();
  const user = auth?.user || null;
  const isInsideAuth = auth !== null;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedEventForReg, setSelectedEventForReg] = useState<EventItem | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<Record<string, EventRegistration>>({});
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const categories: Array<'All' | EventCategory> = [
    'All',
    'Seminars & Guest Lectures',
    'Case Discussions',
    'Journal Clubs',
    'Research Workshops',
    'Neurological Awareness Campaigns',
    'Academic Activities',
  ];

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        const devCached = sessionStorage.getItem('sign_dev_events');
        if (devCached) {
          const parsed = JSON.parse(devCached) as EventItem[];
          const published = parsed.filter((e) => e.is_published);
          if (published.length > 0 && isMounted) {
            setEvents(published);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // ignore
      }

      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_published', true)
          .order('event_date', { ascending: true });

        if (error) {
          console.error('[SIGN Events] Error fetching events:', error.message);
        } else if (data && isMounted) {
          setEvents(data as EventItem[]);
        }
      } catch (err) {
        console.error('[SIGN Events] Unexpected error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadUserRegistrations = useCallback(async () => {
    // If inside AuthProvider and visitor is logged out, clear all registrations immediately!
    if (isInsideAuth && !user) {
      setUserRegistrations({});
      return;
    }

    const regMap: Record<string, EventRegistration> = {};
    const currentUserId = user?.id;
    const currentUserEmail = user?.email?.trim().toLowerCase();

    // 1. Read from local storage ONLY for this specific authenticated user
    try {
      const stored = localStorage.getItem('sign_event_registrations');
      if (stored) {
        const parsed: EventRegistration[] = JSON.parse(stored);
        parsed.forEach((r) => {
          if (isInsideAuth) {
            const isOwn =
              (currentUserId && r.user_id === currentUserId) ||
              (currentUserEmail && r.email?.trim().toLowerCase() === currentUserEmail);
            if (r.event_id && isOwn) {
              regMap[r.event_id] = r;
            }
          } else {
            // Fallback for isolated unit tests without an AuthProvider
            if (r.event_id) {
              regMap[r.event_id] = r;
            }
          }
        });
      }
    } catch {
      // ignore
    }

    // 2. Read from Supabase if authenticated user is present
    if (isSupabaseConfigured && (currentUserId || currentUserEmail)) {
      try {
        let query = supabase.from('event_registrations').select('*');
        if (currentUserId && currentUserEmail) {
          query = query.or(`user_id.eq.${currentUserId},email.eq.${currentUserEmail}`);
        } else if (currentUserId) {
          query = query.eq('user_id', currentUserId);
        } else if (currentUserEmail) {
          query = query.eq('email', currentUserEmail);
        }

        const { data, error } = await query;
        if (!error && data) {
          data.forEach((r: EventRegistration) => {
            if (r.event_id) {
              regMap[r.event_id] = r;
            }
          });
        }
      } catch {
        // Table may not exist yet or offline
      }
    }

    setUserRegistrations(regMap);
  }, [user, isInsideAuth]);

  useEffect(() => {
    loadUserRegistrations();
  }, [loadUserRegistrations]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEvents = events.filter((ev) => {
    const isUpcoming = ev.event_date >= todayStr;
    const matchesTab = activeTab === 'upcoming' ? isUpcoming : !isUpcoming;
    const matchesCat = selectedCategory === 'All' || ev.category === selectedCategory;
    return matchesTab && matchesCat;
  });

  return (
    <section id="events" className="py-24 bg-slate-50/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#016533] border border-emerald-200 mb-4">
            <Calendar className="w-3.5 h-3.5 text-[#016533]" />
            Academic Calendar
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Events & Academic Activities
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Seminars, clinical case conferences, journal clubs, LTE writing workshops, and community health drives.
          </p>
        </div>

        {/* Tab & Category Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Upcoming / Past Tab Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-300/60 text-xs font-bold">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming Activities
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'past'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Archive & Past Events
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-none text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#016533] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid or Informative Authentic Empty State */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#016533] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-emerald-500/50 hover:shadow-md transition-all"
              >
                {/* Cover Image or Thematic Category Header */}
                <div className="relative aspect-16/9 bg-gradient-to-r from-[#031D12] to-slate-900 flex items-center justify-center overflow-hidden">
                  {ev.cover_image_url ? (
                    <img
                      src={ev.cover_image_url}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300">
                      <BookOpen className="w-8 h-8 text-emerald-400 mb-2" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                        {ev.category}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#031D12]/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                      {ev.category}
                    </span>
                    {ev.is_paid && ev.registration_fee && ev.registration_fee > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-950/90 backdrop-blur-md text-amber-300 border border-amber-600/50 font-mono shadow-xs">
                        <CreditCard className="w-3 h-3" />
                        PKR {ev.registration_fee}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                        Free
                      </span>
                    )}
                  </div>

                  {ev.is_virtual && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/80 backdrop-blur-md text-emerald-200 border border-emerald-500/30">
                        <Video className="w-3 h-3" />
                        Virtual
                      </span>
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#016533] mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(ev.event_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      {ev.start_time && (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-normal">
                          • <Clock className="w-3 h-3" /> {ev.start_time.slice(0, 5)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-[#016533] transition-colors">
                      {ev.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[150px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>

                    {userRegistrations[ev.id] ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEventForReg(ev);
                          setSelectedRegistration(userRegistrations[ev.id]);
                          setIsRegModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all group/btn cursor-pointer shadow-xs"
                        title="You are registered for this event! Click to view your attendee pass and details."
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Registered</span>
                        <span className="text-[10px] bg-[#016533] text-white px-1.5 py-0.5 rounded-md ml-0.5 group-hover/btn:bg-[#015229] transition-colors">
                          View Details
                        </span>
                      </button>
                    ) : ev.event_date >= todayStr ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (isInsideAuth && !user) {
                            setIsLoginModalOpen(true);
                            return;
                          }
                          setSelectedEventForReg(ev);
                          setSelectedRegistration(null);
                          setIsRegModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#016533] hover:bg-[#015229] shadow-xs hover:shadow transition-all group/btn cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Register</span>
                        <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Concluded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Informative authentic empty state (NO fabricated events) */
          <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#016533] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-[#016533]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {activeTab === 'upcoming'
                ? 'No Upcoming Events Currently Scheduled'
                : 'No Past Events Recorded'}
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {activeTab === 'upcoming'
                ? 'The SIGN Chapter executive board is actively finalizing the semester academic calendar, including clinical case conferences and seminars. Please check back shortly.'
                : 'Archived activities and symposium reports will be documented here once completed.'}
            </p>
            <div className="mt-6">
              <a
                href="#membership"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-[#016533] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Join SIGN to Receive Event Notices
              </a>
            </div>
          </div>
        )}
      </div>

      {/* In-Website Event Registration Modal */}
      {isRegModalOpen && (
        <EventRegistrationModal
          isOpen={isRegModalOpen}
          onClose={() => {
            setIsRegModalOpen(false);
            setSelectedEventForReg(null);
            setSelectedRegistration(null);
          }}
          event={selectedEventForReg}
          existingRegistration={selectedRegistration}
          onRegistrationSuccess={(newReg) => {
            setUserRegistrations((prev) => ({
              ...prev,
              [newReg.event_id]: newReg,
            }));
            setSelectedRegistration(newReg);
          }}
        />
      )}

      {/* Login Required Prompt Modal */}
      <LoginRequiredModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Sign In to Register for Events"
        subtitle="Attendee Verification Required"
        description="To register for official SIGN SMC academic events, receive your personalized attendee pass, and submit fee verification, please sign in with your student account."
        benefits={[
          'Your attendee pass and registration code are securely saved to your account.',
          'View your registration details and event guidelines anytime.',
          'Official participation certificates are issued directly to your profile upon attendance.',
        ]}
        redirectUrl="/login?redirect=events"
        registerUrl="/register?redirect=events"
      />
    </section>
  );
};
