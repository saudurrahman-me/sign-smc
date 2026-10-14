// ==============================================================================
// Database & Domain Types for SIGN Chapter SMC Swat
// ==============================================================================

export type UserRole = 'super_admin' | 'website_admin' | 'event_manager' | 'member';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export type EventCategory =
  | 'Seminars & Guest Lectures'
  | 'Case Discussions'
  | 'Journal Clubs'
  | 'Research Workshops'
  | 'Neurological Awareness Campaigns'
  | 'Academic Activities';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: number;
  organization_name: string;
  institution: string;
  affiliation: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  social_links: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    twitter?: string;
  };
  membership_open: boolean;
  membership_form_url?: string | null;
  membership_guidelines: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface SiteContent {
  id: string;
  key: string;
  title: string;
  subtitle: string | null;
  content: string;
  metadata: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
}

export interface LeadershipProfile {
  id: string;
  full_name: string;
  role_title: string;
  bio: string | null;
  academic_year: string | null;
  photo_url: string | null;
  contact_email: string | null;
  social_links: {
    linkedin?: string;
    twitter?: string;
    researchgate?: string;
    email?: string;
  };
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  is_virtual: boolean;
  organizer: string;
  cover_image_url: string | null;
  registration_url: string | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MembershipApplication {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  mbbs_year: string;
  student_id: string | null;
  motivation: string;
  research_interests: string | null;
  agreed_to_terms: boolean;
  status: ApplicationStatus;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
