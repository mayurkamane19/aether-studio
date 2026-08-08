/**
 * SERVERLESS API ENDPOINT: /api/booking
 * Handles consultation booking submissions with unique Booking ID (BK-2026-XXXXXX),
 * dispatches admin email notification and visitor confirmation email via Resend.
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { name, email, date, timeSlot, projectType, notes } = req.body || {};

    // 1. Validation
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Name is required for booking.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      return res.status(400).json({ success: false, error: 'Valid email address is required for booking.' });
    }

    if (!date || !timeSlot) {
      return res.status(400).json({ success: false, error: 'Date and time slot are required.' });
    }

    // 2. Input Sanitization
    const sanitize = (str) => String(str || '').replace(/[<>]/g, '').trim();

    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanDate = sanitize(date);
    const cleanTimeSlot = sanitize(timeSlot);
    const cleanProjectType = sanitize(projectType || 'Strategy Consultation');
    const cleanNotes = sanitize(notes || 'No notes provided.');
    const submissionDate = new Date().toUTCString();

    // 3. Collision-Resistant Booking ID (BK-2026-XXXXXX)
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const bookingId = `BK-2026-${randomCode}`;

    const bookingPayload = {
      bookingId,
      name: cleanName,
      email: cleanEmail,
      date: cleanDate,
      timeSlot: cleanTimeSlot,
      projectType: cleanProjectType,
      notes: cleanNotes,
      submissionDate,
      status: 'Confirmed'
    };

    // 4. Send Resend Email Notifications (if configured)
    const resendApiKey = process.env.RESEND_API_KEY;
    const destinationEmail = process.env.CONTACT_DESTINATION_EMAIL || 'mayurkamane23@gmail.com';
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Aether Studio Desk <onboarding@resend.dev>';

    if (resendApiKey) {
      // Admin Notification
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [destinationEmail],
          reply_to: cleanEmail,
          subject: `[${bookingId}] New Strategy Consultation Booking: ${cleanName}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fafafa;">
              <span style="font-size: 0.8rem; font-weight: bold; color: #2563eb;">BOOKING ID: ${bookingId}</span>
              <h2 style="color: #0f172a; margin: 4px 0 16px 0;">New Consultation Session Scheduled</h2>
              <p><strong>Name:</strong> ${cleanName}</p>
              <p><strong>Email:</strong> <a href="mailto:${cleanEmail}">${cleanEmail}</a></p>
              <p><strong>Date & Time:</strong> ${cleanDate} @ ${cleanTimeSlot}</p>
              <p><strong>Topic:</strong> ${cleanProjectType}</p>
              <p><strong>Notes:</strong> ${cleanNotes}</p>
            </div>
          `
        })
      }).catch(err => console.error('[BOOKING ADMIN EMAIL ERROR]', err));

      // Visitor Confirmation
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [cleanEmail],
          subject: `[${bookingId}] Consultation Confirmation — Aether Studio`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #f8fafc; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #334155; border-radius: 12px; background: #06070a;">
              <h2 style="color: #ffffff; margin: 0;">AETHER <span style="color: #8b5cf6;">STUDIO</span></h2>
              <p style="color: #cbd5e1;">Dear ${cleanName},</p>
              <p style="color: #cbd5e1;">Your 1-on-1 strategy consultation has been requested for <strong>${cleanDate} at ${cleanTimeSlot}</strong> (Ref: <strong>${bookingId}</strong>).</p>
            </div>
          `
        })
      }).catch(err => console.error('[BOOKING VISITOR CONFIRMATION ERROR]', err));
    }

    return res.status(200).json({ success: true, bookingId, booking: bookingPayload });

  } catch (err) {
    console.error('Error in /api/booking handler:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
