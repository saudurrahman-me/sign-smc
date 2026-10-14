-- ==============================================================================
-- SIGN Chapter SMC Swat - Supabase Initial Schema & Security Migration
-- Student Interest Group in Neurology (SIGN), Saidu Medical College (SMC), Swat
-- Affiliated with Khyber Medical University (KMU)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('super_admin', 'website_admin', 'event_manager', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status_type AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_category_type AS ENUM (
        'Seminars & Guest Lectures',
        'Case Discussions',
        'Journal Clubs',
        'Research Workshops',
        'Neurological Awareness Campaigns',
        'Academic Activities'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role_type NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. SITE SETTINGS TABLE (Single row configuration)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    organization_name TEXT NOT NULL DEFAULT 'Student Interest Group in Neurology (SIGN)',
    institution TEXT NOT NULL DEFAULT 'Saidu Medical College (SMC), Swat',
    affiliation TEXT NOT NULL DEFAULT 'Khyber Medical University (KMU)',
    contact_email TEXT DEFAULT 'signsmc.official@gmail.com',
    contact_phone TEXT,
    address TEXT DEFAULT 'Saidu Medical College, Saidu Sharif, Swat, Khyber Pakhtunkhwa, Pakistan',
    social_links JSONB NOT NULL DEFAULT '{"instagram": "https://www.instagram.com/sign.smc", "facebook": "https://www.facebook.com/signsmc", "linkedin": "", "youtube": ""}'::jsonb,
    membership_open BOOLEAN NOT NULL DEFAULT true,
    membership_form_url TEXT DEFAULT 'https://forms.gle/jzUr115noQ1fDNdS8',
    membership_guidelines TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES auth.users(id)
);

-- 5. SITE CONTENT TABLE (Editable section texts)
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES auth.users(id)
);

-- 6. LEADERSHIP PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.leadership_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    bio TEXT,
    academic_year TEXT,
    photo_url TEXT,
    contact_email TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_leadership_order ON public.leadership_profiles(display_order);
CREATE INDEX IF NOT EXISTS idx_leadership_published ON public.leadership_profiles(is_published);

-- 7. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category event_category_type NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    venue TEXT NOT NULL,
    is_virtual BOOLEAN NOT NULL DEFAULT false,
    organizer TEXT NOT NULL DEFAULT 'SIGN SMC Chapter',
    cover_image_url TEXT,
    registration_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);

-- 8. MEMBERSHIP APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.membership_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    mbbs_year TEXT NOT NULL,
    student_id TEXT,
    motivation TEXT NOT NULL,
    research_interests TEXT,
    agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
    status application_status_type NOT NULL DEFAULT 'pending',
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_active_application_per_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_membership_user ON public.membership_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_status ON public.membership_applications(status);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    actor_email TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.audit_logs(resource_type, resource_id);

-- ==============================================================================
-- SECURITY & AUTHORIZATION FUNCTIONS (SECURITY DEFINER)
-- ==============================================================================

-- Helper: Get current user role safely
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: Super Admin Check
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Helper: Website Admin Check (Super Admin or Website Admin)
CREATE OR REPLACE FUNCTION public.is_website_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT role IN ('super_admin', 'website_admin') FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Helper: Event Manager Check (Super Admin or Event Manager)
CREATE OR REPLACE FUNCTION public.is_event_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT role IN ('super_admin', 'event_manager') FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Privilege escalation guard trigger on profiles:
-- Only Super Admins can alter the `role` column.
-- Also prevents removing or demoting the last Super Admin.
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    super_admin_count INT;
BEGIN
    IF (OLD.id IS DISTINCT FROM NEW.id) THEN
        RAISE EXCEPTION 'Immutable Field Blocked: Profile ID cannot be altered.';
    END IF;

    IF (OLD.email IS DISTINCT FROM NEW.email) AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Safety Guard Blocked: Profile email is managed by authentication provider.';
    END IF;

    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        IF NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Privilege Escalation Blocked: Only super administrators can change user roles.';
        END IF;

        IF (OLD.role = 'super_admin' AND NEW.role != 'super_admin') THEN
            SELECT count(*) INTO super_admin_count FROM public.profiles WHERE role = 'super_admin' AND id != OLD.id;
            IF super_admin_count = 0 THEN
                RAISE EXCEPTION 'Safety Guard Blocked: Cannot demote the last remaining super administrator.';
            END IF;
        END IF;
    END IF;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_profile_role_update ON public.profiles;
