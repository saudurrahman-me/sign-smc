import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { SiteContent } from '../../types/database.types';
import { OFFICIAL_SETTINGS, OFFICIAL_CONTENT } from '../../data/fallback-content';
import { useAuth } from '../../context/AuthContext';
import { InstagramIcon, FacebookIcon, LinkedinIcon, YoutubeIcon } from '../../components/brand/SocialIcons';
import {
  Settings,
  BookOpen,
  Target,
  Eye,
  CheckCircle2,
  Save,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const AdminContentSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Content Fields
  const [preamble, setPreamble] = useState(OFFICIAL_CONTENT.preamble.content);
  const [mission, setMission] = useState(OFFICIAL_CONTENT.mission.content);
  const [vision, setVision] = useState(OFFICIAL_CONTENT.vision.content);

  // Settings Fields
  const [contactEmail, setContactEmail] = useState(OFFICIAL_SETTINGS.contact_email || '');
  const [contactPhone, setContactPhone] = useState(OFFICIAL_SETTINGS.contact_phone || '');
  const [address, setAddress] = useState(OFFICIAL_SETTINGS.address || '');
  const [instagram, setInstagram] = useState(OFFICIAL_SETTINGS.social_links?.instagram || '');
  const [facebook, setFacebook] = useState(OFFICIAL_SETTINGS.social_links?.facebook || '');
  const [linkedin, setLinkedin] = useState(OFFICIAL_SETTINGS.social_links?.linkedin || '');
  const [youtube, setYoutube] = useState(OFFICIAL_SETTINGS.social_links?.youtube || '');
  const [membershipFormUrl, setMembershipFormUrl] = useState(OFFICIAL_SETTINGS.membership_form_url || '');
  const [membershipOpen, setMembershipOpen] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        // Load Settings
        const { data: setts } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 1)
          .single();

        if (setts && isMounted) {
          setContactEmail(setts.contact_email || '');
          setContactPhone(setts.contact_phone || '');
          setAddress(setts.address || '');
          setInstagram(setts.social_links?.instagram || '');
          setFacebook(setts.social_links?.facebook || '');
          setLinkedin(setts.social_links?.linkedin || '');
          setYoutube(setts.social_links?.youtube || '');
          setMembershipFormUrl(setts.membership_form_url || '');
          setMembershipOpen(setts.membership_open ?? true);
        }

        // Load Content items
        const { data: contentList } = await supabase.from('site_content').select('*');
        if (contentList && isMounted) {
          contentList.forEach((item: SiteContent) => {
            if (item.key === 'preamble') setPreamble(item.content);
            if (item.key === 'mission') setMission(item.content);
            if (item.key === 'vision') setVision(item.content);
          });
        }
      } catch (err) {
        console.error('[SIGN Admin Settings] Error loading:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured yet. Set credentials in .env.');
      }

      const timestamp = new Date().toISOString();

      // Upsert preamble
      await supabase.from('site_content').upsert({
        key: 'preamble',
        title: 'About SIGN',
        subtitle: 'Academic Society Preamble',
        content: preamble.trim(),
        updated_at: timestamp,
        updated_by: user?.id,
      });

      // Upsert mission
      await supabase.from('site_content').upsert({
        key: 'mission',
        title: 'Mission Statement',
        subtitle: 'Our Purpose & Academic Mandate',
        content: mission.trim(),
        updated_at: timestamp,
        updated_by: user?.id,
      });

      // Upsert vision
      await supabase.from('site_content').upsert({
        key: 'vision',
        title: 'Vision Statement',
        subtitle: 'Our Long-Term Horizon for KPK',
        content: vision.trim(),
        updated_at: timestamp,
        updated_by: user?.id,
      });

      setSuccessMsg('Academic copy and section text updated successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving content';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured yet. Set credentials in .env.');
      }

      const { error } = await supabase
        .from('site_settings')
        .update({
          contact_email: contactEmail.trim() || null,
          contact_phone: contactPhone.trim() || null,
          address: address.trim() || null,
          social_links: {
            instagram: instagram.trim(),
            facebook: facebook.trim(),
            linkedin: linkedin.trim(),
            youtube: youtube.trim(),
          },
          membership_open: membershipOpen,
          membership_form_url: membershipFormUrl.trim() || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('id', 1);

      if (error) throw error;
      setSuccessMsg('Official coordinates and verified social media links updated!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating settings';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block mb-1">
            Institutional Settings
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Content Copy & Digital Coordinates
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Maintain organizational statements, verified digital channels, and membership intake status.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-bold gap-6">
        <button
          onClick={() => {
            setActiveTab('content');
            setSuccessMsg(null);
            setErrorMsg(null);
          }}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'content'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Section Copy & Preamble
        </button>

        <button
          onClick={() => {
            setActiveTab('settings');
            setSuccessMsg(null);
            setErrorMsg(null);
          }}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'settings'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          Coordinates & Verified Social Links
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading section copy and settings...</p>
        </div>
      ) : activeTab === 'content' ? (
        /* Academic Copy Editing Form */
        <form onSubmit={handleSaveContent} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-xs shadow-xl">
          <div>
            <label className="block text-slate-200 font-bold mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              About SIGN Preamble
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              The foundational institutional text presented in the About section.
            </p>
            <textarea
              rows={4}
              required
              value={preamble}
              onChange={(e) => setPreamble(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-200 font-bold mb-1.5 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-teal-400" />
              Mission Statement
            </label>
            <textarea
              rows={3}
              required
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-200 font-bold mb-1.5 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-sky-400" />
              Vision Statement
            </label>
            <textarea
              rows={3}
              required
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-300 hover:from-teal-300 hover:to-cyan-200 disabled:opacity-50 transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Section Content'}
            </button>
          </div>
        </form>
      ) : (
        /* Coordinates & Social Media Links Form */
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-xs shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Official Inquiries Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="signsmc.official@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Official Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Leave blank if unassigned"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Official Membership Application URL (Google Forms)
            </label>
            <input
              type="url"
              value={membershipFormUrl}
              onChange={(e) => setMembershipFormUrl(e.target.value)}
              placeholder="https://forms.gle/jzUr115noQ1fDNdS8"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Physical Institutional Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Saidu Medical College, Saidu Sharif, Swat, KPK, Pakistan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-cyan-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2">Verified Social Media Channels</h3>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Strict Security Rule: Only URLs entered below will be displayed publicly. Unconfigured or blank fields
              are automatically hidden to prevent presenting fake or speculative accounts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <FacebookIcon className="w-3.5 h-3.5 text-blue-500" />
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <LinkedinIcon className="w-3.5 h-3.5 text-sky-500" />
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />
                  YouTube Channel URL
                </label>
                <input
                  type="url"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMembershipOpen(!membershipOpen)}
                className="text-cyan-400 focus:outline-none"
              >
                {membershipOpen ? (
                  <ToggleRight className="w-7 h-7 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-600" />
                )}
              </button>
              <div>
                <span className="text-white font-bold block">
                  {membershipOpen ? 'Membership Intake Open' : 'Membership Intake Closed'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Controls whether students can submit new applications.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-300 hover:from-teal-300 hover:to-cyan-200 disabled:opacity-50 transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
