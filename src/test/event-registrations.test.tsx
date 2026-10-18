import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventRegistrationModal } from '../components/public/EventRegistrationModal';
import { EventsSection } from '../components/public/EventsSection';
import type { EventItem } from '../types/database.types';

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

  it('renders fee, bank account details, and ambassador discount input for a paid event', () => {
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
    expect(screen.getByPlaceholderText(/Enter Ambassador Code/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Payment Proof Screenshot/i)).toBeInTheDocument();
  });

  it('validates and applies ambassador discount code correctly', async () => {
    render(
      <EventRegistrationModal
        isOpen={true}
        onClose={() => {}}
        event={mockPaidEvent}
      />
    );

    const ambassadorInput = screen.getByPlaceholderText(/Enter Ambassador Code/i);
    const applyBtn = screen.getByRole('button', { name: /Apply/i });

    // Try invalid code
    fireEvent.change(ambassadorInput, { target: { value: 'INVALID_CODE' } });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid ambassador code/i)).toBeInTheDocument();
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

  it('enforces payment receipt upload when registering for a paid event', async () => {
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

    // Click submit without uploading receipt
    fireEvent.click(screen.getByRole('button', { name: /Submit Registration & Payment/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Please upload proof of your event fee payment/i)
      ).toBeInTheDocument();
    });
  });

  it('successfully uploads payment receipt and completes paid event registration', async () => {
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

    // Apply ambassador code
    const ambassadorInput = screen.getByPlaceholderText(/Enter Ambassador Code/i);
    fireEvent.change(ambassadorInput, { target: { value: 'SMC2026' } });
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));

    await waitFor(() => {
      expect(screen.getByText(/20% discount/i)).toBeInTheDocument();
    });

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
    expect(screen.getByText(/Ambassador Code \(SMC2026\)/i)).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('sign_event_registrations') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].is_paid).toBe(true);
    expect(stored[0].fee_amount).toBe(500);
    expect(stored[0].amount_paid).toBe(400);
    expect(stored[0].ambassador_code).toBe('SMC2026');
    expect(stored[0].discount_applied).toBe(100);
    expect(stored[0].payment_status).toBe('pending');
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
});
