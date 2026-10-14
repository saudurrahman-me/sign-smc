-- ==============================================================================
-- SIGN SMC - Leadership Profile Update: Eshaal Khan (Executive Committee Member)
-- ==============================================================================

-- 1. Upsert Eshaal Khan as an official Executive Committee Member
INSERT INTO public.leadership_profiles (
    id,
    full_name,
    role_title,
    bio,
    academic_year,
    photo_url,
    contact_email,
    social_links,
    display_order,
    is_published
) VALUES (
    'leader-10',
    'Eshaal Khan',
    'Executive Committee Member',
    'Executive Committee Member of SIGN SMC. Dedicated to advancing student engagement in neurological sciences, coordinating academic seminars, clinical workshops, and peer mentorship across Saidu Medical College.',
    'Executive Committee Member SIGN SMC',
    'https://images.unsplash.com/photo-1594824813501-483701476327?auto=format&fit=crop&q=80&w=600',
    'eshaal.smc@student.edu.pk',
    '{}'::jsonb,
    10,
    true
)
ON CONFLICT (id) DO UPDATE SET
    bio = EXCLUDED.bio,
    role_title = EXCLUDED.role_title,
    academic_year = EXCLUDED.academic_year,
    photo_url = COALESCE(public.leadership_profiles.photo_url, EXCLUDED.photo_url),
    contact_email = COALESCE(public.leadership_profiles.contact_email, EXCLUDED.contact_email),
    display_order = 10,
    is_published = true;

-- 2. Update any existing duplicate/partial entry added via the Admin Portal
UPDATE public.leadership_profiles
SET 
    bio = 'Executive Committee Member of SIGN SMC. Dedicated to advancing student engagement in neurological sciences, coordinating academic seminars, clinical workshops, and peer mentorship across Saidu Medical College.',
    role_title = 'Executive Committee Member',
    academic_year = 'Executive Committee Member SIGN SMC',
    photo_url = COALESCE(photo_url, 'https://images.unsplash.com/photo-1594824813501-483701476327?auto=format&fit=crop&q=80&w=600'),
    contact_email = COALESCE(contact_email, 'eshaal.smc@student.edu.pk'),
    display_order = 10,
    is_published = true
WHERE full_name ILIKE '%eshaal%';
