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
};

describe('Event Registration System', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders registration form fields when modal is open', () => {
    render(
      <EventRegistrationModal
        isOpen={true}
        onClose={() => {}}
        event={mockEvent}
      />
    );

    expect(screen.getByText('Event Registration')).toBeInTheDocument();
    expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Dr\. Muhammad Ahmad/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/student@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/0300-1234567/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm Registration/i)).toBeInTheDocument();
  });

  it('successfully completes registration and displays attendee pass with unique code', async () => {
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

  it('renders Register button for upcoming events on EventsSection', async () => {
    sessionStorage.setItem('sign_dev_events', JSON.stringify([mockEvent]));

    render(<EventsSection />);

    await waitFor(() => {
      expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    });

    const regBtn = screen.getByRole('button', { name: /Register/i });
    expect(regBtn).toBeInTheDocument();

    // Clicking Register opens the registration modal
    fireEvent.click(regBtn);

    await waitFor(() => {
      expect(screen.getByText('Event Registration')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/student@example\.com/i)).toBeInTheDocument();
    });
  });
});
