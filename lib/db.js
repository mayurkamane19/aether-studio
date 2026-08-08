/**
 * SERVERLESS POSTGRESQL DATABASE CONNECTOR: lib/db.js
 * Handles connection pooling, parameterized queries, search filtering,
 * lead scoring, notes, activity timeline logging, AI sales intelligence, AI pricing assistance,
 * and professional proposal management for Aether Studio.
 * Uses process.env.DATABASE_URL.
 */

const crypto = require('crypto');

let pool = null;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!pool) {
    try {
      const { Pool } = require('pg');
      pool = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
          ? false
          : { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });

      pool.on('error', (err) => {
        console.error('[DB POOL ERROR]', err.message);
      });
    } catch (e) {
      console.warn('[DB NOTICE] pg package module notice:', e.message);
      return null;
    }
  }

  return pool;
}

async function query(text, params = []) {
  const dbPool = getPool();
  if (!dbPool) {
    return { success: false, rows: [], notice: 'DATABASE_URL not configured or pg module unavailable.' };
  }

  try {
    const res = await dbPool.query(text, params);
    return { success: true, rows: res.rows, rowCount: res.rowCount };
  } catch (err) {
    console.error('[DB QUERY ERROR]', err.message);
    return { success: false, error: err.message, rows: [] };
  }
}

function calculateLeadScore(budget = '', projectType = '') {
  const b = String(budget).toLowerCase();
  const p = String(projectType).toLowerCase();

  let score = 45; // Default COLD base

  if (b.includes('50,000') || b.includes('enterprise') || p.includes('ai') || p.includes('saas')) {
    score = 90; // HOT
  } else if (b.includes('25,000') || b.includes('35,000') || p.includes('dashboard')) {
    score = 75; // WARM
  } else if (b.includes('15,000') || b.includes('19,999') || p.includes('brand')) {
    score = 60; // WARM
  }

  return score;
}

async function saveLead(leadData) {
  const {
    leadId,
    name,
    email,
    company = 'Independent',
    projectType = 'General Inquiry',
    budget = 'Not Specified',
    timeline = 'Flexible',
    preferredContact = 'Email',
    message = '',
    status = 'NEW',
    leadScore,
    source = 'Website'
  } = leadData;

  const scoreToSave = (leadScore !== undefined && leadScore !== null) ? leadScore : calculateLeadScore(budget, projectType);
  const priority = scoreToSave >= 80 ? 'HOT' : (scoreToSave >= 50 ? 'WARM' : 'COLD');

  const sql = `
    INSERT INTO leads (
      lead_id, name, email, company, project_type, budget, timeline,
      preferred_contact, message, status, lead_score, lead_priority, source, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
    ON CONFLICT (lead_id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING id, lead_id, created_at;
  `;

  const res = await query(sql, [
    leadId, name, email, company, projectType, budget, timeline,
    preferredContact, message, status, scoreToSave, priority, source
  ]);

  if (res.success) {
    logLeadActivity(leadId, 'LEAD_CREATED', `Lead ${leadId} submitted by ${name} (${email})`);
  }

  return res;
}

async function getLeadById(leadId) {
  const sql = `
    SELECT id, lead_id AS "leadId", name, email, company, project_type AS "projectType",
           budget AS "budgetRange", timeline, preferred_contact AS "contactMethod",
           message, status, lead_score AS "leadScore", lead_priority AS "leadPriority",
           ai_summary AS "aiSummary", ai_project_category AS "aiProjectCategory",
           ai_complexity AS "aiComplexity", ai_estimated_budget_min AS "aiEstimatedBudgetMin",
           ai_estimated_budget_max AS "aiEstimatedBudgetMax", ai_estimated_timeline AS "aiEstimatedTimeline",
           ai_recommended_action AS "aiRecommendedAction", ai_risk_flags AS "aiRiskFlags",
           ai_missing_information AS "aiMissingInformation", ai_analyzed_at AS "aiAnalyzedAt",
           ai_recommended_price AS "aiRecommendedPrice", ai_price_min AS "aiPriceMin",
           ai_price_max AS "aiPriceMax", ai_pricing_confidence AS "aiPricingConfidence",
           ai_recommended_package AS "aiRecommendedPackage", ai_pricing_status AS "aiPricingStatus",
           source, created_at AS "submissionDate"
    FROM leads
    WHERE lead_id = $1
    LIMIT 1;
  `;
  const res = await query(sql, [leadId]);
  return res.success && res.rows[0] ? res.rows[0] : null;
}

