/**
 * SERVERLESS API ENDPOINT: /api/admin/reports
 * Advanced Reporting & Data Intelligence 3.0 API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Aggregates metrics from CRM, Sales, Projects, Finance, Support, and Customer Success.
 */

const db = require('../../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Admin Token Verification
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  // 2. GET /api/admin/reports (Saved Reports & Central Analytics)
  if (req.method === 'GET') {
    try {
      const { category } = req.query || {};

      const reportsRes = await db.getSavedReports(category ? String(category).trim() : null);
      const analytics = await db.getCRMAnalytics();

      return res.status(200).json({
        success: true,
        savedReports: reportsRes.rows || [],
        analytics
      });

    } catch (err) {
      console.error('Error in GET /api/admin/reports:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. POST /api/admin/reports (Create Saved Report / Export)
  if (req.method === 'POST') {
    try {
      const { action = 'CREATE_REPORT', name, category, queryConfig } = req.body || {};

      if (action === 'CREATE_REPORT') {
        if (!name || !queryConfig) {
          return res.status(400).json({ success: false, error: 'name and queryConfig are required.' });
        }
        const rptRes = await db.createSavedReport({ name, category, queryConfig });
        return res.status(200).json({ success: true, report: rptRes.rows ? rptRes.rows[0] : null });
      }

      return res.status(400).json({ success: false, error: 'Invalid reports action.' });

    } catch (err) {
      console.error('Error in POST /api/admin/reports:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
