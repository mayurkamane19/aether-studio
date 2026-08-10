/**
 * SERVERLESS API ENDPOINT: /api/admin/support
 * Advanced Support & Helpdesk API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Manages Tickets, Knowledge Base, SLA Deadlines, and Internal Notes.
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

  // 2. GET /api/admin/support (Tickets & Knowledge Base)
  if (req.method === 'GET') {
    try {
      const { leadId } = req.query || {};

      let tickets = [];
      if (leadId) {
        tickets = (await db.getClientTicketsByLead(String(leadId).trim())).rows || [];
      } else {
        const tktRes = await db.query(`SELECT * FROM client_tickets ORDER BY created_at DESC LIMIT 50;`);
        tickets = tktRes.rows || [];
      }

      const kbArticles = (await db.getKnowledgeArticles(true)).rows || [];

      return res.status(200).json({
        success: true,
        tickets,
        knowledgeBase: kbArticles
      });

    } catch (err) {
      console.error('Error in GET /api/admin/support:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. POST /api/admin/support (Actions)
  if (req.method === 'POST') {
    try {
      const { action = 'CREATE_TICKET', leadId, subject, description, ticketId, message, author } = req.body || {};

      if (action === 'CREATE_TICKET') {
        if (!leadId || !subject || !description) {
          return res.status(400).json({ success: false, error: 'leadId, subject, and description are required.' });
        }
        const tktRes = await db.createClientTicket({ leadId, subject, description });
        return res.status(200).json({ success: true, ticket: tktRes.rows ? tktRes.rows[0] : null });
      }

      if (action === 'REPLY_TICKET') {
        if (!ticketId || !message) {
          return res.status(400).json({ success: false, error: 'ticketId and message are required.' });
        }
        const msgRes = await db.addTicketMessage(ticketId, author || 'Admin Support', message);
        return res.status(200).json({ success: true, message: msgRes.rows ? msgRes.rows[0] : null });
      }

      if (action === 'CREATE_KB_ARTICLE') {
        const kbRes = await db.createKnowledgeArticle(req.body);
        return res.status(200).json({ success: true, article: kbRes.rows ? kbRes.rows[0] : null });
      }

      return res.status(400).json({ success: false, error: 'Invalid support action.' });

    } catch (err) {
      console.error('Error in POST /api/admin/support:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
