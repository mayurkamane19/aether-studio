/**
 * SERVERLESS API ENDPOINT: /api/proposal
 * Public Secure Proposal Viewer, View Tracking & Client Acceptance API for Aether Studio.
 * No ADMIN_CRM_TOKEN required for clients accessing via secure link (proposalId + accessToken).
 * Enforces strict security & rate limiting. Does NOT expose internal CRM data or admin secrets.
 */

const db = require('../lib/db');

// Basic In-Memory Rate Limiter (20 requests / 60 seconds per IP)
const rateLimitMap = new Map();

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate Limiting Check
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
    return res.status(429).json({ success: false, error: 'Too many requests. Please try again in a minute.' });
  }

  // 1. Fetch Client Proposal (GET)
  if (req.method === 'GET') {
    try {
      const { id, token } = req.query || {};

      if (!id || !token) {
        return res.status(400).json({ success: false, error: 'Proposal ID and Access Token are required.' });
      }

      const proposal = await db.getProposalByPublicToken(String(id).trim(), String(token).trim());

      if (!proposal) {
        return res.status(404).json({ success: false, error: 'Proposal not found or access token is invalid.' });
      }

      // Track View Timestamp & Status (SENT -> VIEWED)
      if (proposal.status === 'SENT' || proposal.status === 'DRAFT') {
        db.updateProposalStatus(proposal.proposalId, 'VIEWED');
        proposal.status = 'VIEWED';
        proposal.viewedAt = new Date().toISOString();
      }

      return res.status(200).json({
        success: true,
        proposal
      });

    } catch (err) {
      console.error('Error in GET /api/proposal:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 2. Process Client Acceptance / Rejection (POST)
  if (req.method === 'POST') {
    try {
      const { proposalId, token, action, reason } = req.body || {};

      if (!proposalId || !token || !action) {
        return res.status(400).json({ success: false, error: 'proposalId, token, and action are required.' });
      }

      const proposal = await db.getProposalByPublicToken(String(proposalId).trim(), String(token).trim());

      if (!proposal) {
        return res.status(404).json({ success: false, error: 'Proposal not found or access token is invalid.' });
      }

      if (proposal.status === 'ACCEPTED' && action === 'ACCEPT') {
        return res.status(200).json({ success: true, message: 'Proposal has already been accepted.', proposal });
      }

      if (action === 'ACCEPT') {
        await db.updateProposalStatus(proposal.proposalId, 'ACCEPTED');
        return res.status(200).json({
          success: true,
          status: 'ACCEPTED',
          message: 'Thank you! You have successfully accepted the proposal. Our strategy team will reach out immediately to initiate onboarding.'
        });
      } else if (action === 'REJECT') {
        await db.updateProposalStatus(proposal.proposalId, 'REJECTED', { rejectionReason: reason });
        return res.status(200).json({
          success: true,
          status: 'REJECTED',
          message: 'Thank you for your feedback. We have recorded your response.'
        });
      } else {
        return res.status(400).json({ success: false, error: 'Invalid action. Must be ACCEPT or REJECT.' });
      }

    } catch (err) {
      console.error('Error in POST /api/proposal:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
