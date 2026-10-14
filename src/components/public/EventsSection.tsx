import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, ExternalLink, Video, Filter, Sparkles, BookOpen } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { EventItem, EventCategory } from '../../types/database.types';

export const EventsSection: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

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

                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#031D12]/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                      {ev.category}
                    </span>
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

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>

                    {ev.registration_url && (
                      <a
                        href={ev.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#016533] hover:bg-[#015229] transition-colors"
                      >
                        Register
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
    </section>
  );
};
