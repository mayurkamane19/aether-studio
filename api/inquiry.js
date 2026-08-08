/**
 * SERVERLESS API ENDPOINT: /api/inquiry
 * Handles client project inquiry storage, unique Inquiry ID (INQ-2026-XXXXXX),
 * status updates (NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST), and admin lead queries.
 * Integrates with lib/db.js for PostgreSQL database persistence.
 */

const db = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Submit New Inquiry (POST)
  if (req.method === 'POST') {
    try {
      const { name, email, company, projectType, budgetRange, timeline, message, source } = req.body || {};

      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, error: 'Name is required.' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(String(email).trim())) {
        return res.status(400).json({ success: false, error: 'Valid email address is required.' });
      }

      const sanitize = (str) => String(str || '').replace(/[<>]/g, '').trim();
      const randomCode = Math.floor(100000 + Math.random() * 900000);
      const inquiryId = `INQ-2026-${randomCode}`;

      const cleanName = sanitize(name);
      const cleanEmail = sanitize(email);
      const cleanCompany = sanitize(company || 'Independent');
      const cleanService = sanitize(projectType || 'General Inquiry');
      const cleanBudget = sanitize(budgetRange || 'Standard');
      const cleanTimeline = sanitize(timeline || 'Flexible');
      const cleanMessage = sanitize(message || 'No details provided.');
      const cleanSource = sanitize(source || 'Website');

      const inquiryRecord = {
        leadId: inquiryId,
        name: cleanName,
        email: cleanEmail,
        company: cleanCompany,
        projectType: cleanService,
        budget: cleanBudget,
        timeline: cleanTimeline,
        preferredContact: 'Email',
        message: cleanMessage,
        status: 'NEW',
        source: cleanSource
      };

      // Save to PostgreSQL DB
      try {
        await db.saveLead(inquiryRecord);
      } catch (dbErr) {
        console.error('[DB INQUIRY INSERT NOTICE]', dbErr.message);
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      const destinationEmail = process.env.CONTACT_DESTINATION_EMAIL || 'mayurkamane23@gmail.com';
      const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Aether Studio Desk <onboarding@resend.dev>';

      if (resendApiKey) {
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: fromEmail,
            to: [destinationEmail],
            reply_to: cleanEmail,
            subject: `[${inquiryId}] New Inquiry: ${cleanName} — ${cleanService}`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fafafa;">
                <span style="font-size: 0.8rem; font-weight: bold; color: #8b5cf6;">INQUIRY ID: ${inquiryId}</span>
                <h2 style="color: #0f172a; margin: 4px 0 16px 0;">New Project Inquiry Submitted</h2>
                <p><strong>Name:</strong> ${cleanName}</p>
                <p><strong>Email:</strong> <a href="mailto:${cleanEmail}">${cleanEmail}</a></p>
                <p><strong>Company:</strong> ${cleanCompany}</p>
                <p><strong>Project Type:</strong> ${cleanService}</p>
                <p><strong>Budget:</strong> ${cleanBudget}</p>
                <p><strong>Timeline:</strong> ${cleanTimeline}</p>
                <p><strong>Message:</strong> ${cleanMessage}</p>
              </div>
            `
          })
        }).catch(err => console.error('[INQUIRY RESEND ERROR]', err));
      }

      return res.status(200).json({ success: true, inquiryId, record: inquiryRecord });

    } catch (err) {
      console.error('Error in /api/inquiry POST:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 2. Update Lead Status (PATCH)
  if (req.method === 'PATCH') {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      const adminToken = process.env.ADMIN_CRM_TOKEN;

      if (adminToken && token !== adminToken) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
      }

      const { leadId, status } = req.body || {};
      if (!leadId || !status) {
        return res.status(400).json({ success: false, error: 'leadId and status are required.' });
      }

      const dbRes = await db.updateLeadStatus(leadId, status);
      return res.status(200).json({ success: true, result: dbRes });
    } catch (err) {
      console.error('Error in /api/inquiry PATCH:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. Admin CRM List & Query Inquiries (GET) — Admin Auth Protected
  if (req.method === 'GET') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    const adminToken = process.env.ADMIN_CRM_TOKEN;

    if (adminToken && token !== adminToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
    }

    const dbRes = await db.getAllLeads();
    if (dbRes.success && dbRes.rows.length > 0) {
      return res.status(200).json({
        success: true,
        inquiries: dbRes.rows,
        source: 'PostgreSQL Database'
      });
    }

    return res.status(200).json({
      success: true,
      inquiries: [],
      notice: 'Admin token authorized. Connect DATABASE_URL to stream live database records.'
    });
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
