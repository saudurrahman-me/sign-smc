import React, { useEffect, useState } from 'react';
import { User, Mail, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { LinkedinIcon, TwitterIcon } from '../brand/SocialIcons';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { LeadershipProfile } from '../../types/database.types';
import { INITIAL_LEADERSHIP_PLACEHOLDERS } from '../../data/fallback-content';

export const LeadershipSection: React.FC = () => {
  const [profiles, setProfiles] = useState<LeadershipProfile[]>(INITIAL_LEADERSHIP_PLACEHOLDERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLeadership = async () => {
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
          setProfiles(data as LeadershipProfile[]);
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
            Student stewards, candidate nominees, and faculty mentors guiding the SIGN-SMC Chapter at Saidu Medical College.
          </p>
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[#016533] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              profiles.length <= 3 ? 'lg:grid-cols-3 max-w-5xl mx-auto' : 'lg:grid-cols-4'
            } gap-8`}
          >
            {profiles.map((person) => {
              const isPlaceholder =
                person.full_name.includes('Pending') ||
                person.full_name.includes('Awaiting') ||
                !person.photo_url;

              return (
                <div
                  key={person.id}
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-emerald-500/50 hover:shadow-md transition-all"
                >
                  {/* Portrait Card Image or Distinctive Placeholder */}
                  <div className="relative aspect-4/5 bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                    {person.photo_url ? (
                      <img
                        src={person.photo_url}
                        alt={`${person.full_name} - ${person.role_title}`}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
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
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[180px]">
                          Official appointment or biography awaiting publication
                        </p>
                      </div>
                    )}

                    {/* Academic Position Tag */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#031D12]/90 backdrop-blur-md text-emerald-300 border border-emerald-500/30 shadow-sm">
                        {person.role_title}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        className={`font-bold text-base ${
                          isPlaceholder ? 'text-slate-600 italic' : 'text-slate-900'
                        }`}
                      >
                        {person.full_name}
                      </h3>
                      {person.academic_year && (
                        <p className="text-xs font-semibold text-[#016533] mt-0.5">
                          {person.academic_year}
                        </p>
                      )}
                      {person.bio && (
                        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                          {person.bio}
                        </p>
                      )}
                    </div>

                    {/* Verified Contact or Social links (hidden if unconfigured) */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
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
                      {person.social_links?.researchgate && (
                        <a
                          href={person.social_links.researchgate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#016533] hover:bg-emerald-50 transition-colors"
                          title="ResearchGate"
                          aria-label={`ResearchGate for ${person.full_name}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {!person.contact_email &&
                        !person.social_links?.linkedin &&
                        !person.social_links?.twitter && (
                          <span className="text-[11px] text-slate-400 italic">
                            Saidu Medical College Chapter
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
