import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { SiteContent } from '../../types/database.types';
import { OFFICIAL_SETTINGS, OFFICIAL_CONTENT } from '../../data/fallback-content';
import { evaluateMembershipIntake } from '../../lib/membership-schedule';
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
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import { APP_VERSION } from '../../config/version';

export const AdminContentSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab =
    searchParams.get('tab') === 'settings' || searchParams.get('tab') === 'schedule'
      ? 'settings'
      : 'content';
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'settings' || tab === 'schedule') {
      setActiveTab('settings');
    } else if (tab === 'content') {
      setActiveTab('content');
    }
  }, [searchParams]);

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

  // Academic Semester Membership Intake Controls
  const [membershipOpen, setMembershipOpen] = useState(OFFICIAL_SETTINGS.membership_open ?? true);
  const [membershipTermName, setMembershipTermName] = useState(
    OFFICIAL_SETTINGS.membership_term_name || 'Fall 2026 Semester Intake'
  );
  const [membershipStartDate, setMembershipStartDate] = useState(OFFICIAL_SETTINGS.membership_start_date || '');
  const [membershipEndDate, setMembershipEndDate] = useState(OFFICIAL_SETTINGS.membership_end_date || '');
  const [membershipClosedMessage, setMembershipClosedMessage] = useState(
    OFFICIAL_SETTINGS.membership_closed_message ||
      'Membership applications for the current academic session are currently closed. The next cohort enrollment will open at the start of the upcoming semester.'
  );

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      // Check dev session storage first for immediate preview updates
      try {
        const cached =
          localStorage.getItem('sign_site_settings') ||
          sessionStorage.getItem('sign_site_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && isMounted) {
            if (parsed.membership_open !== undefined) setMembershipOpen(parsed.membership_open);
            if (parsed.membership_term_name) setMembershipTermName(parsed.membership_term_name);
            if (parsed.membership_start_date) setMembershipStartDate(parsed.membership_start_date);
            if (parsed.membership_end_date) setMembershipEndDate(parsed.membership_end_date);
            if (parsed.membership_closed_message) setMembershipClosedMessage(parsed.membership_closed_message);
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
          setMembershipOpen(setts.membership_open ?? true);
          if (setts.membership_term_name) setMembershipTermName(setts.membership_term_name);
          if (setts.membership_start_date) setMembershipStartDate(setts.membership_start_date);
          if (setts.membership_end_date) setMembershipEndDate(setts.membership_end_date);
          if (setts.membership_closed_message) setMembershipClosedMessage(setts.membership_closed_message);
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

    const isDevSession = !isSupabaseConfigured || Boolean(user?.id?.startsWith('dev-'));

    try {
      if (isDevSession) {
        setSuccessMsg('Academic copy and section text updated in local preview session!');
        return;
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

  const applyPreset = (preset: 'start_semester_30' | 'start_semester_14' | 'close_intake' | 'next_semester') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'start_semester_30') {
      const end = new Date();
      end.setDate(today.getDate() + 30);
      setMembershipOpen(true);
      setMembershipStartDate(formatDate(today));
      setMembershipEndDate(formatDate(end));
      setSuccessMsg('Preset applied: Open for 30 Days (Start of Semester)');
    } else if (preset === 'start_semester_14') {
      const end = new Date();
      end.setDate(today.getDate() + 14);
      setMembershipOpen(true);
      setMembershipStartDate(formatDate(today));
      setMembershipEndDate(formatDate(end));
      setSuccessMsg('Preset applied: Open for 14 Days (Flash Registration)');
    } else if (preset === 'close_intake') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      setMembershipOpen(false);
      setMembershipEndDate(formatDate(yesterday));
      setSuccessMsg('Preset applied: Intake Closed for Current Cycle');
    } else if (preset === 'next_semester') {
      const future = new Date();
      future.setDate(today.getDate() + 60);
      setMembershipOpen(true);
      setMembershipStartDate(formatDate(future));
      setMembershipEndDate('');
      setMembershipTermName('Spring 2027 Semester Intake');
      setSuccessMsg('Preset applied: Scheduled for Next Semester');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const isDevSession = !isSupabaseConfigured || Boolean(user?.id?.startsWith('dev-'));

    const settingsPayload = {
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
      membership_term_name: membershipTermName.trim() || null,
      membership_start_date: membershipStartDate || null,
      membership_end_date: membershipEndDate || null,
      membership_closed_message: membershipClosedMessage.trim() || null,
      membership_form_url: null,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    };

    try {
      localStorage.setItem('sign_site_settings', JSON.stringify(settingsPayload));
      sessionStorage.setItem('sign_site_settings', JSON.stringify(settingsPayload));
      window.dispatchEvent(
        new CustomEvent('sign_settings_updated', { detail: settingsPayload })
      );
    } catch {
      // ignore
    }

    if (isDevSession) {
      setIsSaving(false);
      setSuccessMsg('Official coordinates and semester intake schedule updated in local preview session!');
      return;
    }

    try {
      let { error } = await supabase
        .from('site_settings')
        .update(settingsPayload)
        .eq('id', 1);

      // Safe fallback if new columns are not yet added to remote Supabase
      if (error && error.message?.includes('column')) {
        const fallback = await supabase
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
            membership_form_url: null,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq('id', 1);
        error = fallback.error;
      }

      if (error) throw error;
      setSuccessMsg('Official coordinates and semester intake schedule updated successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating settings';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const liveEvaluation = evaluateMembershipIntake({
    membership_open: membershipOpen,
    membership_term_name: membershipTermName,
    membership_start_date: membershipStartDate || null,
    membership_end_date: membershipEndDate || null,
    membership_closed_message: membershipClosedMessage,
  });

  return (
    <div className="p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block mb-1">
              Institutional Settings
            </span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full mb-1 shadow-sm">
              {APP_VERSION}
            </span>
          </div>
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

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Membership applications are processed natively through the built-in website enrollment form.</span>
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

          {/* Academic Semester Membership Intake & Schedule Controls */}
          <div className="pt-6 border-t border-slate-800 space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Academic Semester Membership Intake & Schedule Controls
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Control the precise time window when student membership enrollment is active (e.g. at the start or end of academic semesters). When closed, students see an institutional notice explaining that intake is organized by semester cycles.
              </p>
            </div>

            {/* Live Student View Simulation Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                liveEvaluation.isOpen
                  ? 'bg-emerald-950/20 border-emerald-800/60'
                  : 'bg-amber-950/20 border-amber-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Live Public Site Preview
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    liveEvaluation.isOpen
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      liveEvaluation.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {liveEvaluation.badgeText}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{liveEvaluation.headline}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{liveEvaluation.message}</p>
            </div>

            {/* Quick Presets Bar */}
            <div>
              <span className="text-[11px] font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                One-Click Semester Presets:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('start_semester_30')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 transition-all cursor-pointer"
                >
                  Start of Semester (Open 30 Days)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('start_semester_14')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/40 hover:bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 transition-all cursor-pointer"
                >
                  Flash Enrollment (Open 14 Days)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('close_intake')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-800/60 transition-all cursor-pointer"
                >
                  End of Semester (Close Intake Now)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('next_semester')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-950/40 hover:bg-purple-950/70 text-purple-300 border border-purple-800/60 transition-all cursor-pointer"
                >
                  Next Semester (Open in 60 Days)
                </button>
              </div>
            </div>

            {/* Detailed Controls Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              {/* Manual Master Toggle */}
              <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMembershipOpen(!membershipOpen)}
                    className="text-cyan-400 focus:outline-none cursor-pointer"
                  >
                    {membershipOpen ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-600" />
                    )}
                  </button>
                  <div>
                    <span className="text-white font-bold text-sm block">
                      {membershipOpen ? 'Applications Manually Enabled' : 'Applications Manually Paused'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Master switch overriding date schedule. When OFF, applications close immediately.
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    membershipOpen ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {membershipOpen ? 'Active' : 'Paused'}
                </span>
              </div>

              {/* Term / Cohort Name */}
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Academic Term / Cohort Name
                </label>
                <input
                  type="text"
                  value={membershipTermName}
                  onChange={(e) => setMembershipTermName(e.target.value)}
                  placeholder="e.g. Fall 2026 Semester Intake or Spring 2027 Cohort"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Intake Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={membershipStartDate}
                  onChange={(e) => setMembershipStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  If set in future, displays "Opens on [Date]" countdown to students.
                </span>
              </div>

              {/* End Date / Deadline */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Intake Deadline / Close Date (Optional)
                </label>
                <input
                  type="date"
                  value={membershipEndDate}
                  onChange={(e) => setMembershipEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  At 11:59 PM on this date, intake automatically closes for the semester.
                </span>
              </div>

              {/* Custom Closed Announcement */}
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Custom Notice Displayed When Intake is Closed
                </label>
                <textarea
                  rows={2}
                  value={membershipClosedMessage}
                  onChange={(e) => setMembershipClosedMessage(e.target.value)}
                  placeholder="Explain when the next semester intake opens..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-300 hover:from-teal-300 hover:to-cyan-200 disabled:opacity-50 transition-all shadow-md cursor-pointer"
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
