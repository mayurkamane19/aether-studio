/**
 * SERVERLESS API ENDPOINT: /api/admin/customer-success
 * Customer Success, Retention & Client Lifecycle API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Manages Client Health Scores, Renewals, CSAT/NPS, and Retention.
 */

const db = require('../../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Admin Token Check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  // 2. GET /api/admin/customer-success (Health History, Renewals)
  if (req.method === 'GET') {
    try {
      const { leadId } = req.query || {};

      let healthHistory = [];
      if (leadId) {
        healthHistory = (await db.getClientHealthHistory(String(leadId).trim())).rows || [];
      }

      const renewalsRes = await db.getClientRenewals(leadId ? String(leadId).trim() : null);
      const analytics = await db.getCRMAnalytics();

      return res.status(200).json({
        success: true,
        healthHistory,
        renewals: renewalsRes.rows || [],
        analytics
      });

    } catch (err) {
      console.error('Error in GET /api/admin/customer-success:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. POST /api/admin/customer-success (Actions)
  if (req.method === 'POST') {
    try {
      const { action = 'CALCULATE_HEALTH_SCORE', leadId, rating, comment } = req.body || {};

      if (!leadId) {
        return res.status(400).json({ success: false, error: 'leadId is required.' });
      }

      if (action === 'CALCULATE_HEALTH_SCORE') {
        const scoreRes = await db.calculateClientHealthScore(leadId);
        return res.status(200).json({ success: true, healthScore: scoreRes.rows ? scoreRes.rows[0] : null });
      }

      if (action === 'CREATE_RENEWAL') {
        const renRes = await db.createClientRenewal(req.body);
        return res.status(200).json({ success: true, renewal: renRes.rows ? renRes.rows[0] : null });
      }

      if (action === 'ADD_FEEDBACK') {
        if (rating === undefined) {
          return res.status(400).json({ success: false, error: 'rating is required.' });
        }
        const fbRes = await db.addClientFeedback({ leadId, rating, comment });
        return res.status(200).json({ success: true, feedback: fbRes.rows ? fbRes.rows[0] : null });
      }

      return res.status(400).json({ success: false, error: 'Invalid customer-success action.' });

    } catch (err) {
      console.error('Error in POST /api/admin/customer-success:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
