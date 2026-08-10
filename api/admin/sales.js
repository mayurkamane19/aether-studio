/**
 * SERVERLESS API ENDPOINT: /api/admin/sales
 * Sales, Marketing & Client Acquisition Engine API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Manages Campaigns, Lead Attribution, Lead Scoring, and Sales Analytics.
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

  // 2. GET /api/admin/sales (Pipeline, Campaigns, Attribution)
  if (req.method === 'GET') {
    try {
      const { leadId } = req.query || {};

      let attribution = null;
      if (leadId) {
        const attrRes = await db.getLeadAttribution(String(leadId).trim());
        attribution = attrRes.rows ? attrRes.rows[0] : null;
      }

      const campaignsRes = await db.getCampaigns();
      const analytics = await db.getCRMAnalytics();

      return res.status(200).json({
        success: true,
        attribution,
        campaigns: campaignsRes.rows || [],
        analytics
      });

    } catch (err) {
      console.error('Error in GET /api/admin/sales:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. POST /api/admin/sales (Actions)
  if (req.method === 'POST') {
    try {
      const { action = 'CREATE_CAMPAIGN', leadId, status, score } = req.body || {};

      if (action === 'CREATE_CAMPAIGN') {
        const cmpRes = await db.createCampaign(req.body);
        return res.status(200).json({ success: true, campaign: cmpRes.rows ? cmpRes.rows[0] : null });
      }

      if (action === 'UPDATE_LEAD_STATUS') {
        if (!leadId || !status) {
          return res.status(400).json({ success: false, error: 'leadId and status are required.' });
        }
        const updRes = await db.updateLeadStatus(leadId, status);
        return res.status(200).json({ success: true, lead: updRes.rows ? updRes.rows[0] : null });
      }

      if (action === 'UPDATE_LEAD_SCORE') {
        if (!leadId || score === undefined) {
          return res.status(400).json({ success: false, error: 'leadId and score are required.' });
        }
        const scoreRes = await db.updateLeadAIIntelligence(leadId, { leadScore: parseInt(score, 10) });
        return res.status(200).json({ success: true, lead: scoreRes.rows ? scoreRes.rows[0] : null });
      }

      return res.status(400).json({ success: false, error: 'Invalid sales action.' });

    } catch (err) {
      console.error('Error in POST /api/admin/sales:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
