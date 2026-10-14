-- ==============================================================================
-- SIGN SMC - Storage Bucket & RLS Policy for Applicant Documents (Fee Proofs)
-- ==============================================================================

-- 1. Ensure applicant-documents bucket exists and is set to PUBLIC
-- Making the bucket public allows direct image rendering in the Admin Reviewer
-- and via direct screenshot links without token expiration.
INSERT INTO storage.buckets (id, name, public)
VALUES ('applicant-documents', 'applicant-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage RLS: Public read access for applicant documents
-- Allows anyone with the exact unguessable receipt URL (UUID + timestamp) to view the image
DROP POLICY IF EXISTS "Public read applicant documents" ON storage.objects;
DROP POLICY IF EXISTS "Applicant or super admin read documents" ON storage.objects;
DROP POLICY IF EXISTS "Applicant or admin read documents" ON storage.objects;

CREATE POLICY "Public read applicant documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'applicant-documents');

-- 3. Storage RLS: Upload access
-- Authenticated applicants can only upload to their own user-id folder
DROP POLICY IF EXISTS "Applicant upload documents to own folder" ON storage.objects;

CREATE POLICY "Applicant upload documents to own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'applicant-documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 4. Storage RLS: Maintenance & Delete
-- Applicants can manage their own files; administrators can manage all applicant files
DROP POLICY IF EXISTS "Applicant or super admin delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Applicant or admin manage documents" ON storage.objects;

CREATE POLICY "Applicant or admin manage documents"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'applicant-documents'
        AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR public.is_admin()
        )
    );
