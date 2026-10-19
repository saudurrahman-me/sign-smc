import { describe, it, expect } from 'vitest';
import { evaluateEventRegistration } from '../lib/event-registration-schedule';
import type { EventItem, SiteSettings } from '../types/database.types';

describe('Event Registration Schedule & Intake Sync Helper', () => {
  const baseEvent: EventItem = {
    id: 'evt-101',
    title: 'Neuroimaging Workshop 2026',
    description: 'Advanced MRI and CT interpretation for medical students.',
    category: 'Research Workshops',
    event_date: '2026-11-20',
    start_time: '10:00:00',
    end_time: '13:00:00',
    venue: 'Saidu Medical College Conference Hall',
    is_virtual: false,
    organizer: 'SIGN SMC Academic Board',
    cover_image_url: null,
    registration_url: null,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
  };

  const baseSettings: Partial<SiteSettings> = {
    membership_open: true,
    membership_term_name: 'Fall 2026 Semester Intake',
    membership_start_date: null,
    membership_end_date: null,
  };

  const now = new Date('2026-10-15T12:00:00Z');

  it('evaluates event as open for registration when membership intake is active and no deadlines are set', () => {
    const res = evaluateEventRegistration(baseEvent, baseSettings, now);
    expect(res.isOpen).toBe(true);
    expect(res.canRegister).toBe(true);
    expect(res.buttonText).toBe('Register');
    expect(res.durationText).toBeNull();
  });

  it('evaluates event as CLOSED when admin disables membership intake status without dates', () => {
    const res = evaluateEventRegistration(
      baseEvent,
      {
        ...baseSettings,
        membership_open: false,
        membership_start_date: null,
        membership_end_date: null,
      },
      now
    );
    expect(res.isOpen).toBe(false);
    expect(res.canRegister).toBe(false);
    expect(res.buttonText).toBe('Closed');
    expect(res.badgeText).toBe('Closed');
    expect(res.durationText).toBeNull();
  });

  it('evaluates event as CLOSED and shows TIME DURATION when admin disables intake with closing deadline', () => {
    const res = evaluateEventRegistration(
      baseEvent,
      {
        ...baseSettings,
        membership_open: false,
        membership_end_date: '2026-10-25', // 10 days remaining
      },
      now
    );
    expect(res.isOpen).toBe(false);
    expect(res.canRegister).toBe(false);
    expect(res.durationText).toContain('Days Left');
    expect(res.buttonText).toContain('Closed');
    expect(res.buttonText).toContain('Days Left');
  });

  it('evaluates event as CLOSED and shows future OPENS TIME when admin schedules future intake start date', () => {
    const res = evaluateEventRegistration(
      baseEvent,
      {
        ...baseSettings,
        membership_open: false,
        membership_start_date: '2026-11-01',
      },
      now
    );
    expect(res.isOpen).toBe(false);
    expect(res.canRegister).toBe(false);
    expect(res.durationText).toContain('Opens Nov 1');
    expect(res.buttonText).toContain('Opens Nov 1');
  });

  it('evaluates event as CLOSED when event is explicitly toggled closed by admin', () => {
    const closedEvent: EventItem = {
      ...baseEvent,
      is_registration_open: false,
    };
    const res = evaluateEventRegistration(closedEvent, baseSettings, now);
    expect(res.isOpen).toBe(false);
    expect(res.canRegister).toBe(false);
    expect(res.buttonText).toBe('Closed');
  });

  it('evaluates event as CLOSED when event registration deadline has passed', () => {
    const expiredEvent: EventItem = {
      ...baseEvent,
      registration_deadline: '2026-10-10', // passed
    };
    const res = evaluateEventRegistration(expiredEvent, baseSettings, now);
    expect(res.isOpen).toBe(false);
    expect(res.canRegister).toBe(false);
    expect(res.buttonText).toBe('Closed');
    expect(res.durationText).toContain('Deadline passed');
  });

  it('evaluates event as CONCLUDED when event date is in the past', () => {
    const pastEvent: EventItem = {
      ...baseEvent,
      event_date: '2026-10-01',
    };
    const res = evaluateEventRegistration(pastEvent, baseSettings, now);
    expect(res.isOpen).toBe(false);
    expect(res.canRegister).toBe(false);
    expect(res.status).toBe('concluded');
    expect(res.buttonText).toBe('Concluded');
  });
});