CREATE TRIGGER trg_check_profile_role_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_profile_role_update();

-- Automatic profile creation on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'member'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
-- Users can read their own profile; Super Admins can read all profiles
CREATE POLICY "Profiles are viewable by owner or super admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_super_admin());

-- Users can update their own profile (name, avatar), Super Admin can update all
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_super_admin());

-- 2. SITE SETTINGS POLICIES
-- Public read access
CREATE POLICY "Site settings are readable by everyone"
    ON public.site_settings FOR SELECT
    USING (true);

-- Website Admin and Super Admin can update settings
CREATE POLICY "Website Admin and Super Admin can update settings"
    ON public.site_settings FOR UPDATE
    USING (public.is_website_admin());

-- 3. SITE CONTENT POLICIES
-- Public read access
CREATE POLICY "Site content is readable by everyone"
    ON public.site_content FOR SELECT
    USING (true);

-- Website Admin and Super Admin can modify content
CREATE POLICY "Website Admin and Super Admin can insert site content"
    ON public.site_content FOR INSERT
    WITH CHECK (public.is_website_admin());

CREATE POLICY "Website Admin and Super Admin can update site content"
    ON public.site_content FOR UPDATE
    USING (public.is_website_admin());

CREATE POLICY "Super Admin can delete site content"
    ON public.site_content FOR DELETE
    USING (public.is_super_admin());

-- 4. LEADERSHIP PROFILES POLICIES
-- Public can view published profiles; Website Admin & Super Admin can view all
CREATE POLICY "Leadership profiles readable if published or admin"
    ON public.leadership_profiles FOR SELECT
    USING (is_published = true OR public.is_website_admin());

-- Website Admin & Super Admin can manage leadership
CREATE POLICY "Website Admin can insert leadership"
    ON public.leadership_profiles FOR INSERT
    WITH CHECK (public.is_website_admin());

CREATE POLICY "Website Admin can update leadership"
    ON public.leadership_profiles FOR UPDATE
    USING (public.is_website_admin());

CREATE POLICY "Website Admin can delete leadership"
    ON public.leadership_profiles FOR DELETE
    USING (public.is_website_admin());

-- 5. EVENTS POLICIES
-- Public can view published events; Event Manager & Super Admin can view all
CREATE POLICY "Events readable if published or event manager"
    ON public.events FOR SELECT
    USING (is_published = true OR public.is_event_manager());

-- Event Manager & Super Admin can manage events
CREATE POLICY "Event Manager can insert events"
    ON public.events FOR INSERT
    WITH CHECK (public.is_event_manager());

CREATE POLICY "Event Manager can update events"
    ON public.events FOR UPDATE
    USING (public.is_event_manager());

CREATE POLICY "Event Manager can delete events"
    ON public.events FOR DELETE
    USING (public.is_event_manager());

-- 6. MEMBERSHIP APPLICATIONS POLICIES
-- Strict Isolation: Applicants view ONLY their own. ONLY Super Admin can view all!
-- Website Admins and Event Managers CANNOT view private applications.
CREATE POLICY "Applications viewable by applicant or super admin only"
    ON public.membership_applications FOR SELECT
    USING (auth.uid() = user_id OR public.is_super_admin());

-- Authenticated users can insert their own application
CREATE POLICY "Authenticated users can submit application"
    ON public.membership_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id AND agreed_to_terms = true);

-- Applicants can update their own application if still pending, or withdraw it.
-- Enforce WITH CHECK to prevent modifying reviewer notes, reviewer identity, or approved/rejected status.
CREATE POLICY "Applicant can update pending application or withdraw"
    ON public.membership_applications FOR UPDATE
    USING (
        auth.uid() = user_id AND (status = 'pending' OR status = 'withdrawn')
    )
    WITH CHECK (
        auth.uid() = user_id
        AND (status = 'pending' OR status = 'withdrawn')
        AND reviewer_notes IS NULL
        AND reviewed_by IS NULL
        AND reviewed_at IS NULL
    );

