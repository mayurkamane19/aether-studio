/**
 * SERVERLESS API ENDPOINT: /api/admin/integrations
 * Advanced Integrations & Ecosystem 7.0 API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Manages Webhook Engine, Provider Abstraction, and Ecosystem Health.
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

  // 2. GET /api/admin/integrations (Integration Hub & Webhook Logs)
  if (req.method === 'GET') {
    try {
      const { provider } = req.query || {};

      const logsRes = await db.getWebhookLogs(provider ? String(provider).trim() : null);

      const integrations = [
        { name: 'Resend Email API', provider: 'RESEND', status: process.env.RESEND_API_KEY ? 'CONNECTED' : 'NOT CONFIGURED' },
        { name: 'OpenAI Business Copilot', provider: 'OPENAI', status: process.env.OPENAI_API_KEY ? 'CONNECTED' : 'NOT CONFIGURED' },
        { name: 'PostgreSQL Database', provider: 'SUPABASE_PG', status: process.env.DATABASE_URL ? 'CONNECTED' : 'NOT CONFIGURED' },
        { name: 'GA4 Analytics', provider: 'GOOGLE_ANALYTICS', status: 'CONNECTED', id: 'G-B246FD27DH' }
      ];

      return res.status(200).json({
        success: true,
        integrations,
        webhookLogs: logsRes.rows || []
      });

    } catch (err) {
      console.error('Error in GET /api/admin/integrations:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. POST /api/admin/integrations (Log Incoming Webhook)
  if (req.method === 'POST') {
    try {
      const { provider = 'GENERIC', eventType = 'WEBHOOK_RECEIVED', signature, payload } = req.body || {};

      const logRes = await db.logWebhookEvent({ provider, eventType, signature, payload });
      return res.status(200).json({ success: true, webhook: logRes.rows ? logRes.rows[0] : null });

    } catch (err) {
      console.error('Error in POST /api/admin/integrations:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
