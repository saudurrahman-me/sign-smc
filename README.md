# Student Interest Group in Neurology (SIGN) Chapter — Saidu Medical College (SMC)

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-teal.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-emerald.svg)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-green.svg)](https://vitest.dev/)

An academic society web platform and role-based administrative system built for the **Student Interest Group in Neurology (SIGN) Chapter** at **Saidu Medical College (SMC), Swat, Pakistan**.

---

## 1. Architecture & Security Overview

- **Public Front**: Single-page vertically scrollable academic website accessible without login. Smooth anchor navigation across Hero, About (Preamble), Mission, Vision, Objectives, Leadership, Events, Membership, and Contact.
- **Three-Tier Role-Based Administration (`/admin`)**:
  - **Super Admin**: Full platform control, user privilege delegation, membership application review & decision recording, audit logs, and settings. Demotion guard prevents accidentally removing the final Super Admin.
  - **Website Admin**: Content updates (Preamble, Mission, Vision, Objectives), leadership profiles, verified social media channels. Strictly isolated from private membership records and role management.
  - **Event Manager**: Seminar and academic activity creation, scheduling, cover image management, publishing/unpublishing. Strictly isolated from private membership records, users, and site content.
- **Security & Authorization**:
  - PostgreSQL Row Level Security (RLS) enabled on 100% of tables.
  - `SECURITY DEFINER` role check functions prevent client-side privilege escalation.
  - Private applicant data accessible only to the applicant themselves and Super Admins.
  - Zero hardcoded mock users, zero client-side role circumvention, zero exposed secrets.

---

## 2. Prerequisites & Technology Stack

- **Node.js**: `v20.x` or higher (tested on Node v24)
- **Package Manager**: `npm`
- **Frontend Stack**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons
- **Backend Stack**: Supabase (PostgreSQL, Supabase Auth, Row Level Security, Storage)
- **Testing**: Vitest, React Testing Library, JSDOM

---

## 3. Local Development Setup

### Step 1: Clone and Install Dependencies
```bash
git clone <repo-url>
cd smc
npm install
```

### Step 2: Environment Variables Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your public Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:5173
```
> [!NOTE]
> Never put `SUPABASE_SERVICE_ROLE_KEY` in your `.env` or client files! Client code only uses the public anonymous key (`VITE_SUPABASE_ANON_KEY`).

### Step 3: Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Supabase Database & Security Migration

1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Open the migration file:
   [`supabase/migrations/20250101000000_sign_initial_schema.sql`](./supabase/migrations/20250101000000_sign_initial_schema.sql)
3. Copy and run the entire script. It provisions:
   - `profiles` table with automatic user creation trigger
   - `site_settings` with authentic initial configuration
   - `site_content` with verbatim Preamble, Mission, Vision, and Objectives
   - `leadership_profiles` with transparent "Pending Announcement" placeholders
   - `events` table with category constraints
   - `membership_applications` table with duplicate submission guard
   - `audit_logs` table for administrative tracing
   - RLS policies and `SECURITY DEFINER` role helper functions
   - Last Super Admin protection trigger

---

## 5. Initial Super Admin Bootstrap Procedure

To safely promote your initial user to **Super Admin** without client-side vulnerabilities:

1. Navigate to [http://localhost:5173/login](http://localhost:5173/login).
2. Click **Register** and create an account with your administrator email.
3. In your **Supabase Dashboard**, open the **SQL Editor** and run:
   ```sql
   UPDATE public.profiles
   SET role = 'super_admin'
   WHERE email = 'your-admin-email@example.edu.pk';
   ```
4. Sign out and sign back in. The **Admin Panel** link will now appear in your navbar, granting full access to `/admin`.
5. From `/admin/users`, you can now safely assign `website_admin` or `event_manager` roles to other committee members.

---

## 6. Testing & Quality Verification

Run unit and integration test suites:
```bash
npm test
```

Run production type-checking and bundling:
```bash
npm run build
```

Run preview server:
```bash
npm run preview
```

---

## 7. Free-Tier Production Deployment (Cloudflare Pages)

The static frontend is optimized for deployment to free-tier static hosting (e.g., Cloudflare Pages, Netlify, or Vercel):

### Cloudflare Pages Deployment
1. Connect your Git repository to **Cloudflare Pages**.
2. Set build configuration:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
3. In Cloudflare Pages Settings -> **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: `https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGci...`
4. In your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**:
   - Set **Site URL** to your Cloudflare Pages domain (e.g., `https://sign-smc.pages.dev`).
   - Add `https://sign-smc.pages.dev/**` to **Redirect URLs**.

---

## 8. Live Deployment Verification Checklist

- [ ] Homepage loads publicly without authentication.
- [ ] Preamble, Mission, Vision, and 6 Objectives render verbatim.
- [ ] Unannounced leadership cards show "Profile Pending" rather than fabricated names.
- [ ] Events section shows informative empty state until events are published.
- [ ] Unverified social media icons remain hidden until verified in `/admin/settings`.
- [ ] Applying for membership prompts login/registration before displaying the form.
- [ ] Submitted applications appear in the user's personal `/membership-status` portal.
- [ ] Super Admin can approve/decline applications and view immutable audit logs.
- [ ] Website Admin and Event Manager cannot access `/admin/applications` or promote roles.
- [ ] Production build succeeds with 0 lint and type errors.