-- Super Admin can review, evaluate, and update application status
CREATE POLICY "Super admin can review applications"
    ON public.membership_applications FOR UPDATE
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 7. AUDIT LOGS POLICIES
-- Only Super Admin can view audit logs
CREATE POLICY "Only super admin can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_super_admin());

-- Authorized system/admins and self-action actors can record audit entries with strict identity binding (no spoofing)
CREATE POLICY "Authorized actors can record audit entries"
    ON public.audit_logs FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = actor_id
        AND (
            public.is_super_admin()
            OR public.is_website_admin()
            OR public.is_event_manager()
            OR action LIKE 'membership_application_%'
        )
    );

-- Explicitly ensure Audit Logs are IMMUTABLE (No UPDATE or DELETE policies allowed for any role)

-- 8. SUPABASE STORAGE POLICIES
-- Ensure storage buckets exist and have strict RLS policies
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('leadership-portraits', 'leadership-portraits', true),
    ('event-banners', 'event-banners', true),
    ('applicant-documents', 'applicant-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: leadership-portraits
CREATE POLICY "Public read leadership portraits"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'leadership-portraits');

CREATE POLICY "Website Admin upload leadership portraits"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'leadership-portraits' AND public.is_website_admin());

CREATE POLICY "Website Admin update leadership portraits"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'leadership-portraits' AND public.is_website_admin());

CREATE POLICY "Website Admin delete leadership portraits"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'leadership-portraits' AND public.is_website_admin());

-- Storage RLS: event-banners
CREATE POLICY "Public read event banners"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-banners');

CREATE POLICY "Event Manager upload event banners"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'event-banners' AND public.is_event_manager());

CREATE POLICY "Event Manager update event banners"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'event-banners' AND public.is_event_manager());

CREATE POLICY "Event Manager delete event banners"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'event-banners' AND public.is_event_manager());

-- Storage RLS: applicant-documents (Strict Private Isolation)
CREATE POLICY "Applicant or super admin read documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'applicant-documents'
        AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_super_admin())
    );

CREATE POLICY "Applicant upload documents to own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'applicant-documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Applicant or super admin delete documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'applicant-documents'
        AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_super_admin())
    );

-- ==============================================================================
-- INITIAL SEED DATA (AUTHENTIC ACADEMIC CONTENT ONLY — NO FABRICATIONS)
-- ==============================================================================

-- Seed default settings
INSERT INTO public.site_settings (id, organization_name, institution, affiliation, contact_email, address, social_links, membership_form_url)
VALUES (
    1,
    'Student Interest Group in Neurology (SIGN)',
    'Saidu Medical College (SMC), Swat',
    'Khyber Medical University (KMU)',
    'signsmc.official@gmail.com',
    'Saidu Medical College, Saidu Sharif, Swat, Khyber Pakhtunkhwa, Pakistan',
    '{"instagram": "https://www.instagram.com/sign.smc", "facebook": "https://www.facebook.com/signsmc", "linkedin": "", "youtube": ""}'::jsonb,
    'https://forms.gle/jzUr115noQ1fDNdS8'
)
ON CONFLICT (id) DO NOTHING;

