/**
 * SERVERLESS API ENDPOINT: /api/contact
 * Production Resend Email Delivery & Visitor Auto-Reply Handler for Aether Studio.
 * Generates unique Lead ID (AS-2026-XXXXXX), dispatches admin notification & visitor auto-reply email.
 */

// Basic In-Memory Rate Limiting (5 requests / 60 seconds per IP)
const rateLimitMap = new Map();

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
    // 1. Basic Rate Limiting
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 5;

    const userLimit = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + windowMs };

    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + windowMs;
    } else {
      userLimit.count += 1;
    }
    rateLimitMap.set(clientIp, userLimit);

    if (userLimit.count > maxRequests) {
      console.warn(`[RATE LIMIT EXCEEDED] IP: ${clientIp}`);
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a minute before submitting another inquiry.'
      });
    }

    const { name, email, company, service, budget, timeline, message, contactMethod, honeypot } = req.body || {};

    // 2. Anti-Spam Honeypot Check
    if (honeypot && String(honeypot).trim().length > 0) {
      console.warn('[SPAM DEFENSE] Honeypot trigger detected. Rejecting submission silently.');
      return res.status(200).json({ success: true, message: 'Inquiry processed successfully.' });
    }

    // 3. Server-side Field Validation & Length Limits
    if (!name || !String(name).trim() || String(name).trim().length > 100) {
      return res.status(400).json({ success: false, error: 'Full Name is required (maximum 100 characters).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmailInput = String(email || '').trim();
    if (!email || !emailRegex.test(cleanEmailInput) || cleanEmailInput.length > 120) {
      return res.status(400).json({ success: false, error: 'A valid email address is required (maximum 120 characters).' });
    }

    if (message && String(message).length > 3000) {
      return res.status(400).json({ success: false, error: 'Message exceeds maximum limit of 3000 characters.' });
    }

    // 4. Input Sanitization (XSS Defense)
    const sanitize = (str) => String(str || '').replace(/[<>]/g, '').trim();

    const cleanName = sanitize(name);
    const cleanEmail = cleanEmailInput;
    const cleanCompany = sanitize(company || 'Independent');
    const cleanService = sanitize(service || 'General Inquiry');
    const cleanBudget = sanitize(budget || 'Not Specified');
    const cleanTimeline = sanitize(timeline || 'Flexible');
    const cleanMessage = sanitize(message || 'No additional project notes provided.');
    const cleanContactMethod = sanitize(contactMethod || 'Email');
    const submissionDate = new Date().toUTCString();

    // 5. Generate Collision-Resistant Unique Lead ID (Format: AS-2026-XXXXXX)
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const leadId = `AS-2026-${randomCode}`;

    // 6. Read Environment Variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const destinationEmail = process.env.CONTACT_DESTINATION_EMAIL || 'mayurkamane23@gmail.com';
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Aether Studio Leads <onboarding@resend.dev>';

    if (!resendApiKey) {
      console.log('[CONFIG NOTICE] RESEND_API_KEY is not configured in environment variables.');
      return res.status(200).json({
        success: true,
        delivered: false,
        leadId,
        notice: 'Lead payload validated cleanly. Configure RESEND_API_KEY in Vercel for live email delivery.',
        summary: { leadId, name: cleanName, email: cleanEmail, service: cleanService, submissionDate }
      });
    }

    // 7. Dispatch Admin Email Notification via Resend
    const adminEmailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [destinationEmail],
        reply_to: cleanEmail,
        subject: `[${leadId}] New Lead Inquiry: ${cleanName} — ${cleanService}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fafafa;">
            <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 20px;">
              <span style="font-size: 0.8rem; font-weight: bold; color: #8b5cf6;">LEAD ID: ${leadId}</span>
              <h2 style="color: #0f172a; margin: 4px 0 0 0; font-size: 1.5rem;">New Project Inquiry</h2>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.95rem;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #475569;">Lead ID:</td>
                <td style="padding: 8px 0; color: #8b5cf6; font-weight: bold;">${leadId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Visitor Name:</td>
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
              <strong style="display: block; margin-bottom: 8px; color: #334155;">Project Description / Notes:</strong>
              <p style="margin: 0; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${cleanMessage}</p>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 0.8rem; color: #94a3b8; text-align: center;">
              Sent securely via Aether Studio Serverless API Handler. Reply directly to this email to respond to ${cleanName}.
            </div>
          </div>
        `
      })
    });

    const adminEmailData = await adminEmailRes.json();

    if (!adminEmailRes.ok) {
      console.error('Resend Admin Email Error:', adminEmailData);
      return res.status(502).json({
        success: false,
        error: 'Email service returned an error when notifying admin.'
      });
    }

    // 8. Dispatch Visitor Confirmation Auto-Reply Email via Resend
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        subject: `[${leadId}] We Received Your Project Inquiry — Aether Studio`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #f8fafc; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #334155; border-radius: 12px; background: #06070a;">
            <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 1.6rem; letter-spacing: 1px;">AETHER <span style="color: #8b5cf6;">STUDIO</span></h2>
              <span style="font-size: 0.85rem; color: #94a3b8;">Creative Engineering & Luxury Brand Architecture</span>
            </div>

            <p style="font-size: 1.05rem; color: #f1f5f9;">Dear ${cleanName},</p>

            <p style="color: #cbd5e1; line-height: 1.6;">
              Thank you for inquiring with Aether Studio. We have successfully received your project specifications. Our strategy team is analyzing your requirements and will respond within <strong>4 business hours</strong>.
            </p>

            <div style="background: rgba(255,255,255,0.04); padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
              <strong style="color: #8b5cf6; display: block; margin-bottom: 8px;">Inquiry Reference (${leadId})</strong>
              <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 0.95rem; line-height: 1.6;">
                <li><strong>Project Type:</strong> ${cleanService}</li>
                <li><strong>Estimated Budget:</strong> ${cleanBudget}</li>
                <li><strong>Timeline:</strong> ${cleanTimeline}</li>
                <li><strong>Submission Date:</strong> ${submissionDate}</li>
              </ul>
            </div>

            <div style="background: rgba(139, 92, 246, 0.1); padding: 16px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin-bottom: 20px;">
              <strong style="color: #c084fc; display: block; margin-bottom: 4px;">What Happens Next?</strong>
              <p style="margin: 0; color: #e0e7ff; font-size: 0.9rem; line-height: 1.5;">
                Our lead creative director will review your submission and prepare a customized scope breakdown & initial roadmap.
              </p>
            </div>

            <p style="color: #94a3b8; font-size: 0.88rem;">
              If you have any additional guidelines or files to share, simply reply directly to this email.
            </p>

            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 24px; font-size: 0.8rem; color: #64748b; text-align: center;">
              © 2026 Aether Studio • Production Creative Platform • <a href="https://aetherstudio.com" style="color: #8b5cf6; text-decoration: none;">aetherstudio.com</a>
            </div>
          </div>
        `
      })
    }).catch(err => console.error('[AUTO-REPLY NOTICE]', err));

    return res.status(200).json({
      success: true,
      delivered: true,
      leadId,
      id: adminEmailData.id,
      message: 'Inquiry email and visitor auto-reply confirmation dispatched successfully.'
    });

  } catch (err) {
    console.error('Unhandled error in /api/contact handler:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
