// ==============================================================================
// SIGN SMC - Certificate Email Notifications & Code Generator
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';

export interface CertificateNotificationParams {
  studentName: string;
  studentEmail: string;
  eventTitle: string;
  status: 'approved' | 'declined';
  certificateCode?: string | null;
  reviewerNotes?: string | null;
}

export interface EmailDispatchResult {
  success: boolean;
  channel: 'edge_function' | 'webhook' | 'client_fallback' | 'simulated';
  message: string;
  mailtoUrl: string;
}

/**
 * Generates a standard uppercase certificate verification code
 * Format: SIGN-CERT-2026-XXXXXX
 */
export function generateCertificateCode(): string {
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SIGN-CERT-${year}-${randomChars}`;
}

/**
 * Builds email subject and body for certificate verification status updates.
 */
export function buildCertificateEmailContent(params: CertificateNotificationParams): {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  mailtoUrl: string;
} {
  const { studentName, studentEmail, eventTitle, status, certificateCode, reviewerNotes } = params;

  if (status === 'approved') {
    const subject = `Your SIGN SMC Certificate has been Approved: ${eventTitle}`;
    const verificationUrl = `${window.location.origin}/certificates?verify=${encodeURIComponent(certificateCode || '')}`;
    const portalUrl = `${window.location.origin}/certificates`;

    const bodyText = `Dear ${studentName},

We are pleased to inform you that your attendance certificate request for "${eventTitle}" has been verified and approved by the SIGN SMC Academic & Event Committee!

Certificate Verification ID: ${certificateCode || 'Verified'}
Issuing Authority: Student Interest Group in Neurology (SIGN), Saidu Medical College (SMC), Swat

You can now log in to the website and download your official certificate:
${portalUrl}

You can also verify your certificate's authenticity anytime at:
${verificationUrl}

Congratulations and thank you for participating in our academic activities!

Warm regards,
Academic & Event Committee
Student Interest Group in Neurology (SIGN)
Saidu Medical College (SMC), Swat
Contact: signsmc.official@gmail.com`;

    const bodyHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #10b981; border-radius: 16px; background-color: #031d12; color: #f1f5f9;">
        <h2 style="color: #34d399; margin-top: 0;">SIGN SMC — Certificate Approved</h2>
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Your attendance certificate for <strong>${eventTitle}</strong> has been verified and approved by the SIGN SMC Committee.</p>
        <div style="background-color: #052919; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #047857;">
          <p style="margin: 4px 0; font-size: 14px; color: #a7f3d0;"><strong>Certificate ID:</strong> ${certificateCode || 'Verified'}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #a7f3d0;"><strong>Event:</strong> ${eventTitle}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #a7f3d0;"><strong>Status:</strong> Officially Issued</p>
        </div>
        <p>You can now download your certificate directly from your student portal:</p>
        <p><a href="${portalUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Download Certificate</a></p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">Student Interest Group in Neurology (SIGN) • Saidu Medical College (SMC), Swat</p>
      </div>
    `;

    const mailtoUrl = `mailto:${encodeURIComponent(studentEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyText)}`;

    return { subject, bodyText, bodyHtml, mailtoUrl };
  } else {
    const subject = `Update on your SIGN SMC Certificate Request: ${eventTitle}`;
    const portalUrl = `${window.location.origin}/certificates`;

    const bodyText = `Dear ${studentName},

Thank you for your interest in the SIGN SMC chapter's academic activities.

Regarding your certificate request for "${eventTitle}", our committee has reviewed the attendance registry and could not confirm your verified attendance.

Reviewer Notes:
${reviewerNotes || 'Attendance record could not be confirmed in the event registry.'}

If you believe this record is in error, please contact the Event Organizing Secretariat or reply with your session attendance confirmation.

Best regards,
Academic & Event Committee
Student Interest Group in Neurology (SIGN)
Saidu Medical College (SMC), Swat
Website: ${portalUrl}`;

    const bodyHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e11d48; border-radius: 16px; background-color: #1e1115; color: #f1f5f9;">
        <h2 style="color: #fb7185; margin-top: 0;">SIGN SMC — Certificate Request Notice</h2>
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Your certificate request for <strong>${eventTitle}</strong> has been reviewed.</p>
        <p style="color: #fca5a5;"><strong>Reason:</strong> ${reviewerNotes || 'Attendance record could not be confirmed in the event registry.'}</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">Student Interest Group in Neurology (SIGN) • Saidu Medical College (SMC), Swat</p>
      </div>
    `;

    const mailtoUrl = `mailto:${encodeURIComponent(studentEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyText)}`;

    return { subject, bodyText, bodyHtml, mailtoUrl };
  }
}

/**
 * Dispatches an automated email notification when a certificate is approved or declined.
 */
export async function sendCertificateEmailNotification(
  params: CertificateNotificationParams
): Promise<EmailDispatchResult> {
  const content = buildCertificateEmailContent(params);

  // 1. Try Vercel Serverless Function (Resend API)
  try {
    const apiResponse = await fetch('/api/send-certificate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: params.studentEmail,
        studentName: params.studentName,
        eventTitle: params.eventTitle,
        status: params.status,
        certificateCode: params.certificateCode,
        reviewerNotes: params.reviewerNotes,
        subject: content.subject,
        html: content.bodyHtml,
        text: content.bodyText,
      }),
    });

    const data = await apiResponse.json().catch(() => ({}));

    if (apiResponse.ok && data?.success) {
      return {
        success: true,
        channel: 'edge_function',
        message: `Official certificate email automatically sent to ${params.studentEmail} via Resend.`,
        mailtoUrl: content.mailtoUrl,
      };
    } else {
      const errText = data?.error || data?.message || 'Resend API call unsuccessful';
      console.warn('[Resend API notice]:', errText);
      return {
        success: false,
        channel: 'client_fallback',
        message: `Resend error: ${errText}`,
        mailtoUrl: content.mailtoUrl,
      };
    }
  } catch (err) {
    console.warn('[Resend dispatch error]:', err);
  }

  // 2. Try Supabase Edge Function if connected
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('send-certificate-email', {
        body: {
          to: params.studentEmail,
          studentName: params.studentName,
          eventTitle: params.eventTitle,
          status: params.status,
          certificateCode: params.certificateCode,
          reviewerNotes: params.reviewerNotes,
          subject: content.subject,
          html: content.bodyHtml,
        },
      });

      if (!error && data?.success) {
        return {
          success: true,
          channel: 'edge_function',
          message: `Official notification email sent to ${params.studentEmail} via Supabase Edge Function.`,
          mailtoUrl: content.mailtoUrl,
        };
      }
    } catch {
      // Fall through to webhook or client notification
    }
  }

  // 2. Try configured external webhook (e.g. Resend, Zapier, Make) if present
  const webhookUrl = (import.meta as { env?: { VITE_CERTIFICATE_EMAIL_WEBHOOK?: string } }).env?.VITE_CERTIFICATE_EMAIL_WEBHOOK;
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: params.studentEmail,
          subject: content.subject,
          text: content.bodyText,
          html: content.bodyHtml,
          meta: params,
        }),
      });
      if (response.ok) {
        return {
          success: true,
          channel: 'webhook',
          message: `Notification webhook triggered for ${params.studentEmail}.`,
          mailtoUrl: content.mailtoUrl,
        };
      }
    } catch {
      // Fall through
    }
  }

  // 3. Fallback: Client notification prepared & mailto ready
  return {
    success: true,
    channel: 'client_fallback',
    message: `Notification prepared for ${params.studentEmail}. Student can log in to view and download their verified certificate.`,
    mailtoUrl: content.mailtoUrl,
  };
}
