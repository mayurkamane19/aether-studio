/**
 * SERVERLESS API ENDPOINT: /api/admin/ai
 * AI Agency Operating System Command Center & Recommendation Approval API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN.
 * Recommendation-Only Model: AI generates structured suggestions; Admin explicitly reviews and approves.
 */

const db = require('../../lib/db');
const aiAgency = require('../../lib/ai_agency');

const rateLimitMap = new Map();

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

  // 2. Rate Limiting Check (20 requests per 60s)
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const userLimit = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + 60000 };

  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + 60000;
  } else {
    userLimit.count += 1;
  }
  rateLimitMap.set(clientIp, userLimit);

  if (userLimit.count > 20) {
    return res.status(429).json({ success: false, error: 'AI Agency API Rate Limit Exceeded. Please try again in a minute.' });
  }

  // 3. GET /api/admin/ai (Executive Summary & Briefing)
  if (req.method === 'GET') {
    try {
      const summary = await aiAgency.generateExecutiveSummary();
      const briefing = await aiAgency.generateDailyBriefing();

      return res.status(200).json({
        success: true,
        summary,
        briefing
      });

    } catch (err) {
      console.error('Error in GET /api/admin/ai:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 4. POST /api/admin/ai (Actions, Scope Creep & Approval Workflow)
  if (req.method === 'POST') {
    try {
      const { action = 'EXECUTIVE_SUMMARY', leadId, actionId, status } = req.body || {};

      if (action === 'APPROVE' || action === 'REJECT') {
        if (!actionId) {
          return res.status(400).json({ success: false, error: 'actionId is required for approval workflow.' });
        }

        const updateRes = await aiAgency.setAiActionStatus(actionId, action === 'APPROVE' ? 'APPROVED' : 'REJECTED');
        if (!updateRes.success) {
          return res.status(400).json({ success: false, error: updateRes.error || 'Failed to update action status.' });
        }

        return res.status(200).json({
          success: true,
          actionId,
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          message: `AI action ${actionId} marked ${action === 'APPROVE' ? 'APPROVED' : 'REJECTED'}.`
        });
      }

      if (action === 'SCOPE_CHECK') {
        if (!leadId) {
          return res.status(400).json({ success: false, error: 'leadId is required for scope creep detection.' });
        }

        const scopeResult = await aiAgency.detectScopeCreep(leadId);
        return res.status(200).json({
          success: true,
          leadId,
          scopeCheck: scopeResult
        });
      }

      if (action === 'CHAT') {
        const { message, conversationId } = req.body || {};
        if (!message) {
          return res.status(400).json({ success: false, error: 'message is required for AI Copilot Chat.' });
        }

        const chatRes = await aiAgency.processCopilotChat({ message, conversationId });
        return res.status(200).json(chatRes);
      }

      const summary = await aiAgency.generateExecutiveSummary();
      return res.status(200).json({
        success: true,
        summary
      });

    } catch (err) {
      console.error('Error in POST /api/admin/ai:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
