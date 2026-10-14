import { describe, it, expect } from 'vitest';
import { evaluateMembershipIntake } from '../lib/membership-schedule';
import type { SiteSettings } from '../types/database.types';

describe('Membership Intake Schedule Helper', () => {
  const baseSettings: Partial<SiteSettings> = {
    membership_open: true,
    membership_term_name: 'Fall 2026 Semester Intake',
    membership_start_date: null,
    membership_end_date: null,
    membership_closed_message: 'Applications are closed for this semester.',
  };

  it('evaluates as open when membership_open is true and no dates set', () => {
    const res = evaluateMembershipIntake(baseSettings);
    expect(res.isOpen).toBe(true);
    expect(res.status).toBe('open');
    expect(res.badgeText).toContain('Fall 2026 Semester Intake');
  });

  it('evaluates as closed when membership_open is false regardless of dates', () => {
    const res = evaluateMembershipIntake({
      ...baseSettings,
      membership_open: false,
    });
    expect(res.isOpen).toBe(false);
    expect(res.status).toBe('closed');
    expect(res.message).toBe('Applications are closed for this semester.');
  });

  it('evaluates as upcoming when start date is in the future', () => {
    const futureDate = '2026-12-01';
    const now = new Date('2026-10-14T12:00:00Z');
    const res = evaluateMembershipIntake(
      {
        ...baseSettings,
        membership_start_date: futureDate,
      },
      now
    );
    expect(res.isOpen).toBe(false);
    expect(res.status).toBe('upcoming');
    expect(res.badgeText).toContain('Opens Dec 1, 2026');
  });

  it('evaluates as deadline_passed when end date has expired', () => {
    const pastDate = '2026-10-10';
    const now = new Date('2026-10-14T12:00:00Z');
    const res = evaluateMembershipIntake(
      {
        ...baseSettings,
        membership_end_date: pastDate,
      },
      now
    );
    expect(res.isOpen).toBe(false);
    expect(res.status).toBe('deadline_passed');
    expect(res.badgeText).toBe('Deadline Passed');
  });

  it('evaluates as open with countdown when current date is within window', () => {
    const endDate = '2026-10-20';
    const now = new Date('2026-10-14T12:00:00');
    const res = evaluateMembershipIntake(
      {
        ...baseSettings,
        membership_start_date: '2026-10-01',
        membership_end_date: endDate,
      },
      now
    );
    expect(res.isOpen).toBe(true);
    expect(res.status).toBe('open');
    expect(res.daysRemaining).toBe(7);
    expect(res.badgeText).toContain('7 Days Left');
  });
});
