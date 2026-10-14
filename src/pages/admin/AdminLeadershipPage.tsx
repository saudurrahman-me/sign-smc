import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { LeadershipProfile } from '../../types/database.types';
import { INITIAL_LEADERSHIP_PLACEHOLDERS } from '../../data/fallback-content';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  User,
  Search,
  AlertCircle,
  X,
  Mail,
} from 'lucide-react';

export const AdminLeadershipPage: React.FC = () => {
  const [profiles, setProfiles] = useState<LeadershipProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<LeadershipProfile | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Executive Committee Member');
  const [bio, setBio] = useState('');
  const [academicYear, setAcademicYear] = useState('Final Year MBBS');
  const [photoUrl, setPhotoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [researchgate, setResearchgate] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfiles = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      setProfiles(INITIAL_LEADERSHIP_PLACEHOLDERS);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('leadership_profiles')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('[SIGN Admin Leadership] Error:', error.message);
      } else if (data) {
        setProfiles(data as LeadershipProfile[]);
      }
    } catch (err) {
      console.error('[SIGN Admin Leadership] Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const openCreateModal = () => {
    setEditingProfile(null);
    setFullName('');
    setRoleTitle('Executive Committee Member');
    setBio('');
    setAcademicYear('Final Year MBBS');
    setPhotoUrl('');
    setContactEmail('');
    setLinkedin('');
    setTwitter('');
    setResearchgate('');
    setDisplayOrder(profiles.length + 1);
    setIsPublished(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: LeadershipProfile) => {
    setEditingProfile(p);
    setFullName(p.full_name);
    setRoleTitle(p.role_title);
    setBio(p.bio || '');
    setAcademicYear(p.academic_year || '');
    setPhotoUrl(p.photo_url || '');
    setContactEmail(p.contact_email || '');
    setLinkedin(p.social_links?.linkedin || '');
    setTwitter(p.social_links?.twitter || '');
    setResearchgate(p.social_links?.researchgate || '');
    setDisplayOrder(p.display_order);
    setIsPublished(p.is_published);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !roleTitle.trim()) {
      setFormError('Name and Position are required fields.');
      return;
    }

    setIsSaving(true);
    try {
      const socialLinks: Record<string, string> = {};
      if (linkedin.trim()) socialLinks.linkedin = linkedin.trim();
      if (twitter.trim()) socialLinks.twitter = twitter.trim();
      if (researchgate.trim()) socialLinks.researchgate = researchgate.trim();

      const payload = {
        full_name: fullName.trim(),
        role_title: roleTitle.trim(),
        bio: bio.trim() || null,
        academic_year: academicYear.trim() || null,
        photo_url: photoUrl.trim() || null,
        contact_email: contactEmail.trim() || null,
        social_links: socialLinks,
        display_order: Number(displayOrder),
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      };

      if (!isSupabaseConfigured) {
        if (editingProfile) {
          setProfiles((prev) =>
            prev.map((item) =>
              item.id === editingProfile.id
                ? { ...item, ...payload, photo_url: payload.photo_url || item.photo_url }
                : item
            )
          );
        } else {
          const newEntry: LeadershipProfile = {
            id: `dev-lead-${Date.now()}`,
            ...payload,
            photo_url: payload.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
            created_at: new Date().toISOString(),
          };
          setProfiles((prev) => [...prev, newEntry]);
        }
        setIsModalOpen(false);
        return;
      }

      if (editingProfile) {
        const { error } = await supabase
          .from('leadership_profiles')
          .update(payload)
          .eq('id', editingProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('leadership_profiles').insert(payload);
        if (error) throw error;
      }

      setIsModalOpen(false);
      await fetchProfiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving profile';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async (p: LeadershipProfile) => {
    if (!isSupabaseConfigured) {
      setProfiles((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, is_published: !p.is_published } : item))
      );
      return;
    }
    try {
      const { error } = await supabase
        .from('leadership_profiles')
        .update({ is_published: !p.is_published, updated_at: new Date().toISOString() })
        .eq('id', p.id);

      if (error) throw error;
      setProfiles(
        profiles.map((item) => (item.id === p.id ? { ...item, is_published: !p.is_published } : item))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error toggling publication';
      alert(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;
    if (!isSupabaseConfigured) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    try {
      const { error } = await supabase.from('leadership_profiles').delete().eq('id', id);
      if (error) throw error;
      setProfiles(profiles.filter((p) => p.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting profile';
      alert(msg);
    }
  };

  const filtered = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 block mb-1">
            Governance Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Leadership & Candidate Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Maintain official designations, nominee rosters, portrait cards, and biographies.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#016533] via-emerald-600 to-[#016533] hover:from-[#015229] hover:to-emerald-500 transition-all shadow-md shadow-emerald-950/30"
        >
          <Plus className="w-4 h-4" />
          Add Profile / Candidate
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or office..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Ordered by publication rank
        </span>
      </div>

      {/* Profiles Grid */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading leadership directory...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((person) => (
            <div
              key={person.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-slate-400 flex-shrink-0">
                      {person.photo_url ? (
                        <img
                          src={person.photo_url}
                          alt={person.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{person.full_name}</h3>
                      <span className="text-teal-400 text-xs font-semibold block">
                        {person.role_title}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    #{person.display_order}
                  </span>
                </div>

                {person.academic_year && (
                  <p className="text-xs text-slate-400 mb-2 font-medium">
                    {person.academic_year}
                  </p>
                )}

                {person.contact_email && (
                  <p className="text-[11px] text-teal-400/90 font-mono flex items-center gap-1.5 mb-2.5 bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700/60">
                    <Mail className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span className="truncate">{person.contact_email}</span>
                  </p>
                )}

                {person.bio && (
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {person.bio}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => togglePublish(person)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                    person.is_published
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {person.is_published ? (
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

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(person)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(person.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                    title="Delete Profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Leadership Profiles</h3>
          <p className="text-xs text-slate-400 mt-1">
            Add nominees, executive committee members, or faculty advisors.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-colors"
          >
            Add First Profile
          </button>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingProfile ? 'Edit Leadership Profile' : 'Add Leadership Profile'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. / Mr. Full Name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Role / Position Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Chairman, General Secretary, Candidate"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Academic Year / Class
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. Final Year MBBS, SMC"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Display Order Rank (1, 2, 3...)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Biography</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short academic bio, clinical interests, or candidate manifesto statement..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Portrait Photograph URL
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://... secure photo link"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Public Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="officer@smc.edu.pk"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Twitter URL</label>
                  <input
                    type="url"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="https://twitter.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ResearchGate</label>
                  <input
                    type="url"
                    value={researchgate}
                    onChange={(e) => setResearchgate(e.target.value)}
                    placeholder="https://researchgate.net/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500 bg-slate-950 border-slate-800"
                  />
                  <span className="text-slate-300 font-semibold text-teal-300">
                    Publish immediately to chapter website
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
                  {isSaving ? 'Saving...' : editingProfile ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
