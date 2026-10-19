// ==============================================================================
// Database & Domain Types for SIGN Chapter SMC Swat
// ==============================================================================

export type UserRole = 'super_admin' | 'website_admin' | 'event_manager' | 'member' | 'applicant';

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
  membership_term_name?: string | null;
  membership_start_date?: string | null;
  membership_end_date?: string | null;
  membership_closed_message?: string | null;
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

  // Pricing, Payment & Support Settings
  is_paid?: boolean;
  registration_fee?: number;
  payment_instructions?: string | null;
  bank_name?: string | null;
  account_title?: string | null;
  account_number?: string | null;
  ambassador_code?: string | null;
  ambassador_discount_percent?: number | null;
  max_attendees?: number | null;
  support_phone?: string | null;
  support_email?: string | null;
  support_instructions?: string | null;

  // Registration Status & Deadline Controls
  is_registration_open?: boolean;
  registration_deadline?: string | null;
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
  college_name?: string | null;
  degree?: string | null;
  year_of_study?: string | null;
  expected_graduation_year?: string | null;
  payment_proof_url?: string | null;
  previous_experience?: string | null;
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

export type CertificateStatus = 'pending' | 'approved' | 'declined';

export interface EventCertificate {
  id: string;
  user_id: string;
  event_id?: string | null;
  event_title: string;
  student_name: string;
  student_email: string;
  student_id?: string | null;
  college_name?: string | null;
  mbbs_year?: string | null;
  attendance_notes?: string | null;
  status: CertificateStatus;
  certificate_code?: string | null;
  certificate_file_url?: string | null;
  certificate_file_path?: string | null;
  issued_at?: string | null;
  reviewer_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = 'registered' | 'attended';
export type PaymentStatus = 'free' | 'pending' | 'verified';

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  college_name: string;
  mbbs_year: string;
  student_id: string | null;
  questions_or_notes: string | null;
  attendance_status: AttendanceStatus;
  registration_code: string;
  created_at: string;
  updated_at?: string;
  event_title?: string;
  event_date?: string;

  // Payment & Ambassador details
  is_paid?: boolean;
  fee_amount?: number;
  amount_paid?: number;
  ambassador_code?: string | null;
  discount_applied?: number;
  payment_proof_url?: string | null;
  payment_status?: PaymentStatus;
  transaction_id?: string | null;
}


