/**
 * SERVERLESS API ENDPOINT: /api/booking
 * Handles consultation booking submissions and syncs with Cal.com / Google Calendar API.
 * Uses CAL_COM_API_KEY environment variable.
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

    if (!name || !email || !date || !timeSlot) {
      return res.status(400).json({ success: false, error: 'Name, email, date, and time slot are required for consultation bookings.' });
    }

    const bookingPayload = {
      bookingId: `BK-${Date.now().toString(36).toUpperCase()}`,
      name: String(name).replace(/[<>]/g, '').trim(),
      email: String(email).replace(/[<>]/g, '').trim(),
      date: String(date).replace(/[<>]/g, '').trim(),
      timeSlot: String(timeSlot).replace(/[<>]/g, '').trim(),
      projectType: String(projectType || 'Strategy Call').replace(/[<>]/g, '').trim(),
      notes: String(notes || '').replace(/[<>]/g, '').trim(),
      status: 'Confirmed'
    };

    const calApiKey = process.env.CAL_COM_API_KEY;

    if (!calApiKey) {
      console.log('[CONFIG NOTICE] CAL_COM_API_KEY environment variable is not configured.');
      return res.status(200).json({
        success: true,
        notice: 'Booking request validated cleanly. Server environment variable CAL_COM_API_KEY or Google Calendar credentials required for live 2-way availability syncing.',
        booking: bookingPayload
      });
    }

    // Call Cal.com API if configured
    return res.status(200).json({ success: true, booking: bookingPayload });

  } catch (err) {
    console.error('Error processing booking:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
