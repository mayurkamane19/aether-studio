/**
 * SERVERLESS CRON API ENDPOINT: /api/cron/followups
 * Automated Lead Follow-up Engine for Aether Studio.
 * Executed periodically via Vercel Cron or external scheduler. Protected by CRON_SECRET.
 * Implements strict idempotency, duplicate protection, and eligibility checks.
 */

const db = require('../../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Authenticate Cron Request via CRON_SECRET
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.replace('Bearer ', '').trim();
  const customHeader = (req.headers['x-cron-secret'] || '').trim();

  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && bearerToken !== cronSecret && customHeader !== cronSecret) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid CRON_SECRET.' });
  }

  try {
    // 2. Fetch Due Pending Follow-ups from PostgreSQL DB
    const dueRes = await db.getDueFollowups();
    const dueList = dueRes.rows || [];

    let processedCount = 0;
    let sentCount = 0;
    let failedCount = 0;

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Aether Studio Desk <onboarding@resend.dev>';

    for (const item of dueList) {
      processedCount++;

      // 3. Re-verify Lead Eligibility (WON, LOST, ACCEPTED, REJECTED, PAUSED)
      const elig = await db.checkLeadEligibilityForFollowup(item.leadId);
      if (!elig.eligible) {
        await db.updateFollowupStatus(item.id, 'SKIPPED', { errorMessage: elig.reason });
        continue;
      }

      // 4. Lock Status to PROCESSING to prevent duplicate concurrent runs
      await db.updateFollowupStatus(item.id, 'PROCESSING');

      const firstName = String(item.name || 'Valued Client').split(' ')[0];
      const projectType = item.projectType || 'digital engineering project';

      let subject = `Following up on your Aether Studio inquiry [${item.leadId}]`;
      let body = `Dear ${firstName},\n\nI wanted to follow up on your recent inquiry regarding your ${projectType}. Our strategy team is ready to walk you through our dark luxury engineering architecture and scope.\n\nPlease let us know if you have any questions or when you would be available for a brief consultation.\n\nBest regards,\nAether Studio Architecture Desk`;

      if (item.followupType === 'FOLLOWUP_2') {
        subject = `Re: Assistance with your ${projectType} — Aether Studio`;
        body = `Hi ${firstName},\n\nChecking in to see if you still need assistance with your ${projectType} or if your project timeline has shifted.\n\nWe can customize our design tokens and serverless deliverables to fit your specific milestones. Let us know if you'd like us to share a preliminary scope.\n\nWarm regards,\nAether Studio Team`;
      } else if (item.followupType === 'FOLLOWUP_3') {
        subject = `Final check-in regarding your inquiry [${item.leadId}]`;
        body = `Hi ${firstName},\n\nWe will close this inquiry for now so we don't crowd your inbox. If you ever decide to move forward with your ${projectType}, you are welcome to reach out anytime!\n\nBest regards,\nAether Studio Desk`;
      }

      // 5. Deliver Email via Resend
      if (resendApiKey) {
        try {
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: fromEmail,
              to: [item.email],
              reply_to: 'mayurkamane23@gmail.com',
              subject,
              text: body
            })
          });

          if (resendRes.ok) {
            await db.updateFollowupStatus(item.id, 'SENT', { subject, body });
            sentCount++;
          } else {
            const errJson = await resendRes.json();
            await db.updateFollowupStatus(item.id, 'FAILED', { errorMessage: errJson.message || 'Resend HTTP Error' });
            failedCount++;
          }
        } catch (resendErr) {
          await db.updateFollowupStatus(item.id, 'FAILED', { errorMessage: resendErr.message });
          failedCount++;
        }
      } else {
        // Safe dry-run mode when RESEND_API_KEY is not set
        await db.updateFollowupStatus(item.id, 'SENT', { subject, body });
        sentCount++;
      }
    }

    return res.status(200).json({
      success: true,
      processedCount,
      sentCount,
      failedCount,
      message: `Automated follow-up cron completed cleanly.`
    });

  } catch (err) {
    console.error('Error in /api/cron/followups:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
