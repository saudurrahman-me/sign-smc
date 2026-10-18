import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EventRegistrationModal } from '../components/public/EventRegistrationModal';
import { EventsSection } from '../components/public/EventsSection';
import { AuthContext, type AuthContextType } from '../context/AuthContext';
import type { EventItem, EventRegistration } from '../types/database.types';

const mockEvent: EventItem = {
  id: 'test-event-uuid-1234',
  title: 'Clinical Neuroscience Symposium 2026',
  description: 'Interactive clinicopathological case discussion and symposium.',
  category: 'Seminars & Guest Lectures',
  event_date: '2026-12-01',
  start_time: '10:00:00',
  end_time: '13:00:00',
  venue: 'Saidu Medical College Main Auditorium',
  is_virtual: false,
  organizer: 'SIGN SMC Chapter',
  cover_image_url: null,
  registration_url: null,
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: null,
  is_paid: false,
  registration_fee: 0,
};

const mockPaidEvent: EventItem = {
  id: 'test-paid-event-uuid-5678',
  title: 'Advanced Stroke Localization & Thrombolytic Workshop 2026',
  description: 'Hands-on practical neuro-imaging and clinical thrombolysis workshop.',
  category: 'Research Workshops',
  event_date: '2026-12-15',
  start_time: '09:00:00',
  end_time: '14:00:00',
  venue: 'Saidu Teaching Hospital Neurology Lab',
  is_virtual: false,
  organizer: 'SIGN Academic Board',
  cover_image_url: null,
  registration_url: null,
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: null,
  is_paid: true,
  registration_fee: 500,
  bank_name: 'Easypaisa',
  account_title: 'Waqar Younas',
  account_number: '03179752692',
  ambassador_code: 'AMBASSADOR, SMC2026',
  ambassador_discount_percent: 20,
};

