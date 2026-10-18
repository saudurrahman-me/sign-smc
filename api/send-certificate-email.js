// Vercel Serverless Function to dispatch certificate emails via Resend
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { to, subject, html, text, studentName, eventTitle, certificateCode } = req.body || {};

  if (!to || !subject) {
    return res.status(400).json({ error: 'Missing required recipient or subject.' });
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'RESEND_API_KEY is not configured in Vercel Environment Variables.',
    });
  }

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'SIGN SMC Chapter <onboarding@resend.dev>',
        to: [to],
        reply_to: process.env.RESEND_REPLY_TO || 'signsmc.official@gmail.com',
        subject: subject,
        html: html,
        text: text,
      }),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('[Resend Error]:', data);
      return res.status(resendResponse.status).json({
        error: data.message || 'Resend failed to send email.',
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      id: data.id,
      message: `Certificate email successfully dispatched to ${to}`,
    });
  } catch (err) {
    console.error('[Serverless Function Error]:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal Server Error while dispatching email.',
    });
  }
}
