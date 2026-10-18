-- ==============================================================================
-- SIGN SMC - Website Admin Permissions for Events & Membership Applications
-- Migration: 20250107000000_website_admin_permissions.sql
-- ==============================================================================

-- 1. Ensure site_settings columns exist for academic intake schedule
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS membership_term_name TEXT DEFAULT 'Fall 2026 Semester Intake',
ADD COLUMN IF NOT EXISTS membership_start_date DATE,
ADD COLUMN IF NOT EXISTS membership_end_date DATE,
ADD COLUMN IF NOT EXISTS membership_closed_message TEXT DEFAULT 'Membership applications for the current academic session are currently closed. The next cohort enrollment will open at the start of the upcoming semester.';

-- 2. Update events table policies: Allow website_admin alongside event_manager and super_admin
DROP POLICY IF EXISTS "Events readable if published or event manager" ON public.events;
CREATE POLICY "Events readable if published or event manager"
    ON public.events FOR SELECT
    USING (is_published = true OR public.is_event_manager() OR public.is_website_admin());

DROP POLICY IF EXISTS "Event Manager can insert events" ON public.events;
CREATE POLICY "Event Manager can insert events"
    ON public.events FOR INSERT
    WITH CHECK (public.is_event_manager() OR public.is_website_admin());

DROP POLICY IF EXISTS "Event Manager can update events" ON public.events;
CREATE POLICY "Event Manager can update events"
    ON public.events FOR UPDATE
    USING (public.is_event_manager() OR public.is_website_admin());

DROP POLICY IF EXISTS "Event Manager can delete events" ON public.events;
CREATE POLICY "Event Manager can delete events"
    ON public.events FOR DELETE
    USING (public.is_event_manager() OR public.is_website_admin());

-- 3. Update membership_applications table policies: Allow website_admin alongside super_admin
DROP POLICY IF EXISTS "Applications viewable by applicant or super admin only" ON public.membership_applications;
CREATE POLICY "Applications viewable by applicant or super admin only"
    ON public.membership_applications FOR SELECT
    USING (auth.uid() = user_id OR public.is_website_admin());

DROP POLICY IF EXISTS "Super admin can review applications" ON public.membership_applications;
CREATE POLICY "Super admin can review applications"
    ON public.membership_applications FOR UPDATE
    USING (public.is_website_admin())
    WITH CHECK (public.is_website_admin());

-- 4. Storage Bucket Policies: Allow website_admin on applicant-documents and event-banners
DROP POLICY IF EXISTS "Admins can view applicant documents" ON storage.objects;
CREATE POLICY "Admins can view applicant documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'applicant-documents' AND public.is_website_admin());

DROP POLICY IF EXISTS "Admins can delete applicant documents" ON storage.objects;
CREATE POLICY "Admins can delete applicant documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'applicant-documents' AND public.is_website_admin());

DROP POLICY IF EXISTS "Admins can manage event banners" ON storage.objects;
CREATE POLICY "Admins can manage event banners"
    ON storage.objects FOR ALL
    USING (bucket_id = 'event-banners' AND (public.is_event_manager() OR public.is_website_admin()));
