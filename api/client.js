/**
 * SERVERLESS API ENDPOINT: /api/client
 * Client Portal 2.0 & Collaboration Hub API for Aether Studio.
 * Validates cryptographically hashed portal access tokens.
 * Data Isolation Guarantee: Client A token ONLY returns Client A project data.
 * Zero internal secrets, team workload, AI scores, or financial strategy exposed.
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

  if (userLimit.count > 30) {
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

      if (!portalData || !portalData.lead) {
        return res.status(401).json({ success: false, error: 'Client portal link is invalid, expired, or revoked.' });
      }

      const leadId = portalData.lead.leadId;
      const deliverables = (await db.getClientDeliverablesByLead(leadId)).rows || [];
      const tickets = (await db.getClientTicketsByLead(leadId)).rows || [];
      const notifications = (await db.getClientNotifications(leadId)).rows || [];
      const changeRequests = (await db.getClientChangeRequests(leadId)).rows || [];
      const activityLogs = (await db.getClientActivityLogs(leadId)).rows || [];

      return res.status(200).json({
        success: true,
        portal: {
          ...portalData,
          deliverables,
          tickets,
          notifications,
          changeRequests,
          activityLogs
        }
      });

    } catch (err) {
      console.error('Error in GET /api/client:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 2. POST /api/client (Client Actions: Messages, Approvals, Feedback & Tickets)
  if (req.method === 'POST') {
    try {
      const { token, action, message, deliverableId, rating, comment, subject, description } = req.body || {};

      if (!token) {
        return res.status(400).json({ success: false, error: 'Portal token is required.' });
      }

      const portalData = await db.getClientPortalDataByToken(String(token).trim());

      if (!portalData || !portalData.lead || !portalData.lead.leadId) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid portal token.' });
      }

      const leadId = portalData.lead.leadId;

      if (action === 'APPROVE_DELIVERABLE') {
        if (!deliverableId) {
          return res.status(400).json({ success: false, error: 'deliverableId is required.' });
        }
        const appRes = await db.approveDeliverable(deliverableId, leadId);
        if (comment) {
          await db.addClientFeedback(deliverableId, leadId, rating || 5, comment);
        }
        return res.status(200).json({ success: true, deliverable: appRes.rows ? appRes.rows[0] : null });
      }

      if (action === 'CREATE_TICKET') {
        if (!subject || !description) {
          return res.status(400).json({ success: false, error: 'subject and description are required.' });
        }
        const tktRes = await db.createClientTicket({ leadId, subject, description });
        return res.status(200).json({ success: true, ticket: tktRes.rows ? tktRes.rows[0] : null });
      }

      if (action === 'CREATE_CHANGE_REQUEST') {
        const { title, description: reqDesc, priority, projectId, deliverableId: delivId } = req.body || {};
        if (!title || !reqDesc) {
          return res.status(400).json({ success: false, error: 'title and description are required.' });
        }
        const chgRes = await db.createClientChangeRequest({
          leadId,
          projectId,
          deliverableId: delivId,
          title,
          description: reqDesc,
          priority
        });
        return res.status(200).json({ success: true, changeRequest: chgRes.rows ? chgRes.rows[0] : null });
      }

      // Default action: POST_MESSAGE
      if (!message) {
        return res.status(400).json({ success: false, error: 'Message content is required.' });
      }

      const sanitizedMsg = String(message).replace(/[<>]/g, '').trim();
      await db.addClientMessage(leadId, 'CLIENT', sanitizedMsg);

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
