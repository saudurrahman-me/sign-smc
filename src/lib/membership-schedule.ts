// ==============================================================================
// SIGN SMC - Membership Intake & Academic Semester Schedule Helper
// ==============================================================================

import type { SiteSettings } from '../types/database.types';

export interface IntakeEvaluation {
  isOpen: boolean;
  status: 'open' | 'closed' | 'upcoming' | 'deadline_passed';
  badgeText: string;
  headline: string;
  message: string;
  termName: string;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number | null;
  durationText?: string | null;
}

/**
 * Evaluates whether student membership applications are currently open or closed
 * based on the admin's manual toggle, semester term name, and date window.
 */
export function evaluateMembershipIntake(
  settings: Partial<SiteSettings> | null | undefined,
  now: Date = new Date()
): IntakeEvaluation {
  const termName = settings?.membership_term_name?.trim() || 'Annual Academic Intake';
  const startDateStr = settings?.membership_start_date || null;
  const endDateStr = settings?.membership_end_date || null;
  const closedMessage =
    settings?.membership_closed_message?.trim() ||
    'Membership applications for the current academic session are currently closed. The next cohort enrollment will open at the start of the upcoming semester.';

  const isExplicitlyOpen = settings?.membership_open ?? true;

  // 1. Explicitly toggled OFF by admin
  if (!isExplicitlyOpen) {
    let durationText: string | null = null;
    let badgeText = 'Intake Closed';

    if (startDateStr) {
      const startDate = new Date(startDateStr);
      if (!isNaN(startDate.getTime()) && now < startDate) {
        const formattedStart = startDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        durationText = `Opens ${formattedStart}`;
        badgeText = `Opens ${formattedStart}`;
      }
    }

    if (!durationText && endDateStr) {
      const formattedEnd = new Date(endDateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      durationText = `Closed on ${formattedEnd}`;
      badgeText = `Closed • ${formattedEnd}`;
    }

    return {
      isOpen: false,
      status: 'closed',
      badgeText,
      headline: `Applications Closed for ${termName}`,
      message: closedMessage,
      termName,
      startDate: startDateStr,
      endDate: endDateStr,
      daysRemaining: null,
      durationText,
    };
  }

  // 2. Check Future Start Date (e.g. Scheduled for next semester start)
  if (startDateStr) {
    const startDate = new Date(startDateStr);
    if (!isNaN(startDate.getTime()) && now < startDate) {
      const formattedStart = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return {
        isOpen: false,
        status: 'upcoming',
        badgeText: `Opens ${formattedStart}`,
        headline: `Upcoming Enrollment: ${termName}`,
        message: `Applications for ${termName} will officially open at the start of the semester on ${formattedStart}. Please prepare your application details and check back then.`,
        termName,
        startDate: startDateStr,
        endDate: endDateStr,
        daysRemaining: null,
      };
    }
  }

  // 3. Check Passed End Date / Deadline (e.g. Semester intake window ended)
  if (endDateStr) {
    // End of the deadline day in local time
    const endDate = new Date(`${endDateStr}T23:59:59`);
    if (!isNaN(endDate.getTime())) {
      if (now > endDate) {
        const formattedEnd = new Date(endDateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        return {
          isOpen: false,
          status: 'deadline_passed',
          badgeText: 'Deadline Passed',
          headline: `Application Window Closed`,
          message: `The application deadline for ${termName} passed on ${formattedEnd}. Applications are paused until the next semester enrollment cycle.`,
          termName,
          startDate: startDateStr,
          endDate: endDateStr,
          daysRemaining: 0,
        };
      }

      // 4. Currently Active with specific closing deadline
      const msRemaining = endDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      const formattedEnd = new Date(endDateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        isOpen: true,
        status: 'open',
        badgeText: `${termName} • ${
          daysRemaining === 0
            ? 'Final Hours!'
            : daysRemaining === 1
            ? '1 Day Remaining'
            : `${daysRemaining} Days Left`
        }`,
        headline: `Applications Open: ${termName}`,
        message: `Application window is open until ${formattedEnd}. Open to MBBS and BDS students at Saidu Medical College.`,
        termName,
        startDate: startDateStr,
        endDate: endDateStr,
        daysRemaining,
      };
    }
  }

  // 5. Active without specific deadline
  return {
    isOpen: true,
    status: 'open',
    badgeText: `${termName} • Applications Active`,
    headline: `Apply for Membership — ${termName}`,
    message:
      'Open to MBBS and BDS students at Saidu Medical College seeking structured exposure to clinical neurology, journal clubs, and collaborative academic research.',
    termName,
    startDate: startDateStr,
    endDate: endDateStr,
    daysRemaining: null,
  };
}
