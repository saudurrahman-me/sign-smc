// ==============================================================================
// SIGN SMC - Event Registration Schedule & Intake Sync Helper
// ==============================================================================

import type { EventItem, SiteSettings } from '../types/database.types';

export interface EventRegistrationSchedule {
  isOpen: boolean;
  canRegister: boolean;
  status: 'open' | 'closed' | 'concluded' | 'upcoming';
  buttonText: string;
  badgeText: string;
  durationText: string | null;
  message: string;
}

/**
 * Evaluates whether event registration is currently open, closed, or upcoming,
 * synchronizing with the global admin membership intake status and event-level deadlines.
 */
export function evaluateEventRegistration(
  event: EventItem | null | undefined,
  siteSettings: Partial<SiteSettings> | null | undefined,
  now: Date = new Date()
): EventRegistrationSchedule {
  if (!event) {
    return {
      isOpen: false,
      canRegister: false,
      status: 'closed',
      buttonText: 'Closed',
      badgeText: 'Closed',
      durationText: null,
      message: 'No event details available.',
    };
  }

  const todayStr = now.toISOString().split('T')[0];

  // 1. Concluded (Event date has passed)
  if (event.event_date < todayStr) {
    return {
      isOpen: false,
      canRegister: false,
      status: 'concluded',
      buttonText: 'Concluded',
      badgeText: 'Concluded',
      durationText: null,
      message: 'This event has concluded.',
    };
  }

  // 2. Explicitly closed on the individual event level in Admin
  if (event.is_registration_open === false) {
    let durationText: string | null = null;
    if (event.registration_deadline) {
      durationText = `Deadline: ${new Date(event.registration_deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`;
    }
    return {
      isOpen: false,
      canRegister: false,
      status: 'closed',
      buttonText: durationText ? `Closed (${durationText})` : 'Closed',
      badgeText: durationText ? `Closed • ${durationText}` : 'Closed',
      durationText,
      message: 'Registration for this event is currently closed by the administration.',
    };
  }

  // 3. Event registration deadline passed
  if (event.registration_deadline) {
    const deadline = new Date(`${event.registration_deadline}T23:59:59`);
    if (!isNaN(deadline.getTime()) && now > deadline) {
      const formatted = new Date(event.registration_deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return {
        isOpen: false,
        canRegister: false,
        status: 'closed',
        buttonText: 'Closed',
        badgeText: `Closed on ${formatted}`,
        durationText: `Deadline passed (${formatted})`,
        message: `Registration deadline for this event passed on ${formatted}.`,
      };
    }
  }

  // 4. Global Membership Intake Status disabled by Admin
  // When an admin disables membership intake status from the admin page,
  // event registration on the public website is also closed.
  const isGlobalIntakeOpen = siteSettings?.membership_open ?? true;
  if (!isGlobalIntakeOpen) {
    // Check if any time duration was given from the admin side:
    const startDateStr = siteSettings?.membership_start_date || null;
    const endDateStr = siteSettings?.membership_end_date || null;

    let durationText: string | null = null;

    if (startDateStr) {
      const startDate = new Date(startDateStr);
      if (!isNaN(startDate.getTime()) && now < startDate) {
        const formattedStart = startDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        durationText = `Opens ${formattedStart}`;
      }
    }

    if (!durationText && endDateStr) {
      const endDate = new Date(`${endDateStr}T23:59:59`);
      if (!isNaN(endDate.getTime())) {
        if (now <= endDate) {
          const ms = endDate.getTime() - now.getTime();
          const days = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
          durationText =
            days === 0
              ? 'Final Hours'
              : days === 1
              ? '1 Day Remaining'
              : `${days} Days Left`;
        } else {
          const formattedEnd = new Date(endDateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          durationText = `Closed on ${formattedEnd}`;
        }
      }
    }

    // Also check event's own deadline if specified
    if (!durationText && event.registration_deadline) {
      durationText = `Deadline: ${new Date(event.registration_deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`;
    }

    return {
      isOpen: false,
      canRegister: false,
      status: 'closed',
      buttonText: durationText ? `Registration Closed (${durationText})` : 'Closed',
      badgeText: durationText ? `Closed • ${durationText}` : 'Closed',
      durationText,
      message: durationText
        ? `Registration is currently closed (${durationText}).`
        : 'Registration is currently closed by the administration.',
    };
  }

  // 5. Open with specific Event Deadline countdown
  if (event.registration_deadline) {
    const deadline = new Date(`${event.registration_deadline}T23:59:59`);
    if (!isNaN(deadline.getTime())) {
      const ms = deadline.getTime() - now.getTime();
      const days = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
      const durationText =
        days === 0
          ? 'Final Hours'
          : days === 1
          ? '1 Day Remaining'
          : `${days} Days Left`;
      return {
        isOpen: true,
        canRegister: true,
        status: 'open',
        buttonText: `Register (${durationText})`,
        badgeText: durationText,
        durationText,
        message: `Registration is open. Closes in ${durationText}.`,
      };
    }
  }

  // 6. Open with specific Global Intake Deadline countdown
  if (siteSettings?.membership_end_date) {
    const endDate = new Date(`${siteSettings.membership_end_date}T23:59:59`);
    if (!isNaN(endDate.getTime()) && now <= endDate) {
      const ms = endDate.getTime() - now.getTime();
      const days = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
      const durationText =
        days === 0
          ? 'Final Hours'
          : days === 1
          ? '1 Day Remaining'
          : `${days} Days Left`;
      return {
        isOpen: true,
        canRegister: true,
        status: 'open',
        buttonText: `Register (${durationText})`,
        badgeText: durationText,
        durationText,
        message: `Registration is open (${durationText}).`,
      };
    }
  }

  // 7. Open with no specific deadline
  return {
    isOpen: true,
    canRegister: true,
    status: 'open',
    buttonText: 'Register',
    badgeText: 'Open',
    durationText: null,
    message: 'Registration is open.',
  };
}
