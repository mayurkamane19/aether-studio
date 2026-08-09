/**
 * SERVERLESS API ENDPOINT: /api/admin/client-portal
 * Admin Client Portal Link Generator & Revocation Endpoint for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Generates cryptographic access links and manages client access lifetimes.
 */

const db = require('../../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // 1. Admin Token Authorization Verification
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  try {
    const { leadId, action = 'GENERATE', validDays = 30 } = req.body || {};

    if (!leadId) {
      return res.status(400).json({ success: false, error: 'leadId is required.' });
    }

    if (action === 'REVOKE') {
      await db.revokeClientPortalAccess(leadId);
      return res.status(200).json({
        success: true,
        message: `Client portal access for lead ${leadId} has been revoked.`
      });
    }

    // GENERATE Portal Token
    const result = await db.createOrGetClientPortalToken(leadId, parseInt(validDays, 10));

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error || 'Failed to generate client portal token.' });
    }

    const host = req.headers.host || 'aetherstudio.com';
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const portalUrl = `${protocol}://${host}/portal.html?token=${result.rawToken}`;

    return res.status(200).json({
      success: true,
      leadId,
      portalUrl,
      rawToken: result.rawToken,
      expiresAt: result.expiresAt
    });

  } catch (err) {
    console.error('Error in /api/admin/client-portal:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
