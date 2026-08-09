/**
 * SERVERLESS API ENDPOINT: /api/admin/communications
 * Omnichannel Communication & Notification Hub API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Manages Email dispatch (Resend), Portal Messaging, WhatsApp links, and Notifications.
 */

const db = require('../../lib/db');
const { Resend } = require('resend');

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

  // 2. GET /api/admin/communications?leadId=...
  if (req.method === 'GET') {
    try {
      const { leadId } = req.query || {};

      let timeline = [];
      if (leadId) {
        timeline = (await db.getConversationTimeline(String(leadId).trim())).rows || [];
      }

      const notifications = (await db.getNotifications(50)).rows || [];
      const templates = (await db.getMessageTemplates()).rows || [];

      return res.status(200).json({
        success: true,
        timeline,
        notifications,
        templates
      });

    } catch (err) {
      console.error('Error in GET /api/admin/communications:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. POST /api/admin/communications (Send Email / Add Message)
  if (req.method === 'POST') {
    try {
      const { leadId, action = 'SEND_EMAIL', channel = 'EMAIL', subject = '', message, recipientEmail } = req.body || {};

      if (!leadId || !message) {
        return res.status(400).json({ success: false, error: 'leadId and message content are required.' });
      }

      const lead = await db.getLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ success: false, error: 'Lead record not found.' });
      }

      const targetEmail = recipientEmail || lead.email;

      // Resend Email Dispatch
      if (channel === 'EMAIL' && action === 'SEND_EMAIL') {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
          try {
            const resend = new Resend(apiKey);
            await resend.emails.send({
              from: process.env.CONTACT_FROM_EMAIL || 'Aether Studio <onboarding@resend.dev>',
              to: [targetEmail],
              subject: subject || `Aether Studio Project Update — ${lead.projectType}`,
              html: `<div style="font-family: sans-serif; padding: 20px;">${message.replace(/\n/g, '<br>')}</div>`
            });
          } catch (resendErr) {
            console.warn('Resend email dispatch warning:', resendErr.message);
          }
        }
      }

      // Log Message to Database
      await db.addConversationMessage({
        leadId,
        senderType: action === 'INTERNAL_NOTE' ? 'INTERNAL_NOTE' : 'ADMIN',
        senderName: 'Aether Strategy Team',
        senderEmail: targetEmail,
        channel,
        direction: 'OUTBOUND',
        subject,
        message,
        status: 'SENT'
      });

      return res.status(200).json({
        success: true,
        message: 'Communication logged and dispatched successfully.'
      });

    } catch (err) {
      console.error('Error in POST /api/admin/communications:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
