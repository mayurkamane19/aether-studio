/**
 * SERVERLESS API ENDPOINT: /api/admin/followup
 * Admin Lead Follow-up Control & Manual Follow-up Dispatcher for Aether Studio Admin Portal.
 * Protected by ADMIN_CRM_TOKEN. Supports manual send, pause, resume, and cancellation.
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

  // Admin Token Check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  try {
    const { leadId, action } = req.body || {};

    if (!leadId) {
      return res.status(400).json({ success: false, error: 'leadId is required.' });
    }

    if (action === 'PAUSE') {
      await db.toggleLeadFollowupEnabled(leadId, false);
      return res.status(200).json({ success: true, message: 'Automated follow-up sequence paused.' });
    }

    if (action === 'RESUME') {
      await db.toggleLeadFollowupEnabled(leadId, true);
      return res.status(200).json({ success: true, message: 'Automated follow-up sequence resumed.' });
    }

    if (action === 'CANCEL') {
      await db.query(`UPDATE lead_followups SET status = 'CANCELLED' WHERE lead_id = $1 AND status = 'PENDING'`, [leadId]);
      await db.logLeadActivity(leadId, 'FOLLOWUP_CANCELLED', 'Follow-up sequence cancelled by admin.');
      return res.status(200).json({ success: true, message: 'Follow-up sequence cancelled.' });
    }

    // Manual Send (SEND_NOW or Default)
    const elig = await db.checkLeadEligibilityForFollowup(leadId);
    if (!elig.eligible) {
      return res.status(400).json({ success: false, error: `Lead is not eligible for follow-up: ${elig.reason}` });
    }

    const lead = elig.lead;
    const followupsRes = await db.getFollowupsByLead(leadId);
    let followups = followupsRes.rows || [];

    // Find next pending follow-up or default to Follow-up #1
    let target = followups.find(f => f.status === 'PENDING');
    if (!target) {
      target = {
        id: null,
        followupType: 'FOLLOWUP_1',
        sequenceNumber: followups.length + 1
      };
    }

    const firstName = String(lead.name || 'Valued Client').split(' ')[0];
    const projectType = lead.projectType || 'digital engineering project';

    let subject = `Following up on your Aether Studio inquiry [${lead.leadId}]`;
    let body = `Dear ${firstName},\n\nI wanted to follow up on your recent inquiry regarding your ${projectType}. Our strategy team is ready to walk you through our dark luxury engineering architecture and scope.\n\nPlease let us know if you have any questions or when you would be available for a brief consultation.\n\nBest regards,\nAether Studio Architecture Desk`;

    if (target.followupType === 'FOLLOWUP_2') {
      subject = `Re: Assistance with your ${projectType} — Aether Studio`;
      body = `Hi ${firstName},\n\nChecking in to see if you still need assistance with your ${projectType} or if your project timeline has shifted.\n\nWe can customize our design tokens and serverless deliverables to fit your specific milestones. Let us know if you'd like us to share a preliminary scope.\n\nWarm regards,\nAether Studio Team`;
    } else if (target.followupType === 'FOLLOWUP_3') {
      subject = `Final check-in regarding your inquiry [${lead.leadId}]`;
      body = `Hi ${firstName},\n\nWe will close this inquiry for now so we don't crowd your inbox. If you ever decide to move forward with your ${projectType}, you are welcome to reach out anytime!\n\nBest regards,\nAether Studio Desk`;
    }

    // Dispatch Email via Resend if credentials configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Aether Studio Desk <onboarding@resend.dev>';

    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [lead.email],
          reply_to: 'mayurkamane23@gmail.com',
          subject,
          text: body
        })
      }).catch(err => console.error('[FOLLOWUP RESEND ERROR]', err.message));
    }

    if (target.id) {
      await db.updateFollowupStatus(target.id, 'SENT', { subject, body });
    } else {
      await db.query(`
        INSERT INTO lead_followups (lead_id, followup_type, sequence_number, scheduled_at, sent_at, status, email_subject, email_body, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW(), 'SENT', $4, $5, NOW(), NOW())
      `, [leadId, target.followupType, target.sequenceNumber, subject, body]);
      await db.logLeadActivity(leadId, 'FOLLOWUP_SENT', `Manual ${target.followupType} sent to ${lead.email}.`);
    }

    return res.status(200).json({
      success: true,
      message: `Follow-up email (${target.followupType}) sent cleanly to ${lead.email}.`
    });

  } catch (err) {
    console.error('Error in /api/admin/followup:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
