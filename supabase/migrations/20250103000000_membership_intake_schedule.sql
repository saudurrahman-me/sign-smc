-- ==============================================================================
-- SIGN SMC - Academic Semester Membership Intake & Schedule Controls
-- ==============================================================================

-- Add intake window columns to site_settings table
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS membership_term_name TEXT DEFAULT 'Fall 2026 Semester Intake',
ADD COLUMN IF NOT EXISTS membership_start_date DATE,
ADD COLUMN IF NOT EXISTS membership_end_date DATE,
ADD COLUMN IF NOT EXISTS membership_closed_message TEXT DEFAULT 'Membership applications for the current academic session are currently closed. The next cohort enrollment will open at the start of the upcoming semester.';

-- Ensure default initial row has clean values
UPDATE public.site_settings
SET 
    membership_term_name = COALESCE(membership_term_name, 'Fall 2026 Semester Intake'),
    membership_closed_message = COALESCE(membership_closed_message, 'Membership applications for the current academic session are currently closed. The next cohort enrollment will open at the start of the upcoming semester.')
WHERE id = 1;
