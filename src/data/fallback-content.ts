// ==============================================================================
// Authentic Default / Initial Organization Data
// Student Interest Group in Neurology (SIGN), Saidu Medical College (SMC), Swat
// Source of truth: Official Organizational Charter
// Note: No claims, achievements, or real personal details fabricated.
// ==============================================================================

import type { LeadershipProfile, SiteSettings } from '../types/database.types';
import drFawadAliImg from '../assets/leadership/dr-fawad-ali.jpg';
import profAyubKhanImg from '../assets/leadership/prof-dr-muhammad-ayub-khan.jpg';
import drAmjadIqbalImg from '../assets/leadership/dr-amjad-iqbal.jpg';
import adilKhanImg from '../assets/leadership/adil-khan.jpg';
import saleemJanImg from '../assets/leadership/saleem-jan.jpg';
import hadiaZahoorImg from '../assets/leadership/hadia-zahoor.jpg';
import yusraPanezaiImg from '../assets/leadership/yusra-panezai.jpg';
import financeSecretaryImg from '../assets/leadership/finance-secretary.png';
import mediaHeadImg from '../assets/leadership/media-head.jpg';

export const OFFICIAL_MEMBERSHIP_FORM_URL = 'https://forms.gle/jzUr115noQ1fDNdS8';

export const OFFICIAL_SETTINGS: SiteSettings = {
  id: 1,
  organization_name: 'Student Interest Group in Neurology (SIGN)',
  institution: 'Saidu Medical College (SMC), Swat',
  affiliation: 'Saidu Medical College (SMC), Swat',
  contact_email: 'signsmc.official@gmail.com',
  contact_phone: null,
  address: 'Saidu Medical College, Saidu Sharif, Swat, Khyber Pakhtunkhwa, Pakistan',
  social_links: {
    instagram: 'https://www.instagram.com/sign.smc',
    facebook: 'https://www.facebook.com/signsmc',
    linkedin: '',
    youtube: '',
  },
  membership_open: true,
  membership_term_name: 'Fall 2026 Semester Intake',
  membership_start_date: null,
  membership_end_date: null,
  membership_closed_message:
    'Membership applications for the current academic session are currently closed. The next cohort enrollment will open at the start of the upcoming semester.',
  membership_form_url: OFFICIAL_MEMBERSHIP_FORM_URL,
  membership_guidelines:
    'Membership is open to MBBS students at Saidu Medical College interested in neurology, clinical neuroscience, and student-led academic research.',
  updated_at: new Date().toISOString(),
  updated_by: null,
};

export const OFFICIAL_CONTENT = {
  preamble: {
    title: 'About SIGN',
    subtitle: 'Academic Society Preamble',
    content:
      'The Student Interest Group in Neurology (SIGN) Chapter at Saidu Medical College (SMC), Swat, is a student-led academic society established under the auspices of the institution. SIGN exists to nurture a generation of clinically grounded, research-oriented, and socially aware physicians who champion neurological health — at the bedside, in the community, and in the scientific literature.',
  },
  mission: {
    title: 'Mission Statement',
    subtitle: 'Our Purpose & Academic Mandate',
    content:
      'To empower MBBS students at Saidu Medical College to explore neuroscience through academic excellence, community engagement, and student-led research — building the next generation of neurologically literate physicians in Khyber Pakhtunkhwa.',
  },
  vision: {
    title: 'Vision Statement',
    subtitle: 'Our Long-Term Horizon for KPK',
    content:
      'To be the leading student neuroscience society in KPK — producing graduates who are clinically competent, research-active, and deeply committed to improving neurological health outcomes in underserved communities.',
  },
  objectives: {
    title: 'Core Objectives',
    subtitle: 'Six Action Pillars',
    items: [
      {
        number: 1,
        title: 'Cultivate Student Interest',
        description:
          'Cultivate student interest in clinical neurology, neuroscience research, and neurological public health.',
      },
      {
        number: 2,
        title: 'Organize Evidence-Based Events',
        description:
          'Organize evidence-based academic events: seminars, case discussions, journal clubs, and LTE writing workshops.',
      },
      {
        number: 3,
        title: 'Community Health Awareness',
        description:
          'Conduct community awareness campaigns on epilepsy, stroke, dementia, and mental health.',
      },
      {
        number: 4,
        title: 'Facilitate Scholarly Research',
        description:
          'Facilitate student-led research and structured pathways toward scholarly publication.',
      },
      {
        number: 5,
        title: 'Leadership & Teamwork Skills',
        description:
          'Foster leadership, communication, and teamwork skills within the SMC student body.',
      },
      {
        number: 6,
        title: 'Academic Networks & Mentorship',
        description:
          'Collaborate with national and international neuroscience networks, student organizations, and faculty mentors.',
      },
    ],
  },
};

