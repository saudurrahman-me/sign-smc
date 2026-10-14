import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, MessageSquare, ExternalLink } from 'lucide-react';
import { InstagramIcon, FacebookIcon, LinkedinIcon, YoutubeIcon } from '../brand/SocialIcons';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { SiteSettings } from '../../types/database.types';
import { OFFICIAL_SETTINGS, OFFICIAL_MEMBERSHIP_FORM_URL } from '../../data/fallback-content';

export const ContactSection: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(OFFICIAL_SETTINGS);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 1)
          .single();

        if (error) {
          console.error('[SIGN Contact] Error fetching settings:', error.message);
        } else if (data && isMounted) {
          setSettings(data as SiteSettings);
        }
      } catch (err) {
        console.error('[SIGN Contact] Unexpected error:', err);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const socialLinks = settings.social_links || {};
  const hasInstagram = Boolean(socialLinks.instagram?.trim());
  const hasFacebook = Boolean(socialLinks.facebook?.trim());
  const hasLinkedin = Boolean(socialLinks.linkedin?.trim());
  const hasYoutube = Boolean(socialLinks.youtube?.trim());
  const hasAnySocial = hasInstagram || hasFacebook || hasLinkedin || hasYoutube;

  return (
    <section id="contact" className="py-24 bg-slate-50/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#016533] border border-emerald-200 mb-4">
            <MessageSquare className="w-3.5 h-3.5 text-[#016533]" />
            Communication & Inquiries
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Connect with SIGN SMC
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            For academic inquiries, seminar collaborations, faculty mentorship, or student outreach.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Institutional Contact Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                Institutional Coordinates
              </h3>

              <div className="space-y-5 text-sm">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-[#016533] mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Campus Location</span>
                    <span className="text-slate-800 font-medium leading-relaxed block mt-0.5">
                      {settings.address || 'Saidu Medical College, Saidu Sharif, Swat, Khyber Pakhtunkhwa, Pakistan'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-[#016533] mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Official Inquiries</span>
                    {settings.contact_email ? (
                      <a
                        href={`mailto:${settings.contact_email}`}
                        className="text-[#016533] font-medium hover:underline block mt-0.5"
                      >
                        {settings.contact_email}
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs italic block mt-0.5">
                        Email awaiting administration publication
                      </span>
                    )}
                  </div>
                </div>

                {settings.contact_phone && (
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-[#016533] mt-0.5">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400">Telephone</span>
                      <a
                        href={`tel:${settings.contact_phone}`}
                        className="text-slate-800 font-medium hover:underline block mt-0.5"
                      >
                        {settings.contact_phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Parent Institution
              </span>
              <p className="text-xs text-slate-600">
                Saidu Medical College (SMC), Swat
              </p>
            </div>
          </div>

          {/* Social Channels & Online Presence Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Official Digital Channels
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Only verified, chapter-approved accounts configured by authorized administrators are displayed below.
              </p>

              {hasAnySocial ? (
                <div className="space-y-3">
                  {hasInstagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-all text-xs font-semibold text-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <InstagramIcon className="w-4 h-4 text-pink-600" />
                        <span>Instagram Channel</span>
                      </div>
                      <span className="text-[#016533] text-[11px]">View Page &rarr;</span>
                    </a>
                  )}

                  {hasFacebook && (
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-all text-xs font-semibold text-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <FacebookIcon className="w-4 h-4 text-blue-600" />
                        <span>Facebook Community</span>
                      </div>
                      <span className="text-[#016533] text-[11px]">View Page &rarr;</span>
                    </a>
                  )}

                  {hasLinkedin && (
                    <a
                      href={socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-all text-xs font-semibold text-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <LinkedinIcon className="w-4 h-4 text-sky-700" />
                        <span>LinkedIn Network</span>
                      </div>
                      <span className="text-[#016533] text-[11px]">Connect &rarr;</span>
                    </a>
                  )}

                  {hasYoutube && (
                    <a
                      href={socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-all text-xs font-semibold text-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <YoutubeIcon className="w-4 h-4 text-red-600" />
                        <span>YouTube Lectures</span>
                      </div>
                      <span className="text-[#016533] text-[11px]">Subscribe &rarr;</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Official digital channels are currently being verified by the chapter media committee.
                    Verified links will be published here upon administrative approval.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <a
                href={settings.membership_form_url || OFFICIAL_MEMBERSHIP_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#016533] hover:bg-[#015229] border border-emerald-700/40 text-center transition-all shadow-md shadow-emerald-950/20"
              >
                Join SIGN SMC Chapter Cohort
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
