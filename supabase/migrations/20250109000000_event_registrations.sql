-- ==============================================================================
-- SIGN SMC - Academic Event Registrations System
-- Migration: 20250109000000_event_registrations.sql
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

-- 2. Create event_registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    college_name TEXT DEFAULT 'Saidu Medical College, Swat',
    mbbs_year TEXT DEFAULT 'MBBS - 3rd Year',
    student_id TEXT,
    questions_or_notes TEXT,
    attendance_status TEXT NOT NULL DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'cancelled')),
    registration_code TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Unique index to prevent duplicate registrations for the same event by email
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_event_email ON public.event_registrations(event_id, LOWER(email));

-- Fast indexes
CREATE INDEX IF NOT EXISTS idx_event_reg_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_code ON public.event_registrations(registration_code);
CREATE INDEX IF NOT EXISTS idx_event_reg_status ON public.event_registrations(attendance_status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT ON TABLE public.event_registrations TO anon;
GRANT ALL ON TABLE public.event_registrations TO authenticated, service_role;

-- 2. RLS Policies
-- Public / Authenticated users can register for an event
DROP POLICY IF EXISTS "Public can submit event registration" ON public.event_registrations;
CREATE POLICY "Public can submit event registration"
    ON public.event_registrations FOR INSERT
    WITH CHECK (true);

-- Users can view their own registrations; Admins can view all
DROP POLICY IF EXISTS "Users can view own registrations" ON public.event_registrations;
CREATE POLICY "Users can view own registrations"
    ON public.event_registrations FOR SELECT
    USING (
        auth.uid() = user_id 
        OR (auth.jwt() ->> 'email') = email
        OR public.is_website_admin() 
        OR public.is_event_manager() 
        OR public.is_super_admin()
    );

-- Admins can update attendance status or registration notes
DROP POLICY IF EXISTS "Admins can update event registrations" ON public.event_registrations;
CREATE POLICY "Admins can update event registrations"
    ON public.event_registrations FOR UPDATE
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

-- Admins can delete registrations
DROP POLICY IF EXISTS "Admins can delete event registrations" ON public.event_registrations;
CREATE POLICY "Admins can delete event registrations"
    ON public.event_registrations FOR DELETE
    USING (
        public.is_website_admin() 
        OR public.is_event_manager() 
        OR public.is_super_admin()
    );
