import React, { useEffect, useState } from 'react';
import { User, Mail, ShieldCheck, Clock } from 'lucide-react';
import { LinkedinIcon, TwitterIcon } from '../brand/SocialIcons';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { LeadershipProfile } from '../../types/database.types';
import { INITIAL_LEADERSHIP_PLACEHOLDERS } from '../../data/fallback-content';
import { normalizeProfileOrders } from '../../lib/leadership-reorder';

export const LeadershipSection: React.FC = () => {
  const [profiles, setProfiles] = useState<LeadershipProfile[]>(INITIAL_LEADERSHIP_PLACEHOLDERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLeadership = async () => {
      try {
        const devCached = sessionStorage.getItem('sign_dev_leadership_profiles');
        if (devCached) {
          const parsed = JSON.parse(devCached) as LeadershipProfile[];
          const published = parsed.filter((p) => p.is_published);
          const existingNames = new Set(published.map((p) => p.full_name.trim().toLowerCase()));
          const missingDefaults = INITIAL_LEADERSHIP_PLACEHOLDERS.filter(
            (init) => !existingNames.has(init.full_name.trim().toLowerCase())
          );
          const combined = [...published, ...missingDefaults].map((p) => {
            const match = INITIAL_LEADERSHIP_PLACEHOLDERS.find(
              (f) =>
                f.id === p.id ||
                f.full_name.trim().toLowerCase() === p.full_name.trim().toLowerCase()
            );
            if (match) {
              const orderNum = Number(p.display_order);
              return {
                ...p,
                display_order:
                  typeof p.display_order !== 'undefined' && p.display_order !== null && !isNaN(orderNum)
                    ? orderNum
                    : match.display_order,
                bio: p.bio && p.bio.trim().length > 15 ? p.bio : match.bio,
                academic_year: p.academic_year || match.academic_year,
                photo_url: p.photo_url || match.photo_url,
              };
            }
            return p;
          });
          const normalized = normalizeProfileOrders(combined);
          if (normalized.length > 0 && isMounted) {
            setProfiles(normalized);
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
          .from('leadership_profiles')
          .select('*')
          .eq('is_published', true)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('[SIGN Leadership] Error fetching profiles:', error.message);
        } else if (data && data.length > 0 && isMounted) {
          const fetched = data as LeadershipProfile[];
          const existingNames = new Set(fetched.map((p) => p.full_name.trim().toLowerCase()));
          const missingDefaults = INITIAL_LEADERSHIP_PLACEHOLDERS.filter(
            (init) => !existingNames.has(init.full_name.trim().toLowerCase())
          );
          const combined = [...fetched, ...missingDefaults];

          const merged = combined.map((p) => {
            const fallbackMatch = INITIAL_LEADERSHIP_PLACEHOLDERS.find(
              (f) =>
                f.id === p.id ||
                f.full_name.trim().toLowerCase() === p.full_name.trim().toLowerCase()
            );
            if (fallbackMatch) {
              const orderNum = Number(p.display_order);
              return {
                ...p,
                display_order:
                  typeof p.display_order !== 'undefined' && p.display_order !== null && !isNaN(orderNum)
                    ? orderNum
                    : fallbackMatch.display_order,
                bio:
                  p.bio &&
                  p.bio.trim().length > 15 &&
                  !p.bio.startsWith('Patron-in-Chief of the Student') &&
                  !p.bio.startsWith('Consultant Neurologist at Saidu') &&
                  !p.bio.startsWith('Scientific & Academic Advisor for SIGN')
                    ? p.bio
                    : fallbackMatch.bio,
                photo_url: p.photo_url || fallbackMatch.photo_url,
                academic_year: p.academic_year || fallbackMatch.academic_year,
              };
            }
            return p;
          });
          const normalized = normalizeProfileOrders(merged);
          setProfiles(normalized);
        }
      } catch (err) {
        console.error('[SIGN Leadership] Unexpected error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLeadership();
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Patron & Faculty Mentors (Prof. Dr. Muhammad Ayub Khan, Dr. Fawad Ali, Dr. Amjad Iqbal)
  const mainLeaders = ([
    profiles.find((p) => p.full_name.toLowerCase().includes('ayub')),
    profiles.find((p) => p.full_name.toLowerCase().includes('fawad')),
    profiles.find((p) => p.full_name.toLowerCase().includes('amjad')),
  ].filter((p): p is LeadershipProfile => Boolean(p)))
    .sort((a, b) => a.display_order - b.display_order);

  // 2. Executive Committee & Student Stewards (All executive members in order)
  const mainLeaderIds = new Set(mainLeaders.map((p) => p.id));
  const executiveProfiles = profiles
    .filter((p) => !mainLeaderIds.has(p.id))
    .sort((a, b) => a.display_order - b.display_order);

  const renderStudentCard = (person: LeadershipProfile) => (
    <div
      key={person.id}
      className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-[#016533]/50 hover:shadow-lg transition-all duration-300"
    >
      {/* Portrait Photo */}
      <div className="relative aspect-4/5 bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
        {person.photo_url ? (
          <img
            src={person.photo_url}
            alt={`${person.full_name} - ${person.role_title}`}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
            loading="eager"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-300/60 flex items-center justify-center mb-3 text-slate-500">
              <User className="w-8 h-8" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#016533]" />
              Profile Pending
            </span>
          </div>
        )}

        {/* Academic Role Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#031D12]/90 backdrop-blur-md text-emerald-300 border border-emerald-500/30 shadow-sm">
            {person.role_title}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-base text-slate-900 group-hover:text-[#016533] transition-colors">
            {person.full_name}
          </h4>
          {person.academic_year && (
            <p className="text-xs font-semibold text-[#016533] mt-0.5">
              {person.academic_year}
            </p>
          )}
          {person.bio && (
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-4">
              {person.bio}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {person.contact_email && (
              <a
                href={`mailto:${person.contact_email}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#016533] hover:bg-emerald-50 transition-colors"
                title="Contact Email"
                aria-label={`Email ${person.full_name}`}
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
            {person.social_links?.linkedin && (
              <a
                href={person.social_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#016533] hover:bg-emerald-50 transition-colors"
                title="LinkedIn Profile"
                aria-label={`LinkedIn for ${person.full_name}`}
              >
                <LinkedinIcon className="w-4 h-4" />
              </a>
            )}
            {person.social_links?.twitter && (
              <a
                href={person.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#016533] hover:bg-emerald-50 transition-colors"
                title="Twitter Profile"
                aria-label={`Twitter for ${person.full_name}`}
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            SIGN SMC
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <section id="leadership" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#016533] border border-emerald-200 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-[#016533]" />
            Chapter Governance
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Leadership & Executive Committee
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Faculty patrons, consultant neurologist mentors, and student stewards guiding the SIGN Chapter at Saidu Medical College.
          </p>
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[#016533] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            {/* 1. Main Characters (Faculty & Patron Mentors: Prof. Ayub, Dr. Fawad, Dr. Amjad) */}
            <div className="space-y-6 max-w-5xl mx-auto mb-16">
              {mainLeaders.map((person) => (
                <div
                  key={person.id}
                  className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:border-[#016533]/50 hover:shadow-xl transition-all duration-300"
                >
                  {/* Left Side: Photo */}
                  <div className="md:w-72 lg:w-80 flex-shrink-0 relative bg-gradient-to-b from-slate-100 to-slate-200 aspect-4/5 md:aspect-auto md:min-h-[290px] overflow-hidden">
                    {person.photo_url ? (
                      <img
                        src={person.photo_url}
                        alt={`${person.full_name} - ${person.role_title}`}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                        loading="eager"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 h-full">
                        <User className="w-16 h-16 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 md:hidden">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#031D12]/90 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                        {person.role_title}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Details & Biography */}
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <span className="hidden md:inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#016533] border border-emerald-200">
                          {person.role_title}
                        </span>
                        {person.contact_email && (
                          <a
                            href={`mailto:${person.contact_email}`}
                            className="text-xs font-mono text-slate-500 hover:text-[#016533] flex items-center gap-1.5 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#016533]" />
                            {person.contact_email}
                          </a>
                        )}
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {person.full_name}
                      </h3>

                      {person.academic_year && (
                        <p className="text-sm font-semibold text-[#016533] mt-1">
                          {person.academic_year}
                        </p>
                      )}

                      {person.bio && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic border-l-2 border-[#016533] pl-4">
                            "{person.bio}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-500">
                        Saidu Medical College (SMC) & Saidu Group of Teaching Hospitals (SGTH)
                      </span>
                      <div className="flex items-center gap-2">
                        {person.social_links?.linkedin && (
                          <a
                            href={person.social_links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#016533] hover:bg-emerald-50 transition-colors"
                            title="LinkedIn Profile"
                          >
                            <LinkedinIcon className="w-4 h-4" />
                          </a>
                        )}
                        {person.social_links?.twitter && (
                          <a
                            href={person.social_links.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#016533] hover:bg-emerald-50 transition-colors"
                            title="Twitter Profile"
                          >
                            <TwitterIcon className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Executive Committee & Student Stewards Section */}
            <div className="text-center max-w-2xl mx-auto mb-10 pt-10 border-t border-slate-200">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#016533] border border-emerald-200 mb-2">
                Executive Committee & Student Stewards
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Chapter Operations & Committee Leadership
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Student stewards leading chapter organization, neuroscience workshops, event management, and communications.
              </p>
            </div>

            {/* Unified Responsive Executive Committee Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {executiveProfiles.map(renderStudentCard)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
