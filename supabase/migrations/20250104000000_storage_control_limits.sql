-- ==============================================================================
-- SIGN SMC - Storage Control & Security Limits for Applicant Documents
-- ==============================================================================

-- 1. Enforce strict upload constraints on the applicant-documents storage bucket:
--    - file_size_limit: 5,242,880 bytes (5 MB hard limit at the Supabase storage engine)
--    - allowed_mime_types: Restrict uploads strictly to valid receipt image formats
-- Client-side compression automatically reduces mobile screenshots from 3-8 MB down
-- to ~150 KB before transmission, and this policy protects against rogue/uncompressed payloads.

UPDATE storage.buckets
SET 
    file_size_limit = 5242880, -- 5 MB in bytes
    allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif'
    ]
WHERE id = 'applicant-documents';

-- 2. Verify applicant or admin delete policy exists on storage objects
-- Note: Already created in 20250102000000_applicant_documents_storage_fix.sql.
-- Ensure super administrators and committee members can permanently purge receipt files
-- to reclaim quota as part of data hygiene.
