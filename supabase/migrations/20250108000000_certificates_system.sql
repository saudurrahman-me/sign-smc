-- ==============================================================================
-- SIGN SMC - Event Certificates & Verification System
-- Migration: 20250108000000_certificates_system.sql
-- ==============================================================================

-- 1. Helper Functions (Idempotent definitions)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_website_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT role IN ('super_admin', 'website_admin') FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_event_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT role IN ('super_admin', 'event_manager') FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- 2. Create event_certificates table
CREATE TABLE IF NOT EXISTS public.event_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    event_title TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_id TEXT,
    college_name TEXT DEFAULT 'Saidu Medical College, Swat',
    mbbs_year TEXT,
    attendance_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    certificate_code TEXT UNIQUE,
    certificate_file_url TEXT,
    certificate_file_path TEXT,
    issued_at TIMESTAMPTZ,
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_event_certificates_user_id ON public.event_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_event_certificates_code ON public.event_certificates(certificate_code);
CREATE INDEX IF NOT EXISTS idx_event_certificates_status ON public.event_certificates(status);

-- Enable RLS
ALTER TABLE public.event_certificates ENABLE ROW LEVEL SECURITY;

-- Permissions
GRANT SELECT ON TABLE public.event_certificates TO anon;
GRANT ALL ON TABLE public.event_certificates TO authenticated, service_role;

-- 3. RLS Policies
-- Users can view their own requests, or admins can view all
DROP POLICY IF EXISTS "Users can view own certificates" ON public.event_certificates;
CREATE POLICY "Users can view own certificates"
    ON public.event_certificates FOR SELECT
    USING (
        auth.uid() = user_id 
        OR public.is_website_admin() 
        OR public.is_event_manager() 
        OR public.is_super_admin()
    );

-- Public can verify approved certificates by code or QR link
DROP POLICY IF EXISTS "Public can view approved certificates by code" ON public.event_certificates;
CREATE POLICY "Public can view approved certificates by code"
    ON public.event_certificates FOR SELECT
    USING (status = 'approved' AND certificate_code IS NOT NULL);

-- Authenticated users can submit a certificate request for themselves
DROP POLICY IF EXISTS "Authenticated users can submit certificate request" ON public.event_certificates;
CREATE POLICY "Authenticated users can submit certificate request"
    ON public.event_certificates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins (super_admin, website_admin, event_manager) can review and issue certificates
DROP POLICY IF EXISTS "Admins can update certificate requests" ON public.event_certificates;
CREATE POLICY "Admins can update certificate requests"
    ON public.event_certificates FOR UPDATE
    USING (
        public.is_website_admin() 
        OR public.is_event_manager() 
        OR public.is_super_admin()
    )
    WITH CHECK (
        public.is_website_admin() 
        OR public.is_event_manager() 
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "Admins can delete certificate requests" ON public.event_certificates;
CREATE POLICY "Admins can delete certificate requests"
    ON public.event_certificates FOR DELETE
    USING (
        public.is_website_admin() 
        OR public.is_event_manager() 
        OR public.is_super_admin()
    );

-- 4. Storage Bucket for Certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read/download certificate files
DROP POLICY IF EXISTS "Anyone can download certificates" ON storage.objects;
CREATE POLICY "Anyone can download certificates"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'certificates');

-- Admins can upload, modify, and delete certificate files
DROP POLICY IF EXISTS "Admins can upload certificates" ON storage.objects;
CREATE POLICY "Admins can upload certificates"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'certificates' AND (
            public.is_website_admin() 
            OR public.is_event_manager() 
            OR public.is_super_admin()
        )
    );

DROP POLICY IF EXISTS "Admins can manage certificate files" ON storage.objects;
CREATE POLICY "Admins can manage certificate files"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'certificates' AND (
            public.is_website_admin() 
            OR public.is_event_manager() 
            OR public.is_super_admin()
        )
    );
