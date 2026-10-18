-- ==============================================================================
-- SIGN SMC - Event Payments, Fees & Ambassador Discount System
-- Migration: 20250110000000_event_payment_system.sql
-- ==============================================================================

-- 1. Add pricing and payment configuration columns to public.events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS registration_fee NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_instructions TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT 'Easypaisa',
ADD COLUMN IF NOT EXISTS account_title TEXT DEFAULT 'Waqar Younas',
ADD COLUMN IF NOT EXISTS account_number TEXT DEFAULT '03179752692',
ADD COLUMN IF NOT EXISTS ambassador_code TEXT DEFAULT 'AMBASSADOR',
ADD COLUMN IF NOT EXISTS ambassador_discount_percent NUMERIC NOT NULL DEFAULT 20;

-- 2. Add payment, receipt proof, and ambassador referral columns to public.event_registrations
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS fee_amount NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ambassador_code TEXT,
ADD COLUMN IF NOT EXISTS discount_applied NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'free' CHECK (payment_status IN ('free', 'pending', 'verified')),
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- 3. Storage policy for event receipts
-- Ensure applicant-documents bucket allows upload into event-receipts folder
DROP POLICY IF EXISTS "Anyone can upload event payment receipts" ON storage.objects;
CREATE POLICY "Anyone can upload event payment receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'applicant-documents'
        AND (name LIKE 'event-receipts/%' OR name LIKE 'events/%')
    );
