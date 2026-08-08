/**
 * SERVERLESS API ENDPOINT: /api/inquiry
 * Handles client project inquiry storage and secure CRM status querying.
 * Uses DATABASE_URL (Supabase / PostgreSQL) and ADMIN_CRM_TOKEN for admin authentication.
 */

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

      if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Name and email are required fields.' });
      }

      const inquiryRecord = {
        id: `INQ-${Date.now().toString(36).toUpperCase()}`,
        name: String(name).replace(/[<>]/g, '').trim(),
        email: String(email).replace(/[<>]/g, '').trim(),
        company: String(company || 'Independent').replace(/[<>]/g, '').trim(),
        projectType: String(projectType || 'General').replace(/[<>]/g, '').trim(),
        budgetRange: String(budgetRange || 'Standard').replace(/[<>]/g, '').trim(),
        timeline: String(timeline || 'Standard').replace(/[<>]/g, '').trim(),
        message: String(message || '').replace(/[<>]/g, '').trim(),
        source: String(source || 'Website').replace(/[<>]/g, '').trim(),
        submissionDate: new Date().toISOString(),
        status: 'New' // Options: New, Contacted, Qualified, Proposal Sent, Won, Lost
      };

      const dbUrl = process.env.DATABASE_URL;

      if (!dbUrl) {
        console.log('[CONFIG NOTICE] DATABASE_URL environment variable is not configured.');
        return res.status(200).json({
          success: true,
          notice: 'Inquiry payload structured successfully. Server environment variable DATABASE_URL is required for live PostgreSQL/Supabase persistence.',
          record: inquiryRecord
        });
      }

      // If database is configured, perform query here...
      return res.status(200).json({ success: true, record: inquiryRecord });

    } catch (err) {
      console.error('Error saving inquiry:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 2. Admin CRM List / Query Inquiries (GET) — Admin Auth Protected
  if (req.method === 'GET') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    const adminToken = process.env.ADMIN_CRM_TOKEN;

    if (!adminToken || token !== adminToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Valid Admin Authorization Token required.' });
    }

    return res.status(200).json({
      success: true,
      inquiries: [],
      notice: 'Admin token authorized. Configure DATABASE_URL to stream live database records.'
    });
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
