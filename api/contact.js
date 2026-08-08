/**
 * SERVERLESS API ENDPOINT: /api/contact
 * Production Resend Email Delivery Handler for Aether Studio Contact Form.
 * Reads environment variables: RESEND_API_KEY, CONTACT_DESTINATION_EMAIL, CONTACT_FROM_EMAIL
 */

module.exports = async function handler(req, res) {
  // Set Security & CORS Headers
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
    const { name, email, company, service, budget, timeline, message, contactMethod, honeypot } = req.body || {};

    // 1. Anti-Spam Honeypot Check
    if (honeypot && String(honeypot).trim().length > 0) {
      console.warn('[SPAM DEFENSE] Honeypot trigger detected. Rejecting submission silently.');
      return res.status(200).json({ success: true, message: 'Inquiry processed successfully.' });
    }

    // 2. Server-side Field Validation
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Full Name is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    // 3. Input Sanitization (XSS Defense)
    const sanitize = (str) => String(str || '').replace(/[<>]/g, '').trim();

    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanCompany = sanitize(company || 'Not Provided');
    const cleanService = sanitize(service || 'General Inquiry');
    const cleanBudget = sanitize(budget || 'Not Specified');
    const cleanTimeline = sanitize(timeline || 'Flexible');
    const cleanMessage = sanitize(message || 'No additional project notes provided.');
    const cleanContactMethod = sanitize(contactMethod || 'Email');
    const submissionDate = new Date().toUTCString();

    // 4. Read Environment Variables (Never send keys to client)
    const resendApiKey = process.env.RESEND_API_KEY;
    const destinationEmail = process.env.CONTACT_DESTINATION_EMAIL || 'mayurkamane23@gmail.com';
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Aether Studio Leads <onboarding@resend.dev>';

    if (!resendApiKey) {
      console.log('[CONFIG NOTICE] RESEND_API_KEY is not configured in environment variables.');
      return res.status(200).json({
        success: true,
        delivered: false,
        notice: 'Lead received and validated by API endpoint. Configure RESEND_API_KEY in Vercel environment variables for live email delivery.',
        summary: {
          name: cleanName,
          email: cleanEmail,
          service: cleanService,
          budget: cleanBudget,
          submissionDate
        }
      });
    }

    // 5. Official Resend API Request
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [destinationEmail],
        reply_to: cleanEmail,
        subject: `New Project Inquiry: ${cleanName} — ${cleanService}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fafafa;">
            <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 1.5rem;">New Project Lead Submission</h2>
              <span style="font-size: 0.85rem; color: #64748b;">Aether Studio Inbound Inquiries</span>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.95rem;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #475569;">Visitor Name:</td>
                <td style="padding: 8px 0; color: #0f172a;">${cleanName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email Address:</td>
                <td style="padding: 8px 0; color: #2563eb;"><a href="mailto:${cleanEmail}" style="color: #2563eb;">${cleanEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Company:</td>
                <td style="padding: 8px 0; color: #0f172a;">${cleanCompany}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Project Type:</td>
                <td style="padding: 8px 0; color: #8b5cf6; font-weight: bold;">${cleanService}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Budget Range:</td>
                <td style="padding: 8px 0; color: #0f172a;">${cleanBudget}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Timeline:</td>
                <td style="padding: 8px 0; color: #0f172a;">${cleanTimeline}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Preferred Channel:</td>
                <td style="padding: 8px 0; color: #0f172a;">${cleanContactMethod}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Submission Date:</td>
                <td style="padding: 8px 0; color: #64748b; font-size: 0.85rem;">${submissionDate}</td>
              </tr>
            </table>

            <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
              <strong style="display: block; margin-bottom: 8px; color: #334155;">Project Description / Message:</strong>
              <p style="margin: 0; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${cleanMessage}</p>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 0.8rem; color: #94a3b8; text-align: center;">
              Sent securely via Aether Studio Serverless API Handler. Reply directly to this email to respond to ${cleanName}.
            </div>
          </div>
        `
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API Error:', resendData);
      return res.status(502).json({
        success: false,
        error: 'Email service returned an error. Please verify your Resend API configuration and domain records.'
      });
    }

    return res.status(200).json({
      success: true,
      delivered: true,
      id: resendData.id,
      message: 'Inquiry email dispatched successfully via Resend.'
    });

  } catch (err) {
    console.error('Unhandled error in /api/contact handler:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
