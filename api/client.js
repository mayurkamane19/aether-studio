/**
 * SERVERLESS API ENDPOINT: /api/client
 * Client Portal Data Retrieval & Interactive Messaging API for Aether Studio.
 * Validates cryptographically hashed portal access tokens.
 * Data Isolation Guarantee: Client A token ONLY returns Client A project data.
 * Zero secrets or internal admin metadata exposed.
 */

const db = require('../lib/db');

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

  // 1. GET /api/client?token=<PORTAL_TOKEN>
  if (req.method === 'GET') {
    try {
      const { token } = req.query || {};

      if (!token) {
        return res.status(400).json({ success: false, error: 'Portal access token is required.' });
      }

      const portalData = await db.getClientPortalDataByToken(String(token).trim());

      if (!portalData) {
        return res.status(401).json({ success: false, error: 'Client portal link is invalid, expired, or revoked.' });
      }

      return res.status(200).json({
        success: true,
        portal: portalData
      });

    } catch (err) {
      console.error('Error in GET /api/client:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 2. POST /api/client (Post Client Message)
  if (req.method === 'POST') {
    try {
      const { token, message, action } = req.body || {};

      if (!token || !message) {
        return res.status(400).json({ success: false, error: 'Portal token and message are required.' });
      }

      const portalData = await db.getClientPortalDataByToken(String(token).trim());

      if (!portalData || !portalData.lead || !portalData.lead.leadId) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid portal token.' });
      }

      const sanitizedMsg = String(message).replace(/[<>]/g, '').trim();
      if (!sanitizedMsg) {
        return res.status(400).json({ success: false, error: 'Message content cannot be empty.' });
      }

      await db.addClientMessage(portalData.lead.leadId, 'CLIENT', sanitizedMsg);

      return res.status(200).json({
        success: true,
        message: 'Message posted successfully.'
      });

    } catch (err) {
      console.error('Error in POST /api/client:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
