/**
 * SERVERLESS API ENDPOINT: /api/admin/analytics
 * Advanced CRM Analytics & Sales Intelligence Endpoint for Aether Studio Admin Portal.
 * Protected by ADMIN_CRM_TOKEN. Returns real PostgreSQL aggregate metrics, conversion funnels,
 * pipeline values, AI quality breakdowns, proposal performance, and CSV exports.
 */

const db = require('../../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // Admin Bearer Token Check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  try {
    const { range = 'ALL', statusFilter = 'ALL', projectTypeFilter = 'ALL', exportCSV } = req.query || {};

    const analytics = await db.getCRMAnalytics({
      range: String(range).toUpperCase(),
      statusFilter: String(statusFilter).toUpperCase(),
      projectTypeFilter: String(projectTypeFilter)
    });

    // Handle Admin CSV Business Report Export
    if (exportCSV === 'true' || exportCSV === '1') {
      const leadsRes = await db.getLeadsPaginated({ limit: 500 });
      const leads = leadsRes.inquiries || [];

      let csvRows = ['Lead ID,Name,Company,Project Type,Status,Budget Range,Lead Score,Source,Submission Date'];
      leads.forEach(l => {
        const row = [
          `"${l.leadId || ''}"`,
          `"${(l.name || '').replace(/"/g, '""')}"`,
          `"${(l.company || '').replace(/"/g, '""')}"`,
          `"${(l.projectType || '').replace(/"/g, '""')}"`,
          `"${l.status || 'NEW'}"`,
          `"${(l.budgetRange || '').replace(/"/g, '""')}"`,
          l.leadScore || 0,
          `"${l.source || 'Website'}"`,
          `"${new Date(l.submissionDate).toLocaleDateString()}"`
        ];
        csvRows.push(row.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=aether_crm_leads_${Date.now()}.csv`);
      return res.status(200).send(csvRows.join('\n'));
    }

    return res.status(200).json({
      success: true,
      analytics
    });

  } catch (err) {
    console.error('Error in /api/admin/analytics:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