async function getLeadsPaginated({ search = '', statusFilter = 'ALL', page = 1, limit = 20 } = {}) {
  const offset = (Math.max(1, page) - 1) * limit;

  let whereClauses = [];
  let params = [];
  let paramIdx = 1;

  if (search && search.trim()) {
    whereClauses.push(`(
      lead_id ILIKE $${paramIdx} OR
      name ILIKE $${paramIdx} OR
      email ILIKE $${paramIdx} OR
      company ILIKE $${paramIdx} OR
      project_type ILIKE $${paramIdx}
    )`);
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  if (statusFilter && statusFilter !== 'ALL') {
    whereClauses.push(`status = $${paramIdx}`);
    params.push(statusFilter.toUpperCase());
    paramIdx++;
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM leads ${whereStr};`;
  const countRes = await query(countSql, params);
  const total = countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].total, 10) : 0;

  const dataParams = [...params, limit, offset];
  const dataSql = `
    SELECT id, lead_id AS "leadId", name, email, company, project_type AS "projectType",
           budget AS "budgetRange", timeline, preferred_contact AS "contactMethod",
           message, status, lead_score AS "leadScore", lead_priority AS "leadPriority",
           ai_summary AS "aiSummary", ai_project_category AS "aiProjectCategory",
           ai_complexity AS "aiComplexity", ai_estimated_budget_min AS "aiEstimatedBudgetMin",
           ai_estimated_budget_max AS "aiEstimatedBudgetMax", ai_estimated_timeline AS "aiEstimatedTimeline",
           ai_recommended_action AS "aiRecommendedAction", ai_risk_flags AS "aiRiskFlags",
           ai_missing_information AS "aiMissingInformation", ai_analyzed_at AS "aiAnalyzedAt",
           ai_recommended_price AS "aiRecommendedPrice", ai_price_min AS "aiPriceMin",
           ai_price_max AS "aiPriceMax", ai_pricing_confidence AS "aiPricingConfidence",
           ai_recommended_package AS "aiRecommendedPackage", ai_pricing_status AS "aiPricingStatus",
           source, created_at AS "submissionDate"
    FROM leads
    ${whereStr}
    ORDER BY created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
  `;

  const dataRes = await query(dataSql, dataParams);

  return {
    success: dataRes.success,
    inquiries: dataRes.rows,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1
  };
}

async function updateLeadStatus(leadId, newStatus) {
  const allowedStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST'];
  const sanitizedStatus = String(newStatus).toUpperCase().trim();

  if (!allowedStatuses.includes(sanitizedStatus)) {
    return { success: false, error: 'Invalid status value.' };
  }

  const sql = `
    UPDATE leads
    SET status = $1, updated_at = NOW()
    WHERE lead_id = $2
    RETURNING id, lead_id, status;
  `;
  const res = await query(sql, [sanitizedStatus, leadId]);

  if (res.success) {
    logLeadActivity(leadId, 'STATUS_CHANGED', `Lead status updated to ${sanitizedStatus}`);
  }

  return res;
}

async function updateLeadAIIntelligence(leadId, aiData) {
  const {
    score,
    priority,
    projectCategory,
    complexity,
    estimatedBudgetMin,
    estimatedBudgetMax,
    estimatedTimeline,
    summary,
    recommendedAction,
    riskFlags,
    missingInformation
  } = aiData;

  const sql = `
    UPDATE leads
    SET lead_score = $1,
        lead_priority = $2,
        ai_project_category = $3,
        ai_complexity = $4,
        ai_estimated_budget_min = $5,
        ai_estimated_budget_max = $6,
        ai_estimated_timeline = $7,
        ai_summary = $8,
        ai_recommended_action = $9,
        ai_risk_flags = $10::jsonb,
        ai_missing_information = $11::jsonb,
        ai_analyzed_at = NOW(),
        updated_at = NOW()
    WHERE lead_id = $12
    RETURNING id, lead_id, lead_score, lead_priority;
  `;

  const res = await query(sql, [
    score,
    priority,
    projectCategory,
    complexity,
    estimatedBudgetMin,
    estimatedBudgetMax,
    estimatedTimeline,
    summary,
    recommendedAction,
    JSON.stringify(riskFlags || []),
    JSON.stringify(missingInformation || []),
    leadId
  ]);

  if (res.success) {
    logLeadActivity(leadId, 'AI_ANALYSIS_COMPLETED', `AI lead analysis completed with score ${score} / ${priority} priority.`);
    addAIAnalysisHistory(leadId, aiData);
  }

  return res;
}

async function addAIAnalysisHistory(leadId, aiData) {
  const {
    score,
    priority,
    projectCategory,
    complexity,
    estimatedBudgetMin,
    estimatedBudgetMax,
    estimatedTimeline,
    summary,
    recommendedAction,
    riskFlags,
    missingInformation
  } = aiData;

  const sql = `
    INSERT INTO lead_ai_analysis (
      lead_id, score, priority, project_category, complexity,
      estimated_budget_min, estimated_budget_max, estimated_timeline,
      summary, recommended_action, risk_flags, missing_information, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, NOW())
    RETURNING id;
  `;

  return await query(sql, [
    leadId, score, priority, projectCategory, complexity,
    estimatedBudgetMin, estimatedBudgetMax, estimatedTimeline,
    summary, recommendedAction, JSON.stringify(riskFlags || []), JSON.stringify(missingInformation || [])
  ]);
}

async function getAIAnalysisHistory(leadId) {
  const sql = `
    SELECT id, lead_id AS "leadId", score, priority, project_category AS "projectCategory",
           complexity, estimated_budget_min AS "estimatedBudgetMin",
           estimated_budget_max AS "estimatedBudgetMax", estimated_timeline AS "estimatedTimeline",
           summary, recommended_action AS "recommendedAction", risk_flags AS "riskFlags",
           missing_information AS "missingInformation", created_at AS "createdAt"
    FROM lead_ai_analysis
    WHERE lead_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [leadId]);
}

async function saveAIPricingAnalysis(leadId, pricingData) {
  const {
    currency = 'INR',
    estimatedMin,
    estimatedMax,
    recommendedPrice,
    complexity = 'MEDIUM',
    estimatedTimeline = '2-3 Weeks',
    recommendedPackage = 'CUSTOM',
    reasoning = '',
    milestones = [],
    assumptions = [],
    risks = [],
    confidence = 80
  } = pricingData;

  await query(`UPDATE lead_pricing_analysis SET status = 'SUPERSEDED' WHERE lead_id = $1 AND status = 'DRAFT'`, [leadId]);

  const insertSql = `
    INSERT INTO lead_pricing_analysis (
      lead_id, currency, estimated_min, estimated_max, recommended_price,
      complexity, estimated_timeline, recommended_package, reasoning,
      milestones, assumptions, risks, confidence, status, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13, 'DRAFT', NOW())
    RETURNING id, created_at;
  `;

  const insertRes = await query(insertSql, [
    leadId, currency, estimatedMin, estimatedMax, recommendedPrice,
    complexity, estimatedTimeline, recommendedPackage, reasoning,
    JSON.stringify(milestones || []), JSON.stringify(assumptions || []), JSON.stringify(risks || []),
    confidence
  ]);

  await query(`
    UPDATE leads
    SET ai_recommended_price = $1,
        ai_price_min = $2,
        ai_price_max = $3,
        ai_pricing_confidence = $4,
        ai_recommended_package = $5,
        ai_pricing_status = 'DRAFT',
        updated_at = NOW()
    WHERE lead_id = $6
  `, [recommendedPrice, estimatedMin, estimatedMax, confidence, recommendedPackage, leadId]);

  logLeadActivity(leadId, 'PRICING_GENERATED', `AI project pricing generated: ₹${recommendedPrice.toLocaleString('en-IN')} (Range: ₹${estimatedMin.toLocaleString('en-IN')} – ₹${estimatedMax.toLocaleString('en-IN')}, Confidence: ${confidence}%)`);

  return insertRes;
}

async function approveAIPricing(leadId, pricingId) {
  const updatePricingSql = pricingId
    ? `UPDATE lead_pricing_analysis SET status = 'APPROVED' WHERE id = $1 AND lead_id = $2 RETURNING id;`
    : `UPDATE lead_pricing_analysis SET status = 'APPROVED' WHERE lead_id = $1 AND status = 'DRAFT' RETURNING id;`;

  const pricingRes = await query(updatePricingSql, pricingId ? [pricingId, leadId] : [leadId]);
  await query(`UPDATE leads SET ai_pricing_status = 'APPROVED', updated_at = NOW() WHERE lead_id = $1`, [leadId]);
  logLeadActivity(leadId, 'PRICING_APPROVED', `Admin approved AI pricing recommendation for lead ${leadId}.`);
  return pricingRes;
}

async function getAIPricingHistory(leadId) {
  const sql = `
    SELECT id, lead_id AS "leadId", currency, estimated_min AS "estimatedMin",
           estimated_max AS "estimatedMax", recommended_price AS "recommendedPrice",
           complexity, estimated_timeline AS "estimatedTimeline",
           recommended_package AS "recommendedPackage", reasoning,
           milestones, assumptions, risks, confidence, status, created_at AS "createdAt"
    FROM lead_pricing_analysis
    WHERE lead_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [leadId]);
}

/* ==========================================================================
   PROPOSAL MANAGEMENT METHODS (PHASE 5)
   ========================================================================== */

async function createProposal(proposalData) {
  const {
    leadId,
    clientName,
    clientEmail,
    company = 'Independent',
    projectName = 'Digital Engineering Project',
    projectType = 'Web Engineering',
    summary = '',
    scope = '',
    deliverables = [],
    technologyStack = [],
    timeline = '2 to 3 Weeks',
    milestones = [],
    subtotal = 0,
    discount = 0,
    tax = 0,
    total = 0,
    currency = 'INR',
    paymentSchedule = [],
    terms = '',
    validDays = 14
  } = proposalData;

  // Determine latest version number
  const countSql = `SELECT COUNT(*) AS count FROM proposals WHERE lead_id = $1;`;
  const countRes = await query(countSql, [leadId]);
  const version = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;

  const numCode = String(leadId).replace(/[^0-9]/g, '') || Math.floor(100000 + Math.random() * 900000);
  const proposalId = `PROP-AS-2026-${numCode}-V${version}`;
  const accessToken = crypto.randomBytes(24).toString('hex');

  const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();

  const insertSql = `
    INSERT INTO proposals (
      proposal_id, lead_id, version, status, client_name, client_email, company,
      project_name, project_type, summary, scope, deliverables, technology_stack,
      timeline, milestones, subtotal, discount, tax, total, currency,
      payment_schedule, valid_until, terms, access_token, created_at, updated_at
    )
    VALUES ($1, $2, $3, 'DRAFT', $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, $14::jsonb, $15, $16, $17, $18, $19, $20::jsonb, $21, $22, $23, NOW(), NOW())
    RETURNING id, proposal_id, access_token, created_at;
  `;

  const insertRes = await query(insertSql, [
    proposalId, leadId, version, clientName, clientEmail, company,
    projectName, projectType, summary, scope,
    JSON.stringify(deliverables), JSON.stringify(technologyStack),
    timeline, JSON.stringify(milestones),
    subtotal, discount, tax, total, currency,
    JSON.stringify(paymentSchedule), validUntil, terms, accessToken
  ]);

  if (insertRes.success) {
    const actType = version > 1 ? 'PROPOSAL_VERSION_CREATED' : 'PROPOSAL_CREATED';
    logLeadActivity(leadId, actType, `Proposal ${proposalId} (V${version}) created for ${clientName} — Total: ₹${total.toLocaleString('en-IN')}`);
  }

  return {
    success: insertRes.success,
    proposalId,
    version,
    accessToken,
    record: insertRes.rows[0]
  };
}

async function getProposalsByLead(leadId) {
  const sql = `
    SELECT id, proposal_id AS "proposalId", lead_id AS "leadId", version, status,
           client_name AS "clientName", client_email AS "clientEmail", company,
           project_name AS "projectName", project_type AS "projectType", summary, scope,
           deliverables, technology_stack AS "technologyStack", timeline, milestones,
           subtotal, discount, tax, total, currency, payment_schedule AS "paymentSchedule",
           valid_until AS "validUntil", terms, rejection_reason AS "rejectionReason",
           access_token AS "accessToken", created_at AS "createdAt", sent_at AS "sentAt",
           viewed_at AS "viewedAt", accepted_at AS "acceptedAt", rejected_at AS "rejectedAt"
    FROM proposals
    WHERE lead_id = $1
    ORDER BY version DESC;
  `;
  return await query(sql, [leadId]);
}

async function getProposalByPublicToken(proposalId, accessToken) {
  const sql = `
    SELECT id, proposal_id AS "proposalId", lead_id AS "leadId", version, status,
           client_name AS "clientName", client_email AS "clientEmail", company,
           project_name AS "projectName", project_type AS "projectType", summary, scope,
           deliverables, technology_stack AS "technologyStack", timeline, milestones,
           subtotal, discount, tax, total, currency, payment_schedule AS "paymentSchedule",
           valid_until AS "validUntil", terms, created_at AS "createdAt", sent_at AS "sentAt",
           viewed_at AS "viewedAt", accepted_at AS "acceptedAt", rejected_at AS "rejectedAt"
    FROM proposals
    WHERE proposal_id = $1 AND access_token = $2
    LIMIT 1;
  `;
  const res = await query(sql, [proposalId, accessToken]);
  return res.success && res.rows[0] ? res.rows[0] : null;
}

async function updateProposalStatus(proposalId, newStatus, extraData = {}) {
  const allowed = ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SUPERSEDED'];
  const sanitizedStatus = String(newStatus).toUpperCase().trim();

  if (!allowed.includes(sanitizedStatus)) {
    return { success: false, error: 'Invalid proposal status value.' };
  }

  let timeCol = '';
  if (sanitizedStatus === 'SENT') timeCol = ', sent_at = NOW()';
  if (sanitizedStatus === 'VIEWED') timeCol = ', viewed_at = COALESCE(viewed_at, NOW())';
  if (sanitizedStatus === 'ACCEPTED') timeCol = ', accepted_at = NOW()';
  if (sanitizedStatus === 'REJECTED') timeCol = ', rejected_at = NOW()';

  let rejectionStr = extraData.rejectionReason ? String(extraData.rejectionReason).replace(/[<>]/g, '').trim() : null;

  const sql = `
    UPDATE proposals
    SET status = $1, rejection_reason = COALESCE($2, rejection_reason), updated_at = NOW() ${timeCol}
    WHERE proposal_id = $3
    RETURNING id, proposal_id, lead_id, status;
  `;

  const res = await query(sql, [sanitizedStatus, rejectionStr, proposalId]);

  if (res.success && res.rows[0]) {
    const p = res.rows[0];
    const actMap = {
      'SENT': 'PROPOSAL_SENT',
      'VIEWED': 'PROPOSAL_VIEWED',
      'ACCEPTED': 'PROPOSAL_ACCEPTED',
      'REJECTED': 'PROPOSAL_REJECTED',
      'EXPIRED': 'PROPOSAL_EXPIRED'
    };
    if (actMap[sanitizedStatus]) {
      logLeadActivity(p.lead_id, actMap[sanitizedStatus], `Proposal ${proposalId} status updated to ${sanitizedStatus}${rejectionStr ? ': ' + rejectionStr : ''}`);
    }

    if (sanitizedStatus === 'ACCEPTED') {
      updateLeadStatus(p.lead_id, 'WON');
    } else if (sanitizedStatus === 'SENT') {
      updateLeadStatus(p.lead_id, 'PROPOSAL_SENT');
    }
  }

  return res;
}

async function addLeadNote(leadId, note) {
  const sql = `
    INSERT INTO lead_notes (lead_id, note, created_at, updated_at)
    VALUES ($1, $2, NOW(), NOW())
    RETURNING id, lead_id, note, created_at;
  `;
  const res = await query(sql, [leadId, String(note).replace(/[<>]/g, '').trim()]);

  if (res.success) {
    logLeadActivity(leadId, 'NOTE_ADDED', `Admin note added: "${note.substring(0, 50)}..."`);
  }

  return res;
}

async function getLeadNotes(leadId) {
  const sql = `
    SELECT id, lead_id AS "leadId", note, created_at AS "createdAt"
    FROM lead_notes
    WHERE lead_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [leadId]);
}

async function logLeadActivity(leadId, activityType, description) {
  const sql = `
    INSERT INTO lead_activity (lead_id, activity_type, description, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id;
  `;
  return await query(sql, [leadId, activityType, description]);
}

async function getLeadActivity(leadId) {
  const sql = `
    SELECT id, lead_id AS "leadId", activity_type AS "activityType", description, created_at AS "createdAt"
    FROM lead_activity
    WHERE lead_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [leadId]);
}

module.exports = {
  query,
  saveLead,
  getLeadById,
  getLeadsPaginated,
  updateLeadStatus,
  updateLeadAIIntelligence,
  addAIAnalysisHistory,
  getAIAnalysisHistory,
  saveAIPricingAnalysis,
  approveAIPricing,
  getAIPricingHistory,
  createProposal,
  getProposalsByLead,
  getProposalByPublicToken,
  updateProposalStatus,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
  getLeadActivity
};