// Official Leadership and Executive Board Profiles
export const INITIAL_LEADERSHIP_PLACEHOLDERS: LeadershipProfile[] = [
  {
    id: 'leader-1',
    full_name: 'Prof. Dr. Muhammad Ayub Khan',
    role_title: 'Patron-in-Chief',
    bio: 'It is a matter of pride to see SIGN SMC emerge as a platform for neurological education, research, and community service. I commend this initiative for fostering scientific curiosity, academic excellence, and compassionate healthcare. May SIGN SMC inspire future leaders in neuroscience and contribute meaningfully to the advancement of neurological care.',
    academic_year: 'Patron-in-Chief SIGN SMC',
    photo_url: profAyubKhanImg,
    contact_email: null,
    social_links: {},
    display_order: 1,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'leader-2',
    full_name: 'Dr. Fawad Ali',
    role_title: 'Chairman',
    bio: 'Neurology is a field where scientific discovery meets the complexity of human life. I appreciate SIGN SMC for inspiring medical students to explore neuroscience, pursue research, and promote neurological awareness. May this initiative nurture a generation of skilled, compassionate, and research-driven healthcare professionals.',
    academic_year: 'Consultant Neurologist SGTH',
    photo_url: drFawadAliImg,
    contact_email: null,
    social_links: {},
    display_order: 2,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'leader-3',
    full_name: 'Dr. Amjad Iqbal',
    role_title: 'Scientific & Academic Advisor',
    bio: 'Student-led initiatives are the foundation of academic growth and future innovation. SIGN SMC represents a promising step towards strengthening neurological education, research, and community engagement at Saidu Medical College. I wish the team success in building a lasting legacy of learning, leadership, and service to humanity.',
    academic_year: 'Consultant Neurologist & Stroke Specialist',
    photo_url: drAmjadIqbalImg,
    contact_email: null,
    social_links: {},
    display_order: 3,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'leader-4',
    full_name: 'Adil Khan',
    role_title: 'Founding President',
    bio: 'Founding President of the Student Interest Group in Neurology (SIGN) Chapter at Saidu Medical College. Spearheading student leadership, chapter organization, neuroscience workshops, and research collaborations.',
    academic_year: 'Founding President SIGN SMC',
    photo_url: adilKhanImg,
    contact_email: 'adilmusawir@gmail.com',
    social_links: {},
    display_order: 4,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'leader-5',
    full_name: 'Saleem Jan',
    role_title: 'General Secretary',
    bio: 'General Secretary of SIGN SMC. Overseeing executive administration, member coordination, chapter operations, and academic seminar scheduling.',
    academic_year: 'General Secretary SIGN SMC',
    photo_url: saleemJanImg,
    contact_email: 'sj3463586@gmail.com',
    social_links: {},
    display_order: 5,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'leader-10',
    full_name: 'Eshaal Khan',
    role_title: 'Executive Committee Member',
    bio: 'Executive Committee Member of SIGN SMC. Dedicated to advancing student engagement in neurological sciences, coordinating academic seminars, clinical workshops, and peer mentorship across Saidu Medical College.',
    academic_year: 'Executive Committee Member SIGN SMC',
    photo_url: 'https://images.unsplash.com/photo-1594824813501-483701476327?auto=format&fit=crop&q=80&w=600',
    contact_email: 'eshaal.smc@student.edu.pk',
    social_links: {},
    display_order: 6,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'leader-6',
    full_name: 'Hadia Zahoor',
    role_title: 'Co-Head, Event Organizing Committee',
    bio: 'Co-Head of the Event Organizing Committee at SIGN SMC. Facilitating neurology workshops, guest speaker coordination, academic symposia, and clinical seminar logistics.',
    academic_year: 'Co-Head Event Organizing Committee',
    photo_url: hadiaZahoorImg,
    contact_email: null,
    social_links: {},
    display_order: 7,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'leader-7',
    full_name: 'Irshad Ahmad',
    role_title: 'Media & Communication Head',
    bio: 'Media & Communication Head of SIGN SMC. Directing public relations, academic communications, digital outreach, event media coverage, and neurological awareness campaigns.',
    academic_year: 'Media & Communication Head SIGN SMC',
    photo_url: mediaHeadImg,
    contact_email: 'irshadahmad.access@gmail.com',
    social_links: {},
    display_order: 8,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'leader-8',
    full_name: 'Yusra Panezai',
    role_title: 'Head, Event Organizing Committee',
    bio: 'Head of the Event Organizing Committee at SIGN SMC. Leading chapter event planning, academic scheduling, venue management, and volunteer coordination for neuroscience programs.',
    academic_year: 'Head Event Organizing Committee',
    photo_url: yusraPanezaiImg,
    contact_email: null,
    social_links: {},
    display_order: 9,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'leader-9',
    full_name: 'Waqar Younas',
    role_title: 'Finance Secretary',
    bio: 'Managing financial stewardship, budget planning, event resources, and fiscal transparency for SIGN Chapter programs and academic conferences.',
    academic_year: 'Finance Secretary SIGN SMC',
    photo_url: financeSecretaryImg,
    contact_email: null,
    social_links: {},
    display_order: 10,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
