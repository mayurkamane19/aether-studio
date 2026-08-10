/**
 * AETHER STUDIO — AI AGENCY OPERATING SYSTEM CORE ENGINE
 * Server-side AI recommendation, executive summary, daily briefing, scope creep detection,
 * and human-in-the-loop action approval manager.
 * Recommendation-Only Execution Guarantee: AI NEVER automatically modifies financial records,
 * sends emails, sends WhatsApp messages, or alters PostgreSQL status without explicit admin approval.
 */

const db = require('./db');

/**
 * Generates an Executive AI Summary using real PostgreSQL data.
 */
async function generateExecutiveSummary() {
  const analyticsRes = await db.getCRMAnalytics({ range: 'ALL' });
  const analytics = analyticsRes || {};

  const totalLeads = analytics.totalLeads || 0;
  const wonCount = analytics.wonCount || 0;
  const wonRevenue = analytics.wonRevenue || 0;
  const openPipeline = analytics.openPipeline || 0;
  const weightedPipeline = analytics.weightedPipeline || 0;

  const pendingActionsRes = await db.query(`SELECT COUNT(*) AS count FROM ai_agency_actions WHERE status = 'SUGGESTED';`);
  const pendingActions = pendingActionsRes.success && pendingActionsRes.rows[0] ? parseInt(pendingActionsRes.rows[0].count, 10) : 0;

  return {
    overview: {
      totalLeads,
      wonCount,
      wonRevenue,
      openPipeline,
      weightedPipeline,
      pendingActions
    },
    insights: [
      {
        category: 'SALES',
        title: 'Active Sales Pipeline Evaluation',
        text: `Open weighted pipeline stands at ₹${weightedPipeline.toLocaleString('en-IN')} across active opportunities.`
      },
      {
        category: 'FINANCIAL',
        title: 'Revenue Realization',
        text: `Total verified won revenue is ₹${wonRevenue.toLocaleString('en-IN')} across ${wonCount} closed deals.`
      }
    ],
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generates Daily Priority Briefing for Agency Admins.
 */
async function generateDailyBriefing() {
  const urgentLeadsRes = await db.query(`
    SELECT lead_id AS "leadId", name, company, project_type AS "projectType", lead_score AS "leadScore", submission_date AS "submissionDate"
    FROM leads
    WHERE status IN ('NEW', 'CONTACTED', 'QUALIFIED')
    ORDER BY lead_score DESC, submission_date DESC
    LIMIT 5;
  `);

  const pendingActionsRes = await db.query(`
    SELECT id, lead_id AS "leadId", title, description, priority, confidence, created_at AS "createdAt"
    FROM ai_agency_actions
    WHERE status = 'SUGGESTED'
    ORDER BY created_at DESC
    LIMIT 10;
  `);

  return {
    briefingDate: new Date().toISOString().split('T')[0],
    priorities: urgentLeadsRes.rows || [],
    suggestedActions: pendingActionsRes.rows || []
  };
}

/**
 * Detects potential Scope Creep for a given lead.
 */
async function detectScopeCreep(leadId) {
  const propRes = await db.getProposalsByLead(leadId);
  const proposal = (propRes.rows || [])[0];

  const msgRes = await db.getClientMessages(leadId);
  const messages = msgRes.rows || [];

  if (!proposal || messages.length === 0) {
    return { scopeCreepDetected: false, reason: 'Insufficient proposal or message data for scope comparison.' };
  }

  const clientText = messages.filter(m => m.senderType === 'CLIENT').map(m => m.message).join(' ');
  const scopeKeywords = ['extra page', 'additional feature', 'mobile app', 'custom integration', 'new design', 'change scope'];
  
  const matches = scopeKeywords.filter(kw => clientText.toLowerCase().includes(kw));

  if (matches.length > 0) {
    return {
      scopeCreepDetected: true,
      confidence: 'MEDIUM',
      detectedKeywords: matches,
      reason: `Client requested terms matching keywords: ${matches.join(', ')}. Compare against original Statement of Work in proposal ${proposal.proposalId}.`
    };
  }

  return { scopeCreepDetected: false, reason: 'Client communications remain strictly within agreed scope parameters.' };
}

/**
 * Logs a new AI suggested action for human admin approval.
 */
async function logAiAction({ leadId, actionType, category = 'SALES', title, description, payload = {}, priority = 'NORMAL', confidence = 'HIGH' }) {
  const sql = `
    INSERT INTO ai_agency_actions (lead_id, action_type, category, title, description, payload, priority, confidence, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SUGGESTED', NOW(), NOW())
    RETURNING id, title, created_at;
  `;
  return await db.query(sql, [leadId, actionType, category, title, description, JSON.stringify(payload), priority, confidence]);
}

/**
 * Admin approves or rejects an AI suggested action.
 */
async function setAiActionStatus(actionId, status, adminId = 'Admin') {
  const validStatuses = ['APPROVED', 'REJECTED', 'EXECUTED'];
  if (!validStatuses.includes(status.toUpperCase())) {
    return { success: false, error: 'Invalid action status.' };
  }

  const sql = `
    UPDATE ai_agency_actions
    SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW()
    WHERE id = $3
    RETURNING id, lead_id, action_type, status;
  `;
  const res = await db.query(sql, [status.toUpperCase(), adminId, actionId]);

  if (res.success && res.rows[0]) {
    db.logLeadActivity(res.rows[0].lead_id, 'AI_ACTION_UPDATED', `AI Action ${actionId} marked ${status.toUpperCase()} by ${adminId}`);
  }

  return res;
}

module.exports = {
  generateExecutiveSummary,
  generateDailyBriefing,
  detectScopeCreep,
  logAiAction,
  setAiActionStatus
};