-- Seed authentic site content
INSERT INTO public.site_content (key, title, subtitle, content, metadata)
VALUES
(
    'preamble',
    'About SIGN',
    'Preamble & Institutional Foundation',
    'The Student Interest Group in Neurology (SIGN) Chapter at Saidu Medical College (SMC), Swat, is a student-led academic society established under the auspices of the institution and affiliated with Khyber Medical University (KMU). SIGN exists to nurture a generation of clinically grounded, research-oriented, and socially aware physicians who champion neurological health — at the bedside, in the community, and in the scientific literature.',
    '{}'::jsonb
),
(
    'mission',
    'Mission Statement',
    'Our Purpose and Commitment',
    'To empower MBBS students at Saidu Medical College to explore neuroscience through academic excellence, community engagement, and student-led research — building the next generation of neurologically literate physicians in Khyber Pakhtunkhwa.',
    '{}'::jsonb
),
(
    'vision',
    'Vision Statement',
    'Our Aspiration for KPK and Beyond',
    'To be the leading student neuroscience society in KPK — producing graduates who are clinically competent, research-active, and deeply committed to improving neurological health outcomes in underserved communities.',
    '{}'::jsonb
),
(
    'objectives',
    'Core Objectives',
    'Six Pillars of Academic & Clinical Action',
    '1. Cultivate student interest in clinical neurology, neuroscience research, and neurological public health.
2. Organize evidence-based academic events: seminars, case discussions, journal clubs, and LTE writing workshops.
3. Conduct community awareness campaigns on epilepsy, stroke, dementia, and mental health.
4. Facilitate student-led research and structured pathways toward scholarly publication.
5. Foster leadership, communication, and teamwork skills within the SMC student body.
6. Collaborate with national and international neuroscience networks, student organizations, and faculty mentors.',
    '{"list": [
        "Cultivate student interest in clinical neurology, neuroscience research, and neurological public health.",
        "Organize evidence-based academic events: seminars, case discussions, journal clubs, and LTE writing workshops.",
        "Conduct community awareness campaigns on epilepsy, stroke, dementia, and mental health.",
        "Facilitate student-led research and structured pathways toward scholarly publication.",
        "Foster leadership, communication, and teamwork skills within the SMC student body.",
        "Collaborate with national and international neuroscience networks, student organizations, and faculty mentors."
    ]}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Seed authentic leadership cards
INSERT INTO public.leadership_profiles (full_name, role_title, bio, academic_year, photo_url, contact_email, is_published, display_order)
VALUES
('Prof. Dr. Muhammad Ayub Khan', 'Patron-in-Chief', 'Patron-in-Chief of the Student Interest Group in Neurology (SIGN), Saidu Medical College (SMC), Swat. Providing institutional patronage, executive mentorship, and academic vision.', 'Patron-in-Chief SIGN SMC', '/leadership/prof-dr-muhammad-ayub-khan.jpg', NULL, true, 1),
('Dr. Fawad Ali', 'Chairman', 'Consultant Neurologist at Saidu Group of Teaching Hospitals (SGTH), Swat. Leading clinical neurology initiatives, student mentoring, and neurological education at the SIGN SMC Chapter.', 'Consultant Neurologist SGTH', '/leadership/dr-fawad-ali.jpg', NULL, true, 2),
('Dr. Amjad Iqbal', 'Scientific & Academic Advisor', 'Scientific & Academic Advisor for SIGN SMC. Consultant Neurologist & Stroke Specialist, directing scholarly research initiatives, journal clubs, and clinical neuroscience workshops.', 'Consultant Neurologist & Stroke Specialist', '/leadership/dr-amjad-iqbal.jpg', NULL, true, 3),
('Adil Khan', 'Founding President', 'Founding President of the Student Interest Group in Neurology (SIGN) Chapter at Saidu Medical College. Spearheading student leadership, chapter organization, neuroscience workshops, and research collaborations.', 'Founding President SIGN SMC', '/leadership/adil-khan.jpg', 'adilmusawir@gmail.com', true, 4),
('Saleem Jan', 'General Secretary', 'General Secretary of SIGN SMC. Overseeing executive administration, member coordination, chapter operations, and academic seminar scheduling.', 'General Secretary SIGN SMC', '/leadership/saleem-jan.jpg', 'sj3463586@gmail.com', true, 5),
('Waqar Younas', 'Finance Secretary', 'Managing financial stewardship, budget planning, event resources, and fiscal transparency for SIGN Chapter programs and academic conferences.', 'Finance Secretary SIGN SMC', '/leadership/finance-secretary.png', NULL, true, 6),
('Irshad Ahmad', 'Media & Communication Head', 'Directing public relations, academic communications, digital outreach, event media coverage, and neurological awareness campaigns for SIGN SMC.', 'Media & Communication Head SIGN SMC', '/leadership/media-head.jpg', 'irshadahmad.access@gmail.com', true, 7)
ON CONFLICT DO NOTHING;
