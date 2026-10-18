// ==============================================================================
// SIGN SMC - Fallback & Seed Data for Event Certificates
// ==============================================================================

import type { EventCertificate } from '../types/database.types';

export const DEMO_CERTIFICATES: EventCertificate[] = [
  {
    id: 'demo-cert-1',
    user_id: 'dev-applicant-id',
    event_id: 'demo-evt-1',
    event_title: 'Clinical Neuroscience Symposium 2026',
    student_name: 'Zaryab Khan',
    student_email: 'zaryab.smc@student.edu.pk',
    student_id: 'SMC-2023-089',
    college_name: 'Saidu Medical College, Swat',
    mbbs_year: 'MBBS - 3rd Year',
    attendance_notes: 'Attended Keynote & Stroke Ward Clinical Demonstrations',
    status: 'approved',
    certificate_code: 'SIGN-CERT-2026-NEURO01',
    certificate_file_url: 'https://raw.githubusercontent.com/saudurrahman-me/sign-smc/main/public/sample-certificate.pdf',
    certificate_file_path: 'certificates/SIGN-CERT-2026-NEURO01.pdf',
    issued_at: '2026-10-15T10:00:00Z',
    reviewer_notes: 'Attendance confirmed by Event Secretariat.',
    reviewed_by: 'super-admin-id',
    reviewed_at: '2026-10-15T10:00:00Z',
    created_at: '2026-10-14T14:20:00Z',
    updated_at: '2026-10-15T10:00:00Z',
  },
  {
    id: 'demo-cert-2',
    user_id: 'dev-applicant-id-2',
    event_id: 'demo-evt-2',
    event_title: 'Acute Ischemic Stroke & Neuro-Imaging Masterclass',
    student_name: 'Ahmad Bilal',
    student_email: 'ahmad.bilal@student.edu.pk',
    student_id: 'SMC-2024-112',
    college_name: 'Saidu Medical College, Swat',
    mbbs_year: 'MBBS - 2nd Year',
    attendance_notes: 'CT/MRI Interpretation and Clinical Case Stations',
    status: 'pending',
    certificate_code: null,
    certificate_file_url: null,
    certificate_file_path: null,
    issued_at: null,
    reviewer_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-10-17T09:15:00Z',
    updated_at: '2026-10-17T09:15:00Z',
  },
];
