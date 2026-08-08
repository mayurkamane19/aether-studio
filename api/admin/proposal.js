/**
 * SERVERLESS API ENDPOINT: /api/admin/proposal
 * Explicit Proposal Email Dispatcher for Aether Studio Admin Portal.
 * Triggered ONLY by explicit admin action in dashboard. Protected by ADMIN_CRM_TOKEN.
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // Admin Token Check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  try {
    const { leadId, clientName, clientEmail, projectType, budget, timeline, deliverables, terms } = req.body || {};

    if (!clientEmail || !clientEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid client email is required to send proposal.' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Aether Studio Desk <onboarding@resend.dev>';

    if (!resendApiKey) {
      return res.status(200).json({
        success: true,
        notice: 'Proposal email structured cleanly. RESEND_API_KEY environment variable required for live dispatch.'
      });
    }

    const cleanLeadId = String(leadId || 'AS-2026-PROPOSAL').trim();
    const cleanName = String(clientName || 'Valued Client').trim();
    const cleanService = String(projectType || 'Custom Project Scope').trim();
    const cleanBudget = String(budget || 'As Quoted').trim();
    const cleanTimeline = String(timeline || '2 to 3 Weeks').trim();
    const proposalDate = new Date().toUTCString();

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail,
        to: [clientEmail],
        subject: `[${cleanLeadId}] Official Project Proposal — Aether Studio`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #f8fafc; max-width: 650px; margin: 0 auto; padding: 28px; border: 1px solid #334155; border-radius: 12px; background: #06070a;">
            <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 1.8rem; letter-spacing: 1px;">AETHER <span style="color: #8b5cf6;">STUDIO</span></h2>
              <span style="font-size: 0.85rem; color: #94a3b8;">Official Project Proposal & Investment Summary</span>
            </div>

            <p style="font-size: 1.1rem; color: #f1f5f9;">Dear ${cleanName},</p>
            <p style="color: #cbd5e1; line-height: 1.6;">
              Following our preliminary evaluation of your requirements, we are pleased to present the official scope proposal for your project (Reference: <strong>${cleanLeadId}</strong>).
            </p>

            <div style="background: rgba(255,255,255,0.04); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); margin: 24px 0;">
              <h3 style="color: #8b5cf6; margin-top: 0;">Scope & Financial Summary</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem; color: #cbd5e1;">
                <tr><td style="padding: 6px 0; font-weight: bold; width: 150px;">Project Type:</td><td>${cleanService}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Investment Quote:</td><td style="color: #34d399; font-weight: bold;">${cleanBudget}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Estimated Schedule:</td><td>${cleanTimeline}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Proposal Date:</td><td>${proposalDate}</td></tr>
              </table>
            </div>

            <div style="background: rgba(139, 92, 246, 0.1); padding: 18px; border-radius: 10px; border-left: 4px solid #8b5cf6; margin-bottom: 24px;">
              <strong style="color: #c084fc; display: block; margin-bottom: 8px;">Key Deliverables Included:</strong>
              <p style="margin: 0; color: #e0e7ff; font-size: 0.9rem; line-height: 1.6;">${deliverables || 'Full responsive web engineering, dark luxury visual design system, mobile performance optimization, SEO canonical structure, and Service Worker offline caching.'}</p>
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 24px; font-size: 0.82rem; color: #64748b; text-align: center;">
              © 2026 Aether Studio • Creative Engineering & Architecture • <a href="https://aetherstudio.com" style="color: #8b5cf6; text-decoration: none;">aetherstudio.com</a>
            </div>
          </div>
        `
      })
    });

    const resendData = await response.json();
    return res.status(200).json({ success: true, message: 'Proposal email sent to client.', id: resendData.id });

  } catch (err) {
    console.error('Error in /api/admin/proposal:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
