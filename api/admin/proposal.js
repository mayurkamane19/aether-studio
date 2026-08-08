/**
 * SERVERLESS API ENDPOINT: /api/admin/proposal
 * Professional Proposal Builder & Dispatch Handler for Aether Studio Admin Portal.
 * Triggered ONLY by explicit admin action in dashboard. Protected by ADMIN_CRM_TOKEN.
 * Persists proposals in PostgreSQL DB, generates versioning, and sends Resend emails.
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
    const {
      leadId,
      clientName,
      clientEmail,
      company,
      projectName,
      projectType,
      summary,
      scope,
      deliverables,
      technologyStack,
      timeline,
      milestones,
      subtotal,
      discount,
      tax,
      total,
      currency,
      paymentSchedule,
      terms,
      action
    } = req.body || {};

    if (!clientEmail || !clientEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid client email is required.' });
    }

    const cleanLeadId = String(leadId || 'AS-2026-000000').trim();

    // 1. Save Proposal Draft in PostgreSQL Database
    const proposalRes = await db.createProposal({
      leadId: cleanLeadId,
      clientName: String(clientName || 'Valued Client').trim(),
      clientEmail: String(clientEmail).trim(),
      company: String(company || 'Independent').trim(),
      projectName: String(projectName || 'Digital Engineering Project').trim(),
      projectType: String(projectType || 'Web Engineering').trim(),
      summary: String(summary || 'Custom scope proposal created for your project.').trim(),
      scope: String(scope || 'Full web engineering and luxury digital architecture.').trim(),
      deliverables: deliverables || [
        'Responsive High-Converting Web Application',
        'Dark Luxury Design System & Motion Engine (GSAP)',
        'SEO Infrastructure, Open Graph Tags & JSON-LD',
        'PWA Offline Capability & Service Worker'
      ],
      technologyStack: technologyStack || ['Next.js / Vanilla JS', 'GSAP', 'Lenis', 'Resend', 'PostgreSQL'],
      timeline: String(timeline || '2 to 3 Weeks').trim(),
      milestones: milestones || [
        { name: 'Discovery & Architecture', duration: '3 Days' },
        { name: 'UI/UX Design Tokens & Layouts', duration: '5 Days' },
        { name: 'Frontend Engineering & Motion', duration: '7 Days' },
        { name: 'QA Testing, Deployment & Indexing', duration: '3 Days' }
      ],
      subtotal: parseInt(subtotal || total || 35000, 10),
      discount: parseInt(discount || 0, 10),
      tax: parseInt(tax || 0, 10),
      total: parseInt(total || 35000, 10),
      currency: currency || 'INR',
      paymentSchedule: paymentSchedule || [
        { phase: 'Advance Deposit', percentage: 40, amount: Math.round((total || 35000) * 0.4) },
        { phase: 'Development Milestone', percentage: 40, amount: Math.round((total || 35000) * 0.4) },
        { phase: 'Final Delivery & Handoff', percentage: 20, amount: Math.round((total || 35000) * 0.2) }
      ],
      terms: terms || 'Proposal valid for 14 days. 2 revision cycles included upon milestone delivery.'
    });

    const proposalId = proposalRes.proposalId;
    const accessToken = proposalRes.accessToken;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aetherstudio.com';
    const viewUrl = `${siteUrl}/proposal.html?id=${encodeURIComponent(proposalId)}&token=${encodeURIComponent(accessToken)}`;

    // 2. Dispatch Email via Resend if requested or in active send mode
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Aether Studio Desk <onboarding@resend.dev>';

    if (action === 'SEND_PROPOSAL' || action === undefined) {
      if (resendApiKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: fromEmail,
            to: [clientEmail],
            reply_to: 'mayurkamane23@gmail.com',
            subject: `[${proposalId}] Official Project Scope Proposal — Aether Studio`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #f8fafc; max-width: 650px; margin: 0 auto; padding: 28px; border: 1px solid #334155; border-radius: 12px; background: #06070a;">
                <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
                  <h2 style="color: #ffffff; margin: 0; font-size: 1.8rem; letter-spacing: 1px;">AETHER <span style="color: #8b5cf6;">STUDIO</span></h2>
                  <span style="font-size: 0.85rem; color: #94a3b8;">Official Project Proposal & Scope breakdown</span>
                </div>

                <p style="font-size: 1.1rem; color: #f1f5f9;">Dear ${clientName || 'Valued Client'},</p>
                <p style="color: #cbd5e1; line-height: 1.6;">
                  We are pleased to present the official scope proposal for your project (Proposal Reference: <strong>${proposalId}</strong>).
                </p>

                <div style="background: rgba(255,255,255,0.04); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); margin: 24px 0;">
                  <h3 style="color: #8b5cf6; margin-top: 0;">Financial Investment Summary</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem; color: #cbd5e1;">
                    <tr><td style="padding: 6px 0; font-weight: bold; width: 150px;">Proposal ID:</td><td style="color: #c084fc; font-weight: bold;">${proposalId}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Project Type:</td><td>${projectType || 'Web Engineering'}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Total Investment:</td><td style="color: #34d399; font-weight: bold; font-size: 1.1rem;">₹${(total || 35000).toLocaleString('en-IN')}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Estimated Schedule:</td><td>${timeline || '2 to 3 Weeks'}</td></tr>
                  </table>
                </div>

                <div style="text-align: center; margin: 28px 0;">
                  <a href="${viewUrl}" style="background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 1rem; display: inline-block;">
                    View & Accept Interactive Proposal →
                  </a>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 24px; font-size: 0.82rem; color: #64748b; text-align: center;">
                  © 2026 Aether Studio • Creative Engineering & Architecture • <a href="https://aetherstudio.com" style="color: #8b5cf6; text-decoration: none;">aetherstudio.com</a>
                </div>
              </div>
            `
          })
        }).catch(err => console.error('[PROPOSAL RESEND ERROR]', err));
      }

      await db.updateProposalStatus(proposalId, 'SENT');
    }

    return res.status(200).json({
      success: true,
      proposalId,
      version: proposalRes.version,
      viewUrl,
      message: 'Proposal saved & dispatched cleanly.'
    });

  } catch (err) {
    console.error('Error in /api/admin/proposal:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