describe('Event Registration System', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders registration form fields when modal is open for a free event', () => {
    render(
      <EventRegistrationModal
        isOpen={true}
        onClose={() => {}}
        event={mockEvent}
      />
    );

    expect(screen.getByText('Event Registration')).toBeInTheDocument();
    expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    expect(screen.getByText(/Free Registration/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Dr\. Muhammad Ahmad/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/student@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/0300-1234567/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm Registration/i)).toBeInTheDocument();
  });

  it('successfully completes registration and displays attendee pass with unique code for free event', async () => {
    const handleSuccess = vi.fn();

    render(
      <EventRegistrationModal
        isOpen={true}
        onClose={() => {}}
        event={mockEvent}
        onRegistrationSuccess={handleSuccess}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Dr\. Muhammad Ahmad/i), {
      target: { value: 'Dr. Shahzad Khan' },
    });
    fireEvent.change(screen.getByPlaceholderText(/student@example\.com/i), {
      target: { value: 'shahzad@smc.edu.pk' },
    });
    fireEvent.change(screen.getByPlaceholderText(/0300-1234567/i), {
      target: { value: '0345-9876543' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirm Registration/i }));

    await waitFor(() => {
      expect(screen.getByText('Registration Confirmed!')).toBeInTheDocument();
    });

    expect(screen.getByText(/SIGN SMC • Attendee Pass/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Shahzad Khan/i)).toBeInTheDocument();
    expect(screen.getByText(/SMC-REG-/i)).toBeInTheDocument();
    expect(screen.getByText(/Add to Calendar/i)).toBeInTheDocument();

    // Verify localStorage contains the saved registration
    const stored = JSON.parse(localStorage.getItem('sign_event_registrations') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].full_name).toBe('Dr. Shahzad Khan');
    expect(stored[0].email).toBe('shahzad@smc.edu.pk');
    expect(handleSuccess).toHaveBeenCalledTimes(1);
  });

  it('prevents duplicate registration for the same event and email', async () => {
    // Pre-populate with existing registration
    const existing = [
      {
        id: 'reg-existing-1',
        event_id: mockEvent.id,
        full_name: 'Dr. Existing Attendee',
        email: 'duplicate@smc.edu.pk',
        phone: '0300-1112233',
        college_name: 'Saidu Medical College, Swat',
        mbbs_year: 'MBBS - 4th Year',
        student_id: null,
        questions_or_notes: null,
        attendance_status: 'registered',
        registration_code: 'SMC-REG-TEST-DUPE',
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem('sign_event_registrations', JSON.stringify(existing));

    render(
      <EventRegistrationModal
        isOpen={true}
        onClose={() => {}}
        event={mockEvent}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Dr\. Muhammad Ahmad/i), {
      target: { value: 'Another Name' },
    });
    fireEvent.change(screen.getByPlaceholderText(/student@example\.com/i), {
      target: { value: 'duplicate@smc.edu.pk' },
    });
    fireEvent.change(screen.getByPlaceholderText(/0300-1234567/i), {
      target: { value: '0312-3456789' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirm Registration/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/You have already registered for this event with this email address/i)
      ).toBeInTheDocument();
    });
  });

  it('renders fee, bank account details, ambassador/member code input, and transaction support instructions for a paid event', () => {
    render(
      <EventRegistrationModal
        isOpen={true}
        onClose={() => {}}
        event={mockPaidEvent}
      />
    );

    expect(screen.getByText(/Registration Fee & Payment Details/i)).toBeInTheDocument();
    expect(screen.getAllByText('PKR 500').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Easypaisa Payment Details/i)).toBeInTheDocument();
    expect(screen.getByText('Waqar Younas')).toBeInTheDocument();
    expect(screen.getByText('03179752692')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Ambassador \/ Member Code/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Payment Proof Screenshot/i)).toBeInTheDocument();

    // Verify transaction support instructions and mandatory transaction ID
    expect(
      screen.getByText(/Encountering a Transaction Error or Payment Issue\?/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/0317-9752692/i)).toBeInTheDocument();
    expect(screen.getByText(/signsmc\.official@gmail\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Mandatory for verification/i)).toBeInTheDocument();
  });

  it('validates and applies ambassador/member discount code correctly', async () => {
    render(
      <EventRegistrationModal
        isOpen={true}
        onClose={() => {}}
        event={mockPaidEvent}
      />
    );

    const ambassadorInput = screen.getByPlaceholderText(/Enter Ambassador \/ Member Code/i);
    const applyBtn = screen.getByRole('button', { name: /Apply/i });

    // Try invalid code
    fireEvent.change(ambassadorInput, { target: { value: 'INVALID_CODE' } });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid ambassador or member code/i)).toBeInTheDocument();
    });

    // Enter valid ambassador code
    fireEvent.change(ambassadorInput, { target: { value: 'AMBASSADOR' } });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText(/20% discount/i)).toBeInTheDocument();
      expect(screen.getByText(/20% OFF APPLIED/i)).toBeInTheDocument();
    });

    // Final fee: PKR 500 - 20% (100) = PKR 400
    expect(screen.getByText('PKR 400')).toBeInTheDocument();
  });

  it('enforces mandatory transaction ID and payment receipt upload when registering for a paid event', async () => {
    render(
      <EventRegistrationModal
        isOpen={true}
        onClose={() => {}}
        event={mockPaidEvent}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Dr\. Muhammad Ahmad/i), {
      target: { value: 'Dr. Tariq Mahmood' },
    });
    fireEvent.change(screen.getByPlaceholderText(/student@example\.com/i), {
      target: { value: 'tariq@smc.edu.pk' },
    });
    fireEvent.change(screen.getByPlaceholderText(/0300-1234567/i), {
      target: { value: '0333-1234567' },
    });

    // 1. Click submit without transaction ID
    fireEvent.click(screen.getByRole('button', { name: /Submit Registration & Payment/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter your Transaction ID or Bank Reference Number for payment verification/i)
      ).toBeInTheDocument();
    });

    // 2. Fill Transaction ID but without payment proof receipt
    const trxInput = screen.getByPlaceholderText(/e\.g\. TRX-|Easypaisa TID/i);
    fireEvent.change(trxInput, { target: { value: 'TRX-12345678' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Registration & Payment/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Please upload proof of your event fee payment/i)
      ).toBeInTheDocument();
    });
  });

  it('successfully uploads payment receipt and completes paid event registration with mandatory transaction ID', async () => {
    const handleSuccess = vi.fn();

    render(
      <EventRegistrationModal
        isOpen={true}
        onClose={() => {}}
        event={mockPaidEvent}
        onRegistrationSuccess={handleSuccess}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Dr\. Muhammad Ahmad/i), {
      target: { value: 'Dr. Fatima Tariq' },
    });
    fireEvent.change(screen.getByPlaceholderText(/student@example\.com/i), {
      target: { value: 'fatima.tariq@smc.edu.pk' },
    });
    fireEvent.change(screen.getByPlaceholderText(/0300-1234567/i), {
      target: { value: '0345-1122334' },
    });

    // Apply ambassador/member code
    const ambassadorInput = screen.getByPlaceholderText(/Enter Ambassador \/ Member Code/i);
    fireEvent.change(ambassadorInput, { target: { value: 'SMC2026' } });
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));

    await waitFor(() => {
      expect(screen.getByText(/20% discount/i)).toBeInTheDocument();
    });

    // Enter mandatory transaction ID
    const trxInput = screen.getByPlaceholderText(/e\.g\. TRX-|Easypaisa TID/i);
    fireEvent.change(trxInput, { target: { value: 'EP-9988776655' } });

    // Attach fake payment receipt
    const fakeFile = new File(['receipt-image-content'], 'easypaisa_receipt.jpg', {
      type: 'image/jpeg',
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Payment proof attached/i)).toBeInTheDocument();
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Submit Registration & Payment/i }));

    await waitFor(() => {
      expect(screen.getByText('Registration Confirmed!')).toBeInTheDocument();
    });

    expect(screen.getByText(/Payment Pending Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/PKR 400/i)).toBeInTheDocument();
    expect(screen.getByText(/Ambassador \/ Member Code \(SMC2026\)/i)).toBeInTheDocument();
    expect(screen.getByText('EP-9988776655')).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('sign_event_registrations') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].is_paid).toBe(true);
    expect(stored[0].fee_amount).toBe(500);
    expect(stored[0].amount_paid).toBe(400);
    expect(stored[0].ambassador_code).toBe('SMC2026');
    expect(stored[0].discount_applied).toBe(100);
    expect(stored[0].payment_status).toBe('pending');
    expect(stored[0].transaction_id).toBe('EP-9988776655');
  });

  it('renders Register button and pricing badge for upcoming events on EventsSection', async () => {
    sessionStorage.setItem('sign_dev_events', JSON.stringify([mockPaidEvent]));

    render(<EventsSection />);

    await waitFor(() => {
      expect(screen.getByText(mockPaidEvent.title)).toBeInTheDocument();
    });

    expect(screen.getByText('PKR 500')).toBeInTheDocument();

    const regBtn = screen.getByRole('button', { name: /Register/i });
    expect(regBtn).toBeInTheDocument();

    // Clicking Register opens the registration modal with payment details
    fireEvent.click(regBtn);

    await waitFor(() => {
      expect(screen.getByText('Event Registration')).toBeInTheDocument();
      expect(screen.getByText(/Easypaisa Payment Details/i)).toBeInTheDocument();
    });
  });

  it('transforms Register button into "Registered • View Details" when attendee is already registered', async () => {
    // Pre-populate with existing registration for mockEvent
    const myReg = {
      id: 'reg-me-1',
      event_id: mockEvent.id,
      full_name: 'Dr. Registered Student',
      email: 'student.registered@smc.edu.pk',
      phone: '0333-7778899',
      college_name: 'Saidu Medical College, Swat',
      mbbs_year: 'MBBS - 4th Year',
      student_id: 'SMC-401',
      questions_or_notes: 'Excited for stroke localization seminar',
      attendance_status: 'registered',
      registration_code: 'SMC-REG-ALREADY-THERE',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('sign_event_registrations', JSON.stringify([myReg]));
    sessionStorage.setItem('sign_dev_events', JSON.stringify([mockEvent]));

    render(<EventsSection />);

    await waitFor(() => {
      expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    });

    // Instead of Register button, it should show Registered & View Details
    expect(screen.queryByRole('button', { name: /^Register$/i })).not.toBeInTheDocument();
    const registeredBtn = screen.getByRole('button', { name: /Registered.*View Details/i });
    expect(registeredBtn).toBeInTheDocument();

    // Clicking View Details opens the modal in Confirmed Pass view with reference code & details
    fireEvent.click(registeredBtn);

    await waitFor(() => {
      expect(screen.getByText(/Your Event Registration/i)).toBeInTheDocument();
      expect(screen.getByText('SMC-REG-ALREADY-THERE')).toBeInTheDocument();
      expect(screen.getByText('student.registered@smc.edu.pk')).toBeInTheDocument();
      expect(screen.getByText('0333-7778899')).toBeInTheDocument();
      expect(screen.getByText(/Excited for stroke localization seminar/i)).toBeInTheDocument();
    });
  });

  it('logged-out visitor does not see previous user registration from localStorage and Register triggers login prompt', async () => {
    // Simulate Account A having registered previously
    const accountAReg: EventRegistration = {
      id: 'reg-account-a',
      event_id: mockEvent.id,
      user_id: 'user-uuid-account-a',
      full_name: 'Account A Student',
      email: 'account-a@smc.edu.pk',
      phone: '0333-1112233',
      college_name: 'Saidu Medical College, Swat',
      mbbs_year: 'MBBS - 4th Year',
      student_id: 'SMC-101',
      questions_or_notes: null,
      attendance_status: 'registered',
      registration_code: 'SMC-REG-ACCOUNT-A',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('sign_event_registrations', JSON.stringify([accountAReg]));
    sessionStorage.setItem('sign_dev_events', JSON.stringify([mockEvent]));

    // Render with logged-out auth context
    const loggedOutAuth: AuthContextType = {
      user: null,
      profile: null,
      session: null,
      role: null,
      isLoading: false,
      isSuperAdmin: false,
      isWebsiteAdmin: false,
      isEventManager: false,
      isMember: false,
      isConfigured: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      refreshProfile: vi.fn(),
      devSignIn: vi.fn(),
    };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={loggedOutAuth}>
          <EventsSection />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    });

    // CRITICAL: Logged out user must NOT see "Registered • View Details"
    expect(screen.queryByRole('button', { name: /Registered.*View Details/i })).not.toBeInTheDocument();

    // Must show Register button
    const registerBtn = screen.getByRole('button', { name: /^Register$/i });
    expect(registerBtn).toBeInTheDocument();

    // Clicking Register while logged out opens the LoginRequiredModal
    fireEvent.click(registerBtn);

    await waitFor(() => {
      expect(screen.getByText(/Sign In to Register for Events/i)).toBeInTheDocument();
      expect(screen.getByText(/Attendee Verification Required/i)).toBeInTheDocument();
    });
  });

  it('account isolation: Account B does not see Account A registration, but Account A sees their own', async () => {
    const accountAReg: EventRegistration = {
      id: 'reg-account-a',
      event_id: mockEvent.id,
      user_id: 'user-uuid-account-a',
      full_name: 'Account A Student',
      email: 'account-a@smc.edu.pk',
      phone: '0333-1112233',
      college_name: 'Saidu Medical College, Swat',
      mbbs_year: 'MBBS - 4th Year',
      student_id: 'SMC-101',
      questions_or_notes: null,
      attendance_status: 'registered',
      registration_code: 'SMC-REG-ACCOUNT-A',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('sign_event_registrations', JSON.stringify([accountAReg]));
    sessionStorage.setItem('sign_dev_events', JSON.stringify([mockEvent]));

    // 1. Account B logs in
    const accountBAuth: AuthContextType = {
      user: { id: 'user-uuid-account-b', email: 'account-b@smc.edu.pk' } as any,
      profile: {
        id: 'user-uuid-account-b',
        email: 'account-b@smc.edu.pk',
        full_name: 'Account B Student',
        role: 'applicant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      session: null,
      role: 'applicant',
      isLoading: false,
      isSuperAdmin: false,
      isWebsiteAdmin: false,
      isEventManager: false,
      isMember: false,
      isConfigured: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      refreshProfile: vi.fn(),
      devSignIn: vi.fn(),
    };

    const { unmount } = render(
      <MemoryRouter>
        <AuthContext.Provider value={accountBAuth}>
          <EventsSection />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    });

    // Account B must NOT see Account A's registration
    expect(screen.queryByRole('button', { name: /Registered.*View Details/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Register$/i })).toBeInTheDocument();

    unmount();

    // 2. Account A logs in
    const accountAAuth: AuthContextType = {
      user: { id: 'user-uuid-account-a', email: 'account-a@smc.edu.pk' } as any,
      profile: {
        id: 'user-uuid-account-a',
        email: 'account-a@smc.edu.pk',
        full_name: 'Account A Student',
        role: 'applicant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      session: null,
      role: 'applicant',
      isLoading: false,
      isSuperAdmin: false,
      isWebsiteAdmin: false,
      isEventManager: false,
      isMember: false,
      isConfigured: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      refreshProfile: vi.fn(),
      devSignIn: vi.fn(),
    };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={accountAAuth}>
          <EventsSection />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    });

    // Account A DOES see their registered pass
    expect(screen.getByRole('button', { name: /Registered.*View Details/i })).toBeInTheDocument();
  });

  it('EventRegistrationModal prevents showing confirmed attendee pass when user does not own the registration', async () => {
    const foreignReg: EventRegistration = {
      id: 'reg-foreign',
      event_id: mockEvent.id,
      user_id: 'user-foreign',
      full_name: 'Foreign Student',
      email: 'foreign@smc.edu.pk',
      phone: '0333-9998877',
      college_name: 'Saidu Medical College, Swat',
      mbbs_year: 'MBBS - 3rd Year',
      student_id: 'SMC-301',
      questions_or_notes: null,
      attendance_status: 'registered',
      registration_code: 'SMC-REG-FOREIGN',
      created_at: new Date().toISOString(),
    };

    // Active user is User C
    const userCAuth: AuthContextType = {
      user: { id: 'user-c', email: 'user-c@smc.edu.pk' } as any,
      profile: {
        id: 'user-c',
        email: 'user-c@smc.edu.pk',
        full_name: 'User C',
        role: 'applicant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      session: null,
      role: 'applicant',
      isLoading: false,
      isSuperAdmin: false,
      isWebsiteAdmin: false,
      isEventManager: false,
      isMember: false,
      isConfigured: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      refreshProfile: vi.fn(),
      devSignIn: vi.fn(),
    };

    render(
      <AuthContext.Provider value={userCAuth}>
        <EventRegistrationModal
          isOpen={true}
          onClose={() => {}}
          event={mockEvent}
          existingRegistration={foreignReg}
        />
      </AuthContext.Provider>
    );

    // Should NOT show confirmed pass of foreign student
    expect(screen.queryByText(/Your Event Registration/i)).not.toBeInTheDocument();
    expect(screen.queryByText('SMC-REG-FOREIGN')).not.toBeInTheDocument();

    // Instead, it should show the registration form ready for User C
    expect(screen.getByRole('button', { name: /Confirm Registration/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Dr\. Muhammad Ahmad/i)).toBeInTheDocument();
  });
});
