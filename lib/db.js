/**
 * SERVERLESS POSTGRESQL DATABASE CONNECTOR: lib/db.js
 * Handles connection pooling, parameterized queries, search filtering,
 * lead scoring, notes, activity timeline logging, AI sales intelligence, AI pricing assistance,
 * professional proposal management, automated lead follow-up sequence management,
 * and advanced CRM analytics calculations for Aether Studio.
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
    scheduleFollowupSequence(leadId);
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
           followup_enabled AS "followupEnabled",
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
           followup_enabled AS "followupEnabled",
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

    if (['WON', 'LOST'].includes(sanitizedStatus)) {
      await query(`UPDATE lead_followups SET status = 'CANCELLED' WHERE lead_id = $1 AND status = 'PENDING'`, [leadId]);
      logLeadActivity(leadId, 'FOLLOWUP_CANCELLED', `Follow-up sequence cancelled due to lead status ${sanitizedStatus}.`);
    }
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
      await query(`UPDATE lead_followups SET status = 'CANCELLED' WHERE lead_id = $1 AND status = 'PENDING'`, [p.lead_id]);
      logLeadActivity(p.lead_id, 'FOLLOWUP_CANCELLED', 'Follow-up sequence stopped because client accepted proposal.');
    } else if (sanitizedStatus === 'SENT') {
      updateLeadStatus(p.lead_id, 'PROPOSAL_SENT');
    }
  }

  return res;
}

/* ==========================================================================
   AUTOMATED LEAD FOLLOW-UP METHODS (PHASE 6)
   ========================================================================== */

async function scheduleFollowupSequence(leadId, baseDate = new Date()) {
  const d1 = new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const d2 = new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const d3 = new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();

  const seqs = [
    { type: 'FOLLOWUP_1', num: 1, date: d1 },
    { type: 'FOLLOWUP_2', num: 2, date: d2 },
    { type: 'FOLLOWUP_3', num: 3, date: d3 }
  ];

  for (const s of seqs) {
    const sql = `
      INSERT INTO lead_followups (lead_id, followup_type, sequence_number, scheduled_at, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'PENDING', NOW(), NOW())
      ON CONFLICT (lead_id, sequence_number) DO NOTHING;
    `;
    await query(sql, [leadId, s.type, s.num, s.date]);
  }

  logLeadActivity(leadId, 'FOLLOWUP_SCHEDULED', `Automated follow-up sequence scheduled (3 steps: +2d, +5d, +10d).`);
}

async function getFollowupsByLead(leadId) {
  const sql = `
    SELECT id, lead_id AS "leadId", followup_type AS "followupType", sequence_number AS "sequenceNumber",
           scheduled_at AS "scheduledAt", sent_at AS "sentAt", status,
           email_subject AS "emailSubject", email_body AS "emailBody",
           attempt_count AS "attemptCount", error_message AS "errorMessage", created_at AS "createdAt"
    FROM lead_followups
    WHERE lead_id = $1
    ORDER BY sequence_number ASC;
  `;
  return await query(sql, [leadId]);
}

async function getDueFollowups() {
  const sql = `
    SELECT f.id, f.lead_id AS "leadId", f.followup_type AS "followupType", f.sequence_number AS "sequenceNumber",
           f.scheduled_at AS "scheduledAt", f.status, f.attempt_count AS "attemptCount",
           l.name, l.email, l.company, l.project_type AS "projectType", l.status AS "leadStatus", l.followup_enabled AS "followupEnabled"
    FROM lead_followups f
    JOIN leads l ON f.lead_id = l.lead_id
    WHERE f.status = 'PENDING'
      AND f.scheduled_at <= NOW()
      AND f.attempt_count < 3
      AND (l.followup_enabled IS NULL OR l.followup_enabled = true)
      AND l.status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION')
    ORDER BY f.scheduled_at ASC;
  `;
  return await query(sql, []);
}

async function checkLeadEligibilityForFollowup(leadId) {
  const lead = await getLeadById(leadId);
  if (!lead) return { eligible: false, reason: 'Lead record not found' };

  if (lead.followupEnabled === false) return { eligible: false, reason: 'Follow-ups paused by admin' };
  if (['WON', 'LOST'].includes(lead.status)) return { eligible: false, reason: `Lead status is ${lead.status}` };

  const propsRes = await getProposalsByLead(leadId);
  const props = propsRes.rows || [];
  const acceptedProp = props.find(p => p.status === 'ACCEPTED');
  if (acceptedProp) return { eligible: false, reason: 'Client accepted proposal' };

  const rejectedProp = props.find(p => p.status === 'REJECTED');
  if (rejectedProp) return { eligible: false, reason: 'Client declined proposal' };

  return { eligible: true, lead };
}

async function updateFollowupStatus(followupId, status, extra = {}) {
  const allowed = ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED', 'SKIPPED'];
  const sanitizedStatus = String(status).toUpperCase().trim();

  if (!allowed.includes(sanitizedStatus)) return { success: false, error: 'Invalid status' };

  let timeCol = sanitizedStatus === 'SENT' ? ', sent_at = NOW()' : '';

  const sql = `
    UPDATE lead_followups
    SET status = $1,
        attempt_count = attempt_count + 1,
        email_subject = COALESCE($2, email_subject),
        email_body = COALESCE($3, email_body),
        error_message = COALESCE($4, error_message),
        updated_at = NOW() ${timeCol}
    WHERE id = $5
    RETURNING id, lead_id, followup_type, status;
  `;

  const res = await query(sql, [sanitizedStatus, extra.subject || null, extra.body || null, extra.errorMessage || null, followupId]);

  if (res.success && res.rows[0]) {
    const f = res.rows[0];
    const actMap = {
      'SENT': 'FOLLOWUP_SENT',
      'FAILED': 'FOLLOWUP_FAILED',
      'CANCELLED': 'FOLLOWUP_CANCELLED',
      'SKIPPED': 'FOLLOWUP_SKIPPED'
    };
    if (actMap[sanitizedStatus]) {
      logLeadActivity(f.lead_id, actMap[sanitizedStatus], `Automated ${f.followup_type} status updated to ${sanitizedStatus}.`);
    }
  }

  return res;
}

async function toggleLeadFollowupEnabled(leadId, enabled) {
  const sql = `UPDATE leads SET followup_enabled = $1, updated_at = NOW() WHERE lead_id = $2 RETURNING lead_id, followup_enabled;`;
  const res = await query(sql, [enabled, leadId]);
  if (res.success) {
    logLeadActivity(leadId, enabled ? 'FOLLOWUP_RESUMED' : 'FOLLOWUP_PAUSED', enabled ? 'Automated follow-ups resumed by admin.' : 'Automated follow-ups paused by admin.');
  }
  return res;
}

/* ==========================================================================
   ADVANCED CRM ANALYTICS & SALES INTELLIGENCE (PHASE 7)
   ========================================================================== */

async function getCRMAnalytics({ range = 'ALL', statusFilter = 'ALL', projectTypeFilter = 'ALL' } = {}) {
  // Build date filter clause
  let dateClause = '';
  if (range === '7D') dateClause = "AND created_at >= NOW() - INTERVAL '7 days'";
  else if (range === '30D') dateClause = "AND created_at >= NOW() - INTERVAL '30 days'";
  else if (range === '90D') dateClause = "AND created_at >= NOW() - INTERVAL '90 days'";
  else if (range === '12M') dateClause = "AND created_at >= NOW() - INTERVAL '12 months'";

  let statusClause = statusFilter !== 'ALL' ? `AND status = '${String(statusFilter).replace(/'/g, "''")}'` : '';
  let typeClause = projectTypeFilter !== 'ALL' ? `AND project_type ILIKE '%${String(projectTypeFilter).replace(/'/g, "''")}%'` : '';

  const whereStr = `WHERE 1=1 ${dateClause} ${statusClause} ${typeClause}`;

  // 1. Executive KPI Counts
  const kpiSql = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'NEW') AS new_count,
      COUNT(*) FILTER (WHERE status = 'CONTACTED') AS contacted_count,
      COUNT(*) FILTER (WHERE status = 'QUALIFIED') AS qualified_count,
      COUNT(*) FILTER (WHERE status = 'PROPOSAL_SENT') AS proposal_sent_count,
      COUNT(*) FILTER (WHERE status = 'NEGOTIATION') AS negotiation_count,
      COUNT(*) FILTER (WHERE status = 'WON') AS won_count,
      COUNT(*) FILTER (WHERE status = 'LOST') AS lost_count
    FROM leads ${whereStr};
  `;
  const kpiRes = await query(kpiSql);
  const k = kpiRes.rows[0] || {};
  const total = parseInt(k.total || 0, 10);
  const newCount = parseInt(k.new_count || 0, 10);
  const contactedCount = parseInt(k.contacted_count || 0, 10);
  const qualifiedCount = parseInt(k.qualified_count || 0, 10);
  const proposalSentCount = parseInt(k.proposal_sent_count || 0, 10);
  const negotiationCount = parseInt(k.negotiation_count || 0, 10);
  const wonCount = parseInt(k.won_count || 0, 10);
  const lostCount = parseInt(k.lost_count || 0, 10);

  // 2. Conversion Funnel Percentages
  const calcPct = (num, den) => den > 0 ? `${((num / den) * 100).toFixed(1)}%` : 'N/A';

  const conversion = {
    newToContacted: calcPct(contactedCount + qualifiedCount + proposalSentCount + negotiationCount + wonCount, total),
    contactedToQualified: calcPct(qualifiedCount + proposalSentCount + negotiationCount + wonCount, contactedCount + qualifiedCount + proposalSentCount + negotiationCount + wonCount),
    qualifiedToProposal: calcPct(proposalSentCount + negotiationCount + wonCount, qualifiedCount + proposalSentCount + negotiationCount + wonCount),
    proposalToNegotiation: calcPct(negotiationCount + wonCount, proposalSentCount + negotiationCount + wonCount),
    negotiationToWon: calcPct(wonCount, negotiationCount + wonCount),
    overallWon: calcPct(wonCount, total)
  };

  // 3. Pipeline Financial Aggregates
  const pipelineSql = `
    SELECT
      COALESCE(SUM(p.total) FILTER (WHERE p.status IN ('SENT', 'VIEWED', 'NEGOTIATION')), 0) AS potential_pipeline,
      COALESCE(SUM(p.total) FILTER (WHERE p.status = 'APPROVED' OR l.ai_pricing_status = 'APPROVED'), 0) AS approved_pipeline,
      COALESCE(SUM(p.total) FILTER (WHERE l.status = 'WON'), 0) AS won_revenue
    FROM leads l
    LEFT JOIN proposals p ON l.lead_id = p.lead_id
    ${whereStr};
  `;
  const pipeRes = await query(pipelineSql);
  const pData = pipeRes.rows[0] || {};
  const pipeline = {
    potentialPipeline: parseInt(pData.potential_pipeline || 0, 10),
    approvedProposalValue: parseInt(pData.approved_pipeline || 0, 10),
    wonRevenue: parseInt(pData.won_revenue || 0, 10)
  };

  // 4. Lead Sources Breakdown
  const sourceSql = `
    SELECT COALESCE(source, 'Website') AS source_name, COUNT(*) AS count
    FROM leads ${whereStr}
    GROUP BY source_name ORDER BY count DESC;
  `;
  const sourceRes = await query(sourceSql);
  const sources = (sourceRes.rows || []).map(r => ({
    name: r.source_name,
    count: parseInt(r.count, 10),
    percentage: calcPct(parseInt(r.count, 10), total)
  }));

  // 5. Project Categories Breakdown
  const catSql = `
    SELECT COALESCE(project_type, 'Web Engineering') AS category_name, COUNT(*) AS count
    FROM leads ${whereStr}
    GROUP BY category_name ORDER BY count DESC;
  `;
  const catRes = await query(catSql);
  const projectCategories = (catRes.rows || []).map(r => ({
    name: r.category_name,
    count: parseInt(r.count, 10),
    percentage: calcPct(parseInt(r.count, 10), total)
  }));

  // 6. AI Score Quality Breakdown
  const aiQualitySql = `
    SELECT
      COUNT(*) FILTER (WHERE lead_score >= 80) AS hot_count,
      COUNT(*) FILTER (WHERE lead_score >= 50 AND lead_score < 80) AS warm_count,
      COUNT(*) FILTER (WHERE lead_score < 50 AND lead_score IS NOT NULL) AS cold_count,
      COUNT(*) FILTER (WHERE lead_score IS NULL) AS unassigned_count
    FROM leads ${whereStr};
  `;
  const aiQRes = await query(aiQualitySql);
  const qData = aiQRes.rows[0] || {};
  const aiLeadQuality = {
    hot: parseInt(qData.hot_count || 0, 10),
    warm: parseInt(qData.warm_count || 0, 10),
    cold: parseInt(qData.cold_count || 0, 10),
    unassigned: parseInt(qData.unassigned_count || 0, 10)
  };

  // 7. Proposals Engine Metrics
  const propStatsSql = `
    SELECT
      COUNT(*) AS total_proposals,
      COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft,
      COUNT(*) FILTER (WHERE status = 'SENT') AS sent,
      COUNT(*) FILTER (WHERE status = 'VIEWED') AS viewed,
      COUNT(*) FILTER (WHERE status = 'ACCEPTED') AS accepted,
      COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected,
      COUNT(*) FILTER (WHERE status = 'EXPIRED') AS expired
    FROM proposals;
  `;
  const propStatsRes = await query(propStatsSql);
  const pr = propStatsRes.rows[0] || {};
  const propTotal = parseInt(pr.total_proposals || 0, 10);
  const propSent = parseInt(pr.sent || 0, 10);
  const propViewed = parseInt(pr.viewed || 0, 10);
  const propAccepted = parseInt(pr.accepted || 0, 10);

  const proposalAnalytics = {
    total: propTotal,
    draft: parseInt(pr.draft || 0, 10),
    sent: propSent,
    viewed: propViewed,
    accepted: propAccepted,
    rejected: parseInt(pr.rejected || 0, 10),
    expired: parseInt(pr.expired || 0, 10),
    viewRate: calcPct(propViewed, propSent + propViewed),
    acceptanceRate: calcPct(propAccepted, propSent + propViewed + propAccepted)
  };

  // 8. Follow-up Engine Metrics
  const fuStatsSql = `
    SELECT
      COUNT(*) AS total_followups,
      COUNT(*) FILTER (WHERE status = 'SENT') AS sent,
      COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
      COUNT(*) FILTER (WHERE status = 'FAILED') AS failed,
      COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled
    FROM lead_followups;
  `;
  const fuStatsRes = await query(fuStatsSql);
  const fu = fuStatsRes.rows[0] || {};
  const followupAnalytics = {
    total: parseInt(fu.total_followups || 0, 10),
    sent: parseInt(fu.sent || 0, 10),
    pending: parseInt(fu.pending || 0, 10),
    failed: parseInt(fu.failed || 0, 10),
    cancelled: parseInt(fu.cancelled || 0, 10)
  };

  // 9. Top Opportunities Priority Ranking
  const topOppSql = `
    SELECT l.lead_id AS "leadId", l.name, l.company, l.project_type AS "projectType",
           l.budget AS "budgetRange", l.lead_score AS "leadScore", l.status,
           COALESCE(p.total, l.ai_recommended_price, 35000) AS "value"
    FROM leads l
    LEFT JOIN proposals p ON l.lead_id = p.lead_id
    WHERE l.status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION')
    ORDER BY l.lead_score DESC, "value" DESC
    LIMIT 5;
  `;
  // 10. Executive Revenue & Invoice Breakdown
  const revStatsSql = `
    SELECT
      COALESCE(SUM(total_amount), 0) AS total_invoiced,
      COALESCE(SUM(amount_paid), 0) AS total_paid,
      COALESCE(SUM(total_amount - amount_paid) FILTER (WHERE status = 'PENDING'), 0) AS outstanding,
      COALESCE(SUM(total_amount - amount_paid) FILTER (WHERE status = 'OVERDUE'), 0) AS overdue
    FROM invoices;
  `;
  const revStatsRes = await query(revStatsSql);
  const rev = revStatsRes.rows[0] || {};
  const revenueStats = {
    totalInvoiced: parseFloat(rev.total_invoiced || 0),
    totalPaid: parseFloat(rev.total_paid || 0),
    outstanding: parseFloat(rev.outstanding || 0),
    overdue: parseFloat(rev.overdue || 0)
  };

  // 11. Statistical Revenue & Pipeline Forecasting
  const avgMonthlyWon = wonCount > 0 ? (wonRevenue / Math.max(1, Math.ceil(wonCount / 2))) : 0;
  const forecast30Days = Math.round(wonRevenue + (weightedPipeline * 0.4));

  return {
    success: true,
    range,
    kpis: {
      total,
      new: newCount,
      contacted: contactedCount,
      qualified: qualifiedCount,
      proposalSent: proposalSentCount,
      negotiation: negotiationCount,
      won: wonCount,
      lost: lostCount
    },
    conversion,
    pipeline,
    sources,
    projectCategories,
    aiLeadQuality,
    proposalAnalytics,
    followupAnalytics,
    revenueStats,
    forecast: {
      type: 'FORECAST',
      predicted30DayRevenue: forecast30Days,
      weightedPipelineContribution: Math.round(weightedPipeline * 0.4),
      notice: 'Statistical prediction based on weighted sales pipeline and historical win velocity.'
    },
    topOpportunities: topOppRes.rows || []
  };
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
async function saveCopilotRecommendation(leadId, copilotData) {
  const {
    action = 'SEND_FOLLOWUP',
    priority = 'HIGH',
    confidence = 'HIGH',
    dealHealth = 'HEALTHY',
    reason = '',
    summary = '',
    riskData = [],
    missingInformation = [],
    suggestedReply = '',
    suggestedFollowup = ''
  } = copilotData;

  const sql = `
    INSERT INTO lead_copilot_recommendations (
      lead_id, action, priority, confidence, deal_health, reason, summary,
      risk_data, missing_information, suggested_reply, suggested_followup, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, NOW())
    RETURNING id, created_at;
  `;

  const res = await query(sql, [
    leadId, action, priority, confidence, dealHealth, reason, summary,
    JSON.stringify(riskData || []), JSON.stringify(missingInformation || []),
    suggestedReply, suggestedFollowup
  ]);

  if (res.success) {
    logLeadActivity(leadId, 'COPILOT_RECOMMENDATION_GENERATED', `AI Sales Copilot recommended next action: ${action} (${priority} Priority) — Reason: ${reason}`);
  }

  return res;
}

async function getCopilotRecommendations(leadId) {
  const sql = `
    SELECT id, lead_id AS "leadId", action, priority, confidence, deal_health AS "dealHealth",
           reason, summary, risk_data AS "riskData", missing_information AS "missingInformation",
           suggested_reply AS "suggestedReply", suggested_followup AS "suggestedFollowup",
           created_at AS "createdAt"
    FROM lead_copilot_recommendations
    WHERE lead_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [leadId]);
}

async function setBusinessTarget(periodType, periodStart, targetValue) {
  const sql = `
    INSERT INTO business_targets (period_type, period_start, target_value, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (period_type, period_start) DO UPDATE SET
      target_value = EXCLUDED.target_value,
      updated_at = NOW()
    RETURNING id, period_type, period_start, target_value;
  `;
  return await query(sql, [periodType.toUpperCase(), periodStart, parseInt(targetValue, 10)]);
}

async function getBusinessTargets() {
  const sql = `
    SELECT id, period_type AS "periodType", period_start AS "periodStart", target_value AS "targetValue", created_at AS "createdAt"
    FROM business_targets
    ORDER BY period_start DESC;
  `;
  return await query(sql);
}

async function createOrGetClientPortalToken(leadId, validDays = 30) {
  const lead = await getLeadById(leadId);
  if (!lead) return { success: false, error: 'Lead not found.' };

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();

  await query(`UPDATE client_portals SET is_active = false WHERE lead_id = $1`, [leadId]);

  const insertSql = `
    INSERT INTO client_portals (lead_id, token_hash, client_email, is_active, expires_at, created_at, updated_at)
    VALUES ($1, $2, $3, true, $4, NOW(), NOW())
    RETURNING id, lead_id, expires_at;
  `;

  const res = await query(insertSql, [leadId, tokenHash, lead.email, expiresAt]);
  if (res.success) {
    logLeadActivity(leadId, 'PORTAL_CREATED', `Client portal access link generated (Valid for ${validDays} days).`);
  }

  return {
    success: res.success,
    rawToken,
    expiresAt
  };
}

async function getClientPortalDataByToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

  const portalSql = `
    SELECT cp.id, cp.lead_id AS "leadId", cp.client_email AS "clientEmail",
           cp.is_active AS "isActive", cp.expires_at AS "expiresAt"
    FROM client_portals cp
    WHERE cp.token_hash = $1 AND cp.is_active = true AND (cp.expires_at IS NULL OR cp.expires_at > NOW())
    LIMIT 1;
  `;

  const portalRes = await query(portalSql, [tokenHash]);

  if (!portalRes.success || !portalRes.rows[0]) {
    const propSql = `
      SELECT p.lead_id AS "leadId", p.client_email AS "clientEmail"
      FROM proposals p
      WHERE p.access_token = $1
      LIMIT 1;
    `;
    const propRes = await query(propSql, [rawToken.trim()]);
    if (!propRes.success || !propRes.rows[0]) return null;

    const leadId = propRes.rows[0].leadId;
    const lead = await getLeadById(leadId);
    if (!lead) return null;

    const proposals = (await getProposalsByLead(leadId)).rows || [];
    const milestones = (await getProjectMilestones(leadId)).rows || [];
    const updates = (await getProjectUpdates(leadId)).rows || [];
    const messages = (await getClientMessages(leadId)).rows || [];
    const invoices = (await getInvoicesByLead(leadId)).rows || [];

    return {
      lead: {
        leadId: lead.leadId,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        projectType: lead.projectType,
        timeline: lead.timeline,
        status: lead.status
      },
      proposals,
      milestones,
      updates,
      messages,
      invoices
    };
  }

  const portal = portalRes.rows[0];
  await query(`UPDATE client_portals SET last_accessed_at = NOW() WHERE id = $1`, [portal.id]);

  const lead = await getLeadById(portal.leadId);
  if (!lead) return null;

  const proposals = (await getProposalsByLead(portal.leadId)).rows || [];
  const milestones = (await getProjectMilestones(portal.leadId)).rows || [];
  const updates = (await getProjectUpdates(portal.leadId)).rows || [];
  const messages = (await getClientMessages(portal.leadId)).rows || [];
  const invoices = (await getInvoicesByLead(portal.leadId)).rows || [];

  logLeadActivity(portal.leadId, 'PORTAL_ACCESSED', `Client accessed portal.`);

  return {
    lead: {
      leadId: lead.leadId,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      projectType: lead.projectType,
      timeline: lead.timeline,
      status: lead.status
    },
    proposals,
    milestones,
    updates,
    messages,
    invoices
  };
}

async function revokeClientPortalAccess(leadId) {
  const res = await query(`UPDATE client_portals SET is_active = false, updated_at = NOW() WHERE lead_id = $1 RETURNING lead_id`, [leadId]);
  if (res.success) {
    logLeadActivity(leadId, 'PORTAL_REVOKED', `Client portal access revoked by admin.`);
  }
  return res;
}

async function getProjectMilestones(leadId) {
  const sql = `
    SELECT id, lead_id AS "leadId", title, description, status,
           due_date AS "dueDate", completed_at AS "completedAt", sort_order AS "sortOrder"
    FROM project_milestones
    WHERE lead_id = $1
    ORDER BY sort_order ASC, created_at ASC;
  `;
  return await query(sql, [leadId]);
}

async function addProjectMilestone(leadId, title, description = '', dueDate = null, sortOrder = 1) {
  const sql = `
    INSERT INTO project_milestones (lead_id, title, description, status, due_date, sort_order, created_at, updated_at)
    VALUES ($1, $2, $3, 'PENDING', $4, $5, NOW(), NOW())
    RETURNING id, title;
  `;
  const res = await query(sql, [leadId, title, description, dueDate || null, sortOrder]);
  if (res.success) {
    logLeadActivity(leadId, 'MILESTONE_CREATED', `Milestone created: "${title}"`);
  }
  return res;
}

async function getProjectUpdates(leadId) {
  const sql = `
    SELECT id, lead_id AS "leadId", title, message, created_at AS "createdAt"
    FROM project_updates
    WHERE lead_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [leadId]);
}

async function addProjectUpdate(leadId, title, message) {
  const sql = `
    INSERT INTO project_updates (lead_id, title, message, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id;
  `;
  const res = await query(sql, [leadId, title, message]);
  if (res.success) {
    logLeadActivity(leadId, 'PROJECT_UPDATE_POSTED', `Project update published: "${title}"`);
  }
  return res;
}

async function getClientMessages(leadId) {
  const sql = `
    SELECT id, lead_id AS "leadId", sender_type AS "senderType", message, created_at AS "createdAt"
    FROM client_messages
    WHERE lead_id = $1
    ORDER BY created_at ASC;
  `;
  return await query(sql, [leadId]);
}

async function addClientMessage(leadId, senderType, message) {
  const sql = `
    INSERT INTO client_messages (lead_id, sender_type, message, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id, created_at;
  `;
  const res = await query(sql, [leadId, senderType.toUpperCase(), message]);
  if (res.success) {
    logLeadActivity(leadId, 'MESSAGE_SENT', `${senderType} message posted in client portal.`);
  }
  return res;
}

module.exports = {
  query,
  saveLead,
  getLeadById,
  getLeadsPaginated,
  updateLeadStatus,
async function createInvoice(invoiceData) {
  const {
    leadId,
    proposalId = null,
    clientName,
    clientEmail,
    company = 'Independent',
    items = [],
    discount = 0,
    taxRate = 0,
    currency = 'INR',
    dueDays = 14,
    notes = ''
  } = invoiceData;

  const countSql = `SELECT COUNT(*) AS count FROM invoices;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const numFormatted = String(nextNum).padStart(4, '0');
  const invoiceNumber = `AS-INV-2026-${numFormatted}`;

  let subtotal = 0;
  items.forEach(item => {
    subtotal += (parseFloat(item.unitPrice) || 0) * (parseFloat(item.quantity) || 1);
  });

  const discAmount = parseFloat(discount) || 0;
  const taxable = Math.max(0, subtotal - discAmount);
  const taxAmount = (taxable * (parseFloat(taxRate) || 0)) / 100;
  const totalAmount = taxable + taxAmount;
  const dueAmount = totalAmount;

  const issueDate = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const insertSql = `
    INSERT INTO invoices (
      invoice_number, lead_id, proposal_id, client_name, client_email, company,
      status, currency, subtotal, discount, tax_rate, tax_amount, total_amount,
      amount_paid, amount_due, issue_date, due_date, notes, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'SENT', $7, $8, $9, $10, $11, $12, 0.00, $13, $14, $15, $16, NOW(), NOW())
    RETURNING id, invoice_number, created_at;
  `;

  const res = await query(insertSql, [
    invoiceNumber, leadId, proposalId, clientName, clientEmail, company,
    currency, subtotal, discAmount, taxRate, taxAmount, totalAmount, dueAmount, issueDate, dueDate, notes
  ]);

  if (res.success && res.rows[0]) {
    const invId = res.rows[0].id;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemQty = parseFloat(item.quantity) || 1;
      const itemPrice = parseFloat(item.unitPrice) || 0;
      const itemLineTotal = itemQty * itemPrice;

      const itemSql = `
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, line_total, sort_order, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;
      await query(itemSql, [invId, item.description, itemQty, itemPrice, itemLineTotal, i + 1]);
    }

    logLeadActivity(leadId, 'INVOICE_CREATED', `Invoice ${invoiceNumber} issued for ₹${totalAmount.toLocaleString('en-IN')}`);
  }

  return {
    success: res.success,
    invoiceNumber,
    totalAmount,
    record: res.rows[0]
  };
}

async function getInvoicesByLead(leadId) {
  const sql = `
    SELECT id, invoice_number AS "invoiceNumber", lead_id AS "leadId", proposal_id AS "proposalId",
           client_name AS "clientName", client_email AS "clientEmail", company, status, currency,
           subtotal, discount, tax_rate AS "taxRate", tax_amount AS "taxAmount",
           total_amount AS "totalAmount", amount_paid AS "amountPaid", amount_due AS "amountDue",
           issue_date AS "issueDate", due_date AS "dueDate", notes, created_at AS "createdAt"
    FROM invoices
    WHERE lead_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [leadId]);
}

async function recordPayment({ invoiceId, amount, provider = 'MANUAL', reference = '', paymentMethod = 'CARD' }) {
  const invRes = await query(`SELECT * FROM invoices WHERE id = $1 LIMIT 1;`, [invoiceId]);
  if (!invRes.success || !invRes.rows[0]) return { success: false, error: 'Invoice not found.' };

  const inv = invRes.rows[0];
  const payAmt = parseFloat(amount) || 0;
  const payRef = reference || `PAY-AS-2026-${Date.now()}`;

  const paySql = `
    INSERT INTO payments (invoice_id, payment_reference, provider, status, amount, currency, payment_method, paid_at, created_at, updated_at)
    VALUES ($1, $2, $3, 'SUCCEEDED', $4, $5, $6, NOW(), NOW(), NOW())
    ON CONFLICT (payment_reference) DO NOTHING
    RETURNING id;
  `;

  const payRes = await query(paySql, [invoiceId, payRef, provider, payAmt, inv.currency || 'INR', paymentMethod]);

  if (payRes.success) {
    const newPaid = parseFloat(inv.amount_paid) + payAmt;
    const newDue = Math.max(0, parseFloat(inv.total_amount) - newPaid);
    const newStatus = newDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    await query(`
      UPDATE invoices
      SET amount_paid = $1, amount_due = $2, status = $3, updated_at = NOW()
      WHERE id = $4
    `, [newPaid, newDue, newStatus, invoiceId]);

    logLeadActivity(inv.lead_id, 'PAYMENT_SUCCEEDED', `Payment of ₹${payAmt.toLocaleString('en-IN')} verified for invoice ${inv.invoice_number} (${newStatus})`);

    if (newStatus === 'PAID') {
      updateLeadStatus(inv.lead_id, 'WON', { finalValue: newPaid });
    }
  }

  return payRes;
}

async function getOrCreateConversation(leadId) {
  const lead = await getLeadById(leadId);
  if (!lead) return null;

  const findSql = `SELECT * FROM conversations WHERE lead_id = $1 LIMIT 1;`;
  const findRes = await query(findSql, [leadId]);
  if (findRes.success && findRes.rows[0]) {
    return findRes.rows[0];
  }

  const createSql = `
    INSERT INTO conversations (lead_id, client_email, subject, status, priority, channel, last_message_at, created_at, updated_at)
    VALUES ($1, $2, $3, 'OPEN', 'NORMAL', 'EMAIL', NOW(), NOW(), NOW())
    RETURNING *;
  `;
  const createRes = await query(createSql, [leadId, lead.email, `Aether Studio — ${lead.projectType || 'Project Inquiry'}`]);
  return createRes.success ? createRes.rows[0] : null;
}

async function addConversationMessage(data) {
  const { leadId, senderType, senderName, senderEmail, channel = 'EMAIL', direction = 'OUTBOUND', subject = '', message, status = 'SENT' } = data;
  const conv = await getOrCreateConversation(leadId);
  const convId = conv ? conv.id : null;

  const sql = `
    INSERT INTO conversation_messages (conversation_id, lead_id, sender_type, sender_name, sender_email, channel, direction, subject, message, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    RETURNING id, created_at;
  `;
  const res = await query(sql, [convId, leadId, senderType, senderName, senderEmail, channel, direction, subject, message, status]);

  if (convId) {
    await query(`UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1`, [convId]);
  }

  if (res.success) {
    logLeadActivity(leadId, 'COMMUNICATION_SENT', `${channel} message (${direction}) logged: "${subject || message.substring(0, 40)}"`);
  }

  return res;
}

async function getConversationTimeline(leadId) {
  const sql = `
    SELECT id, conversation_id AS "conversationId", lead_id AS "leadId",
           sender_type AS "senderType", sender_name AS "senderName", sender_email AS "senderEmail",
           channel, direction, subject, message, status, created_at AS "createdAt"
    FROM conversation_messages
    WHERE lead_id = $1
    ORDER BY created_at ASC;
  `;
  return await query(sql, [leadId]);
}

async function createNotification({ leadId = null, type, title, message, priority = 'NORMAL' }) {
  const sql = `
    INSERT INTO notifications (lead_id, type, title, message, priority, is_read, created_at)
    VALUES ($1, $2, $3, $4, $5, false, NOW())
    RETURNING id, created_at;
  `;
  return await query(sql, [leadId, type, title, message, priority]);
}

async function getNotifications(limit = 50) {
  const sql = `
    SELECT id, lead_id AS "leadId", type, title, message, priority, is_read AS "isRead", created_at AS "createdAt"
    FROM notifications
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  return await query(sql, [limit]);
}

async function getMessageTemplates() {
  const sql = `
    SELECT id, name, channel, subject, body, variables, is_active AS "isActive"
    FROM message_templates
    ORDER BY name ASC;
  `;
  return await query(sql);
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
  scheduleFollowupSequence,
  getFollowupsByLead,
  getDueFollowups,
  checkLeadEligibilityForFollowup,
  updateFollowupStatus,
  toggleLeadFollowupEnabled,
  getCRMAnalytics,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
async function getTeamMembers() {
  const sql = `
    SELECT id, member_id AS "memberId", name, email, role, department, status, created_at AS "createdAt"
    FROM team_members
    ORDER BY created_at ASC;
  `;
  return await query(sql);
}

async function createTeamMember({ name, email, role = 'PROJECT_MANAGER', department = 'Engineering' }) {
  const countSql = `SELECT COUNT(*) AS count FROM team_members;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const memberId = `TM-${String(nextNum).padStart(3, '0')}`;

  const sql = `
    INSERT INTO team_members (member_id, name, email, role, department, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
    RETURNING id, member_id AS "memberId", name, role;
  `;
  return await query(sql, [memberId, name, email, role, department]);
}

async function createProject(projectData) {
  const {
    projectName,
    leadId = null,
    proposalId = null,
    clientName,
    clientEmail,
    description = '',
    budget = 0,
    assignedManager = 'Lead PM',
    targetDays = 30
  } = projectData;

  const countSql = `SELECT COUNT(*) AS count FROM projects;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const projectId = `PRJ-2026-${String(nextNum).padStart(4, '0')}`;

  const startDate = new Date().toISOString().split('T')[0];
  const targetDate = new Date(Date.now() + targetDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const sql = `
    INSERT INTO projects (
      project_id, project_name, lead_id, proposal_id, client_name, client_email,
      status, priority, description, budget, assigned_manager, start_date, target_date, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'IN_PROGRESS', 'MEDIUM', $7, $8, $9, $10, $11, NOW(), NOW())
    RETURNING id, project_id AS "projectId", project_name AS "projectName";
  `;

  const res = await query(sql, [
    projectId, projectName, leadId, proposalId, clientName, clientEmail,
    description, budget, assignedManager, startDate, targetDate
  ]);

  if (res.success && leadId) {
    logLeadActivity(leadId, 'PROJECT_CREATED', `Project ${projectId} ("${projectName}") initialized.`);
  }

  return res;
}

async function getProjects() {
  const sql = `
    SELECT id, project_id AS "projectId", project_name AS "projectName", lead_id AS "leadId",
           proposal_id AS "proposalId", client_name AS "clientName", client_email AS "clientEmail",
           status, priority, description, budget, assigned_manager AS "assignedManager",
           start_date AS "startDate", target_date AS "targetDate", created_at AS "createdAt"
    FROM projects
    ORDER BY created_at DESC;
  `;
  return await query(sql);
}

async function createTask(taskData) {
  const {
    projectId,
    title,
    description = '',
    assignedTo = 'Engineering Team',
    createdBy = 'Admin',
    priority = 'MEDIUM',
    dueDays = 7,
    estimatedHours = 8
  } = taskData;

  const countSql = `SELECT COUNT(*) AS count FROM tasks;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const taskId = `TSK-2026-${String(nextNum).padStart(4, '0')}`;

  const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const sql = `
    INSERT INTO tasks (
      task_id, project_id, title, description, assigned_to, created_by,
      status, priority, due_date, estimated_hours, actual_hours, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'TODO', $7, $8, $9, 0.00, NOW(), NOW())
    RETURNING id, task_id AS "taskId", title;
  `;

  return await query(sql, [
    taskId, projectId, title, description, assignedTo, createdBy, priority, dueDate, estimatedHours
  ]);
}

async function getTasksByProject(projectId) {
  const sql = `
    SELECT id, task_id AS "taskId", project_id AS "projectId", title, description,
           assigned_to AS "assignedTo", created_by AS "createdBy", status, priority,
           due_date AS "dueDate", estimated_hours AS "estimatedHours", actual_hours AS "actualHours",
           created_at AS "createdAt"
    FROM tasks
    WHERE project_id = $1
    ORDER BY created_at ASC;
  `;
  return await query(sql, [projectId]);
}

async function updateTaskStatus(taskId, status) {
  const sql = `
    UPDATE tasks
    SET status = $1, completed_at = CASE WHEN $1 = 'DONE' THEN NOW() ELSE completed_at END, updated_at = NOW()
    WHERE task_id = $2
    RETURNING task_id, status;
  `;
  return await query(sql, [status.toUpperCase(), taskId]);
}

async function addTaskComment(taskId, author, message) {
  const sql = `
    INSERT INTO task_comments (task_id, author, message, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id, created_at;
  `;
  return await query(sql, [taskId, author, message]);
}

async function logTimeEntry(taskId, userName, hours, notes = '') {
  const sql = `
    INSERT INTO time_entries (task_id, user_name, duration_hours, notes, logged_at, created_at)
    VALUES ($1, $2, $3, $4, CURRENT_DATE, NOW())
    RETURNING id;
  `;
  const res = await query(sql, [taskId, userName, parseFloat(hours), notes]);

  if (res.success) {
    await query(`
      UPDATE tasks
      SET actual_hours = actual_hours + $1, updated_at = NOW()
      WHERE task_id = $2;
    `, [parseFloat(hours), taskId]);
  }

  return res;
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
  scheduleFollowupSequence,
  getFollowupsByLead,
  getDueFollowups,
  checkLeadEligibilityForFollowup,
  updateFollowupStatus,
  toggleLeadFollowupEnabled,
  getCRMAnalytics,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
  getLeadActivity,
  saveCopilotRecommendation,
  getCopilotRecommendations,
  setBusinessTarget,
  getBusinessTargets,
  createOrGetClientPortalToken,
  getClientPortalDataByToken,
  revokeClientPortalAccess,
  getProjectMilestones,
  addProjectMilestone,
  getProjectUpdates,
  addProjectUpdate,
  getClientMessages,
  addClientMessage,
  createInvoice,
  getInvoicesByLead,
  recordPayment,
  getOrCreateConversation,
  addConversationMessage,
  getConversationTimeline,
  createNotification,
  getNotifications,
  getMessageTemplates,
async function createCalendarEvent(eventData) {
  const {
    title,
    description = '',
    eventType = 'MEETING',
    projectId = null,
    leadId = null,
    taskId = null,
    assignedTo = 'Engineering Team',
    startTime,
    endTime,
    allDay = false,
    location = 'Online',
    meetingUrl = null,
    createdBy = 'Admin'
  } = eventData;

  const countSql = `SELECT COUNT(*) AS count FROM calendar_events;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const eventId = `EVT-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO calendar_events (
      event_id, title, description, event_type, project_id, lead_id, task_id,
      assigned_to, start_time, end_time, all_day, location, meeting_url, status, created_by, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'SCHEDULED', $14, NOW(), NOW())
    RETURNING id, event_id AS "eventId", title;
  `;

  return await query(sql, [
    eventId, title, description, eventType, projectId, leadId, taskId,
    assignedTo, startTime, endTime, allDay, location, meetingUrl, createdBy
  ]);
}

async function getCalendarEvents(startDate = null, endDate = null) {
  let sql = `
    SELECT id, event_id AS "eventId", title, description, event_type AS "eventType",
           project_id AS "projectId", lead_id AS "leadId", task_id AS "taskId",
           assigned_to AS "assignedTo", start_time AS "startTime", end_time AS "endTime",
           all_day AS "allDay", location, meeting_url AS "meetingUrl", status, created_by AS "createdBy"
    FROM calendar_events
  `;
  const params = [];

  if (startDate && endDate) {
    sql += ` WHERE start_time >= $1 AND end_time <= $2`;
    params.push(startDate, endDate);
  }

  sql += ` ORDER BY start_time ASC;`;
  return await query(sql, params);
}

async function createMeeting(meetingData) {
  const {
    title,
    clientName = '',
    clientEmail = '',
    leadId = null,
    projectId = null,
    startTime,
    endTime,
    meetingUrl = 'https://meet.google.com/aether-studio',
    agenda = ''
  } = meetingData;

  const countSql = `SELECT COUNT(*) AS count FROM meetings;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const meetingId = `MTG-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO meetings (
      meeting_id, title, client_name, client_email, lead_id, project_id,
      start_time, end_time, meeting_url, agenda, status, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SCHEDULED', NOW(), NOW())
    RETURNING id, meeting_id AS "meetingId", title;
  `;

  const res = await query(sql, [
    meetingId, title, clientName, clientEmail, leadId, projectId,
    startTime, endTime, meetingUrl, agenda
  ]);

  if (res.success) {
    await createCalendarEvent({
      title: `Meeting: ${title}`,
      description: agenda,
      eventType: 'MEETING',
      projectId,
      leadId,
      startTime,
      endTime,
      meetingUrl
    });

    if (leadId) {
      logLeadActivity(leadId, 'MEETING_SCHEDULED', `Meeting ${meetingId} ("${title}") scheduled.`);
    }
  }

  return res;
}

async function getMeetings() {
  const sql = `
    SELECT id, meeting_id AS "meetingId", title, client_name AS "clientName", client_email AS "clientEmail",
           lead_id AS "leadId", project_id AS "projectId", start_time AS "startTime", end_time AS "endTime",
           meeting_url AS "meetingUrl", agenda, notes, status, created_at AS "createdAt"
    FROM meetings
    ORDER BY start_time ASC;
  `;
  return await query(sql);
}

async function updateMeetingNotes(meetingId, notes) {
  const sql = `
    UPDATE meetings
    SET notes = $1, status = 'COMPLETED', updated_at = NOW()
    WHERE meeting_id = $2
    RETURNING meeting_id, status;
  `;
  return await query(sql, [notes, meetingId]);
}

async function addTaskDependency(taskId, dependsOnTaskId) {
  if (taskId === dependsOnTaskId) {
    return { success: false, error: 'Self-dependency is not permitted.' };
  }
  const sql = `
    INSERT INTO task_dependencies (task_id, depends_on_task_id, created_at)
    VALUES ($1, $2, NOW())
    RETURNING id;
  `;
  return await query(sql, [taskId, dependsOnTaskId]);
}

async function getTaskDependencies(taskId) {
  const sql = `
    SELECT id, task_id AS "taskId", depends_on_task_id AS "dependsOnTaskId", created_at AS "createdAt"
    FROM task_dependencies
    WHERE task_id = $1;
  `;
  return await query(sql, [taskId]);
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
  scheduleFollowupSequence,
  getFollowupsByLead,
  getDueFollowups,
  checkLeadEligibilityForFollowup,
  updateFollowupStatus,
  toggleLeadFollowupEnabled,
  getCRMAnalytics,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
  getLeadActivity,
  saveCopilotRecommendation,
  getCopilotRecommendations,
  setBusinessTarget,
  getBusinessTargets,
  createOrGetClientPortalToken,
  getClientPortalDataByToken,
  revokeClientPortalAccess,
  getProjectMilestones,
  addProjectMilestone,
  getProjectUpdates,
  addProjectUpdate,
  getClientMessages,
  addClientMessage,
  createInvoice,
  getInvoicesByLead,
  recordPayment,
  getOrCreateConversation,
  addConversationMessage,
async function createClientDeliverable(delivData) {
  const { projectId = null, leadId, name, description = '', version = 'v1.0', fileUrl = null } = delivData;

  const countSql = `SELECT COUNT(*) AS count FROM client_deliverables;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const deliverableId = `DEL-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO client_deliverables (
      deliverable_id, project_id, lead_id, name, description, version, file_url, status, submitted_at, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'IN_REVIEW', NOW(), NOW(), NOW())
    RETURNING id, deliverable_id AS "deliverableId", name, status;
  `;

  const res = await query(sql, [deliverableId, projectId, leadId, name, description, version, fileUrl]);
  if (res.success && leadId) {
    logLeadActivity(leadId, 'DELIVERABLE_SUBMITTED', `Deliverable ${deliverableId} ("${name}") submitted for client review.`);
  }
  return res;
}

async function getClientDeliverablesByLead(leadId) {
  const sql = `
    SELECT id, deliverable_id AS "deliverableId", project_id AS "projectId", lead_id AS "leadId",
           name, description, version, file_url AS "fileUrl", status, submitted_at AS "submittedAt", approved_at AS "approvedAt"
    FROM client_deliverables
    WHERE lead_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [leadId]);
}

async function approveDeliverable(deliverableId, leadId) {
  const sql = `
    UPDATE client_deliverables
    SET status = 'APPROVED', approved_at = NOW(), updated_at = NOW()
    WHERE deliverable_id = $1 AND lead_id = $2
    RETURNING deliverable_id, status;
  `;
  const res = await query(sql, [deliverableId, leadId]);
  if (res.success && res.rows[0]) {
    logLeadActivity(leadId, 'DELIVERABLE_APPROVED', `Deliverable ${deliverableId} approved by client.`);
  }
  return res;
}

async function addClientFeedback(deliverableId, leadId, rating = 5, comment = '') {
  const sql = `
    INSERT INTO client_feedback (deliverable_id, lead_id, rating, feedback_type, comment, created_at)
    VALUES ($1, $2, $3, 'APPROVAL', $4, NOW())
    RETURNING id, created_at;
  `;
  return await query(sql, [deliverableId, leadId, parseInt(rating, 10), comment]);
}

async function createClientTicket(ticketData) {
  const { leadId, projectId = null, subject, description, priority = 'MEDIUM' } = ticketData;

  const countSql = `SELECT COUNT(*) AS count FROM client_tickets;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const ticketId = `TKT-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO client_tickets (
      ticket_id, lead_id, project_id, subject, description, priority, status, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', NOW(), NOW())
    RETURNING id, ticket_id AS "ticketId", subject, status;
  `;

  const res = await query(sql, [ticketId, leadId, projectId, subject, description, priority]);
  if (res.success && leadId) {
    logLeadActivity(leadId, 'SUPPORT_TICKET_CREATED', `Support ticket ${ticketId} ("${subject}") opened by client.`);
  }
  return res;
}

async function getClientTicketsByLead(leadId) {
  const sql = `
    SELECT id, ticket_id AS "ticketId", lead_id AS "leadId", project_id AS "projectId",
           subject, description, priority, status, created_at AS "createdAt", updated_at AS "updatedAt"
    FROM client_tickets
    WHERE lead_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [leadId]);
}

async function addTicketMessage(ticketId, senderType, senderName, message) {
  const sql = `
    INSERT INTO client_ticket_messages (ticket_id, sender_type, sender_name, message, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id, created_at;
  `;
  return await query(sql, [ticketId, senderType, senderName, message]);
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
  scheduleFollowupSequence,
  getFollowupsByLead,
  getDueFollowups,
  checkLeadEligibilityForFollowup,
  updateFollowupStatus,
  toggleLeadFollowupEnabled,
  getCRMAnalytics,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
  getLeadActivity,
  saveCopilotRecommendation,
  getCopilotRecommendations,
  setBusinessTarget,
  getBusinessTargets,
  createOrGetClientPortalToken,
  getClientPortalDataByToken,
  revokeClientPortalAccess,
  getProjectMilestones,
  addProjectMilestone,
  getProjectUpdates,
  addProjectUpdate,
  getClientMessages,
  addClientMessage,
  createInvoice,
  getInvoicesByLead,
  recordPayment,
  getOrCreateConversation,
  addConversationMessage,
  getConversationTimeline,
  createNotification,
  getNotifications,
  getMessageTemplates,
  getTeamMembers,
  createTeamMember,
  createProject,
  getProjects,
  createTask,
  getTasksByProject,
async function createDocument(docData) {
  const {
    name,
    description = '',
    category = 'DELIVERABLE',
    projectId = null,
    leadId = null,
    deliverableId = null,
    currentVersion = 'v1.0',
    mimeType = 'application/pdf',
    fileSize = 0,
    checksum = null,
    storageKey,
    visibility = 'INTERNAL',
    createdBy = 'Admin'
  } = docData;

  const countSql = `SELECT COUNT(*) AS count FROM documents;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const documentId = `DOC-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO documents (
      document_id, name, description, category, project_id, lead_id, deliverable_id,
      current_version, mime_type, file_size, checksum, storage_key, status, visibility, created_by, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'UPLOADED', $13, $14, NOW(), NOW())
    RETURNING id, document_id AS "documentId", name, visibility;
  `;

  const res = await query(sql, [
    documentId, name, description, category, projectId, leadId, deliverableId,
    currentVersion, mimeType, fileSize, checksum, storageKey, visibility, createdBy
  ]);

  if (res.success) {
    await query(`
      INSERT INTO document_versions (document_id, version, storage_key, file_size, mime_type, checksum, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
    `, [documentId, currentVersion, storageKey, fileSize, mimeType, checksum, createdBy]);

    if (leadId) {
      logLeadActivity(leadId, 'DOCUMENT_UPLOADED', `Document ${documentId} ("${name}") registered (${visibility}).`);
    }
  }

  return res;
}

async function getDocuments({ leadId = null, projectId = null, visibility = null }) {
  let sql = `
    SELECT id, document_id AS "documentId", name, description, category, project_id AS "projectId",
           lead_id AS "leadId", deliverable_id AS "deliverableId", current_version AS "currentVersion",
           mime_type AS "mimeType", file_size AS "fileSize", checksum, storage_key AS "storageKey",
           status, visibility, created_by AS "createdBy", created_at AS "createdAt"
    FROM documents
    WHERE 1=1
  `;
  const params = [];

  if (leadId) {
    params.push(leadId);
    sql += ` AND lead_id = $${params.length}`;
  }

  if (projectId) {
    params.push(projectId);
    sql += ` AND project_id = $${params.length}`;
  }

  if (visibility) {
    params.push(visibility);
    sql += ` AND visibility = $${params.length}`;
  }

  sql += ` ORDER BY created_at DESC;`;
  return await query(sql, params);
}

async function createDocumentVersion(versionData) {
  const { documentId, version, storageKey, fileSize, mimeType, checksum = null, createdBy = 'Admin' } = versionData;

  const sql = `
    INSERT INTO document_versions (document_id, version, storage_key, file_size, mime_type, checksum, created_by, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING id, version;
  `;
  const res = await query(sql, [documentId, version, storageKey, fileSize, mimeType, checksum, createdBy]);

  if (res.success) {
    await query(`
      UPDATE documents
      SET current_version = $1, file_size = $2, storage_key = $3, checksum = $4, updated_at = NOW()
      WHERE document_id = $5;
    `, [version, fileSize, storageKey, checksum, documentId]);
  }

  return res;
}

async function createDocumentRequest(reqData) {
  const { leadId, projectId = null, title, description = '', dueDate = null } = reqData;

  const countSql = `SELECT COUNT(*) AS count FROM document_requests;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const requestId = `REQ-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO document_requests (request_id, lead_id, project_id, title, description, due_date, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'REQUESTED', NOW(), NOW())
    RETURNING id, request_id AS "requestId", title;
  `;
  return await query(sql, [requestId, leadId, projectId, title, description, dueDate]);
}

async function getDocumentRequestsByLead(leadId) {
  const sql = `
    SELECT id, request_id AS "requestId", lead_id AS "leadId", project_id AS "projectId",
           title, description, due_date AS "dueDate", status, created_at AS "createdAt"
    FROM document_requests
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
  scheduleFollowupSequence,
  getFollowupsByLead,
  getDueFollowups,
  checkLeadEligibilityForFollowup,
  updateFollowupStatus,
  toggleLeadFollowupEnabled,
  getCRMAnalytics,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
  getLeadActivity,
  saveCopilotRecommendation,
  getCopilotRecommendations,
  setBusinessTarget,
  getBusinessTargets,
  createOrGetClientPortalToken,
  getClientPortalDataByToken,
  revokeClientPortalAccess,
  getProjectMilestones,
  addProjectMilestone,
  getProjectUpdates,
  addProjectUpdate,
  getClientMessages,
  addClientMessage,
  createInvoice,
  getInvoicesByLead,
  recordPayment,
  getOrCreateConversation,
  addConversationMessage,
  getConversationTimeline,
  createNotification,
  getNotifications,
  getMessageTemplates,
  getTeamMembers,
  createTeamMember,
  createProject,
async function createWorkflowDefinition(wfData) {
  const { name, description = '', triggerEvent, conditions = [], actions = [], createdBy = 'Admin' } = wfData;

  const countSql = `SELECT COUNT(*) AS count FROM workflow_definitions;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const workflowId = `WF-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO workflow_definitions (
      workflow_id, name, description, trigger_event, conditions, actions, status, created_by, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, NOW(), NOW())
    RETURNING id, workflow_id AS "workflowId", name, trigger_event AS "triggerEvent";
  `;

  return await query(sql, [
    workflowId, name, description, triggerEvent,
    JSON.stringify(conditions), JSON.stringify(actions), createdBy
  ]);
}

async function getWorkflowDefinitions(triggerEvent = null) {
  let sql = `
    SELECT id, workflow_id AS "workflow_id", name, description, trigger_event AS "trigger_event",
           conditions, actions, status, created_by AS "created_by", created_at AS "created_at"
    FROM workflow_definitions
  `;
  const params = [];

  if (triggerEvent) {
    sql += ` WHERE trigger_event = $1`;
    params.push(triggerEvent);
  }

  sql += ` ORDER BY created_at DESC;`;
  return await query(sql, params);
}

async function logWorkflowEvent(eventData) {
  const { eventType, entityType, entityId, payload = {} } = eventData;

  const countSql = `SELECT COUNT(*) AS count FROM workflow_events;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const eventId = `EVT-RAW-${String(nextNum).padStart(6, '0')}`;

  const sql = `
    INSERT INTO workflow_events (event_id, event_type, entity_type, entity_id, payload, processed, created_at)
    VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
    RETURNING id, event_id AS "event_id", event_type AS "event_type";
  `;
  return await query(sql, [eventId, eventType, entityType, String(entityId), JSON.stringify(payload)]);
}

async function logWorkflowRun(runData) {
  const { workflowId, eventId, idempotencyKey, status = 'COMPLETED', logs = [] } = runData;

  const countSql = `SELECT COUNT(*) AS count FROM workflow_runs;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const runId = `RUN-2026-${String(nextNum).padStart(6, '0')}`;

  const sql = `
    INSERT INTO workflow_runs (run_id, workflow_id, event_id, idempotency_key, status, logs, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id, run_id AS "runId", status;
  `;
  return await query(sql, [runId, workflowId, eventId, idempotencyKey, status, JSON.stringify(logs)]);
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
  scheduleFollowupSequence,
  getFollowupsByLead,
  getDueFollowups,
  checkLeadEligibilityForFollowup,
  updateFollowupStatus,
  toggleLeadFollowupEnabled,
  getCRMAnalytics,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
  getLeadActivity,
  saveCopilotRecommendation,
  getCopilotRecommendations,
  setBusinessTarget,
  getBusinessTargets,
  createOrGetClientPortalToken,
  getClientPortalDataByToken,
  revokeClientPortalAccess,
  getProjectMilestones,
  addProjectMilestone,
  getProjectUpdates,
  addProjectUpdate,
  getClientMessages,
  addClientMessage,
  createInvoice,
  getInvoicesByLead,
  recordPayment,
  getOrCreateConversation,
  addConversationMessage,
  getConversationTimeline,
  createNotification,
  getNotifications,
  getMessageTemplates,
  getTeamMembers,
  createTeamMember,
  createProject,
  getProjects,
  createTask,
  getTasksByProject,
  updateTaskStatus,
async function createClientNotification({ leadId, category = 'PROJECT', title, message }) {
  const countSql = `SELECT COUNT(*) AS count FROM client_notifications;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const notificationId = `CNOTIF-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO client_notifications (notification_id, lead_id, category, title, message, is_read, created_at)
    VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
    RETURNING id, notification_id AS "notificationId", title;
  `;
  return await query(sql, [notificationId, leadId, category, title, message]);
}

async function getClientNotifications(leadId) {
  const sql = `
    SELECT id, notification_id AS "notificationId", category, title, message, is_read AS "isRead", created_at AS "createdAt"
    FROM client_notifications
    WHERE lead_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [leadId]);
}

async function createClientChangeRequest({ leadId, projectId = null, deliverableId = null, title, description, priority = 'MEDIUM' }) {
  const countSql = `SELECT COUNT(*) AS count FROM client_change_requests;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const requestId = `CHG-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO client_change_requests (request_id, lead_id, project_id, deliverable_id, title, description, priority, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUBMITTED', NOW(), NOW())
    RETURNING id, request_id AS "requestId", title;
  `;
  const res = await query(sql, [requestId, leadId, projectId, deliverableId, title, description, priority]);
  if (res.success) {
    logClientActivity(leadId, 'CHANGE_REQUESTED', `Change Request ${requestId} ("${title}") submitted.`);
  }
  return res;
}

async function getClientChangeRequests(leadId) {
  const sql = `
    SELECT id, request_id AS "requestId", lead_id AS "leadId", project_id AS "projectId",
           deliverable_id AS "deliverableId", title, description, priority, status, created_at AS "createdAt"
    FROM client_change_requests
    WHERE lead_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [leadId]);
}

async function logClientActivity(leadId, actionType, description) {
  const countSql = `SELECT COUNT(*) AS count FROM client_activity_logs;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const logId = `CACT-2026-${String(nextNum).padStart(6, '0')}`;

  const sql = `
    INSERT INTO client_activity_logs (log_id, lead_id, action_type, description, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id, log_id AS "logId", action_type AS "actionType";
  `;
  return await query(sql, [logId, leadId, actionType, description]);
}

async function getClientActivityLogs(leadId) {
  const sql = `
    SELECT id, log_id AS "logId", action_type AS "actionType", description, created_at AS "createdAt"
    FROM client_activity_logs
    WHERE lead_id = $1
    ORDER BY created_at DESC
    LIMIT 20;
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
  scheduleFollowupSequence,
  getFollowupsByLead,
  getDueFollowups,
  checkLeadEligibilityForFollowup,
  updateFollowupStatus,
  toggleLeadFollowupEnabled,
  getCRMAnalytics,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
  getLeadActivity,
  saveCopilotRecommendation,
  getCopilotRecommendations,
  setBusinessTarget,
  getBusinessTargets,
  createOrGetClientPortalToken,
  getClientPortalDataByToken,
  revokeClientPortalAccess,
  getProjectMilestones,
  addProjectMilestone,
  getProjectUpdates,
  addProjectUpdate,
  getClientMessages,
  addClientMessage,
  createInvoice,
  getInvoicesByLead,
  recordPayment,
  getOrCreateConversation,
  addConversationMessage,
  getConversationTimeline,
  createNotification,
async function createProjectPhase({ projectId, name, description = '', startDate = null, targetDate = null }) {
  const countSql = `SELECT COUNT(*) AS count FROM project_phases;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const phaseId = `PHS-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO project_phases (phase_id, project_id, name, description, status, start_date, target_date, created_at)
    VALUES ($1, $2, $3, $4, 'PLANNING', $5, $6, NOW())
    RETURNING id, phase_id AS "phaseId", name, status;
  `;
  return await query(sql, [phaseId, projectId, name, description, startDate, targetDate]);
}

async function getProjectPhases(projectId) {
  const sql = `
    SELECT id, phase_id AS "phaseId", project_id AS "projectId", name, description,
           status, start_date AS "startDate", target_date AS "targetDate", created_at AS "createdAt"
    FROM project_phases
    WHERE project_id = $1
    ORDER BY created_at ASC;
  `;
  return await query(sql, [projectId]);
}

async function createProjectRisk({ projectId, title, description = '', probability = 3, impact = 3 }) {
  const countSql = `SELECT COUNT(*) AS count FROM project_risks;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const riskId = `RSK-2026-${String(nextNum).padStart(4, '0')}`;
  const riskScore = Math.min(25, Math.max(1, parseInt(probability, 10) * parseInt(impact, 10)));

  const sql = `
    INSERT INTO project_risks (risk_id, project_id, title, description, probability, impact, risk_score, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', NOW())
    RETURNING id, risk_id AS "riskId", title, risk_score AS "riskScore";
  `;
  return await query(sql, [riskId, projectId, title, description, probability, impact, riskScore]);
}

async function getProjectRisks(projectId) {
  const sql = `
    SELECT id, risk_id AS "riskId", project_id AS "projectId", title, description,
           probability, impact, risk_score AS "riskScore", status, created_at AS "createdAt"
    FROM project_risks
    WHERE project_id = $1
    ORDER BY risk_score DESC, created_at DESC;
  `;
  return await query(sql, [projectId]);
}

async function createProjectBlocker({ projectId, taskId = null, title, description = '' }) {
  const countSql = `SELECT COUNT(*) AS count FROM project_blockers;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const blockerId = `BLK-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO project_blockers (blocker_id, project_id, task_id, title, description, status, created_at)
    VALUES ($1, $2, $3, $4, $5, 'OPEN', NOW())
    RETURNING id, blocker_id AS "blockerId", title, status;
  `;
  return await query(sql, [blockerId, projectId, taskId, title, description]);
}

async function getProjectBlockers(projectId) {
  const sql = `
    SELECT id, blocker_id AS "blockerId", project_id AS "projectId", task_id AS "taskId",
           title, description, status, created_at AS "createdAt"
    FROM project_blockers
    WHERE project_id = $1
    ORDER BY created_at DESC;
  `;
  return await query(sql, [projectId]);
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
  scheduleFollowupSequence,
  getFollowupsByLead,
  getDueFollowups,
  checkLeadEligibilityForFollowup,
  updateFollowupStatus,
  toggleLeadFollowupEnabled,
  getCRMAnalytics,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
  getLeadActivity,
  saveCopilotRecommendation,
  getCopilotRecommendations,
  setBusinessTarget,
  getBusinessTargets,
  createOrGetClientPortalToken,
  getClientPortalDataByToken,
  revokeClientPortalAccess,
  getProjectMilestones,
  addProjectMilestone,
  getProjectUpdates,
  addProjectUpdate,
  getClientMessages,
  addClientMessage,
  createInvoice,
  getInvoicesByLead,
  recordPayment,
  getOrCreateConversation,
  addConversationMessage,
  getConversationTimeline,
  createNotification,
  getNotifications,
  getMessageTemplates,
  getTeamMembers,
  createTeamMember,
  createProject,
  getProjects,
  createTask,
async function createExpense({ projectId = null, category = 'OPERATIONS', description, amount, currency = 'INR', vendor = 'Vendor', createdBy = 'Admin' }) {
  const countSql = `SELECT COUNT(*) AS count FROM expenses;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const expenseId = `EXP-2026-${String(nextNum).padStart(4, '0')}`;
  const expAmount = parseFloat(amount) || 0.00;

  const sql = `
    INSERT INTO expenses (expense_id, project_id, category, description, amount, currency, vendor, expense_date, status, created_by, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 'APPROVED', $8, NOW())
    RETURNING id, expense_id AS "expenseId", description, amount;
  `;
  return await query(sql, [expenseId, projectId, category, description, expAmount, currency, vendor, createdBy]);
}

async function getExpenses(projectId = null) {
  let sql = `
    SELECT id, expense_id AS "expenseId", project_id AS "projectId", category, description,
           amount, currency, vendor, expense_date AS "expenseDate", status, created_at AS "createdAt"
    FROM expenses
  `;
  const params = [];
  if (projectId) {
    sql += ` WHERE project_id = $1`;
    params.push(projectId);
  }
  sql += ` ORDER BY expense_date DESC, created_at DESC;`;
  return await query(sql, params);
}

async function createPaymentPlan({ invoiceId, milestoneName, amount, dueDate = null }) {
  const countSql = `SELECT COUNT(*) AS count FROM payment_plans;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const planId = `PLAN-2026-${String(nextNum).padStart(4, '0')}`;
  const planAmount = parseFloat(amount) || 0.00;

  const sql = `
    INSERT INTO payment_plans (plan_id, invoice_id, milestone_name, amount, due_date, status, created_at)
    VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW())
    RETURNING id, plan_id AS "planId", milestone_name AS "milestoneName", amount;
  `;
  return await query(sql, [planId, invoiceId, milestoneName, planAmount, dueDate]);
}

async function getPaymentPlansByInvoice(invoiceId) {
  const sql = `
    SELECT id, plan_id AS "planId", invoice_id AS "invoiceId", milestone_name AS "milestoneName",
           amount, due_date AS "dueDate", status, created_at AS "createdAt"
    FROM payment_plans
    WHERE invoice_id = $1
    ORDER BY created_at ASC;
  `;
  return await query(sql, [invoiceId]);
}

async function saveLeadAttribution({ leadId, utmSource = '', utmMedium = '', utmCampaign = '', utmTerm = '', utmContent = '', referrer = '' }) {
  const sql = `
    INSERT INTO lead_attributions (lead_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content, referrer, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING id;
  `;
  return await query(sql, [leadId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referrer]);
}

async function getLeadAttribution(leadId) {
  const sql = `
    SELECT id, lead_id AS "leadId", utm_source AS "utmSource", utm_medium AS "utmMedium",
           utm_campaign AS "utmCampaign", utm_term AS "utmTerm", utm_content AS "utmContent",
           referrer, created_at AS "createdAt"
    FROM lead_attributions
    WHERE lead_id = $1
    LIMIT 1;
  `;
  return await query(sql, [leadId]);
}

async function createCampaign({ name, subject = '' }) {
  const countSql = `SELECT COUNT(*) AS count FROM campaigns;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const campaignId = `CMP-2026-${String(nextNum).padStart(4, '0')}`;

  const sql = `
    INSERT INTO campaigns (campaign_id, name, subject, status, sent_count, created_at)
    VALUES ($1, $2, $3, 'DRAFT', 0, NOW())
    RETURNING id, campaign_id AS "campaignId", name, status;
  `;
  return await query(sql, [campaignId, name, subject]);
}

async function getCampaigns() {
  const sql = `
    SELECT id, campaign_id AS "campaignId", name, subject, status, sent_count AS "sentCount", created_at AS "createdAt"
    FROM campaigns
    ORDER BY created_at DESC;
  `;
  return await query(sql);
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
  scheduleFollowupSequence,
  getFollowupsByLead,
  getDueFollowups,
  checkLeadEligibilityForFollowup,
  updateFollowupStatus,
  toggleLeadFollowupEnabled,
  getCRMAnalytics,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
  getLeadActivity,
  saveCopilotRecommendation,
  getCopilotRecommendations,
  setBusinessTarget,
  getBusinessTargets,
  createOrGetClientPortalToken,
  getClientPortalDataByToken,
  revokeClientPortalAccess,
  getProjectMilestones,
  addProjectMilestone,
  getProjectUpdates,
  addProjectUpdate,
  getClientMessages,
  addClientMessage,
  createInvoice,
  getInvoicesByLead,
  recordPayment,
  getOrCreateConversation,
  addConversationMessage,
  getConversationTimeline,
  createNotification,
  getNotifications,
  getMessageTemplates,
  getTeamMembers,
async function calculateClientHealthScore(leadId) {
  const countSql = `SELECT COUNT(*) AS count FROM client_health_scores;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const scoreId = `CHS-2026-${String(nextNum).padStart(4, '0')}`;

  const invRes = await query(`SELECT COUNT(*) AS count FROM invoices WHERE lead_id = $1 AND status = 'OVERDUE';`, [leadId]);
  const overdueCount = (invRes.success && invRes.rows[0]) ? parseInt(invRes.rows[0].count, 10) : 0;

  const tktRes = await query(`SELECT COUNT(*) AS count FROM client_tickets WHERE lead_id = $1 AND status = 'OPEN';`, [leadId]);
  const openTkts = (tktRes.success && tktRes.rows[0]) ? parseInt(tktRes.rows[0].count, 10) : 0;

  let baseScore = 90;
  baseScore -= overdueCount * 15;
  baseScore -= openTkts * 5;
  const finalScore = Math.min(100, Math.max(10, baseScore));

  let status = 'HEALTHY';
  if (finalScore < 50) status = 'CRITICAL';
  else if (finalScore < 70) status = 'AT_RISK';
  else if (finalScore < 85) status = 'WATCH';

  const reason = `Automated calculation: Overdue Invoices (${overdueCount}), Open Tickets (${openTkts}).`;

  const sql = `
    INSERT INTO client_health_scores (score_id, lead_id, health_score, status, reason, calculated_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id, score_id AS "scoreId", health_score AS "healthScore", status, reason;
  `;
  return await query(sql, [scoreId, leadId, finalScore, status, reason]);
}

async function getClientHealthHistory(leadId) {
  const sql = `
    SELECT id, score_id AS "scoreId", lead_id AS "leadId", health_score AS "healthScore",
           status, reason, calculated_at AS "calculatedAt"
    FROM client_health_scores
    WHERE lead_id = $1
    ORDER BY calculated_at DESC;
  `;
  return await query(sql, [leadId]);
}

async function createClientRenewal({ leadId, renewalDate, renewalValue = 0.00, notes = '' }) {
  const countSql = `SELECT COUNT(*) AS count FROM client_renewals;`;
  const countRes = await query(countSql);
  const nextNum = (countRes.success && countRes.rows[0] ? parseInt(countRes.rows[0].count, 10) : 0) + 1;
  const renewalId = `RNW-2026-${String(nextNum).padStart(4, '0')}`;
  const renVal = parseFloat(renewalValue) || 0.00;

  const sql = `
    INSERT INTO client_renewals (renewal_id, lead_id, renewal_date, renewal_value, status, notes, created_at)
    VALUES ($1, $2, $3, $4, 'UPCOMING', $5, NOW())
    RETURNING id, renewal_id AS "renewalId", renewal_date AS "renewalDate", renewal_value AS "renewalValue", status;
  `;
  return await query(sql, [renewalId, leadId, renewalDate, renVal, notes]);
}

async function getClientRenewals(leadId = null) {
  let sql = `
    SELECT id, renewal_id AS "renewalId", lead_id AS "leadId", renewal_date AS "renewalDate",
           renewal_value AS "renewalValue", status, notes, created_at AS "createdAt"
    FROM client_renewals
  `;
  const params = [];
  if (leadId) {
    sql += ` WHERE lead_id = $1`;
    params.push(leadId);
  }
  sql += ` ORDER BY renewal_date ASC, created_at DESC;`;
  return await query(sql, params);
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
  scheduleFollowupSequence,
  getFollowupsByLead,
  getDueFollowups,
  checkLeadEligibilityForFollowup,
  updateFollowupStatus,
  toggleLeadFollowupEnabled,
  getCRMAnalytics,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
  getLeadActivity,
  saveCopilotRecommendation,
  getCopilotRecommendations,
  setBusinessTarget,
  getBusinessTargets,
  createOrGetClientPortalToken,
  getClientPortalDataByToken,
  revokeClientPortalAccess,
  getProjectMilestones,
  addProjectMilestone,
  getProjectUpdates,
  addProjectUpdate,
  getClientMessages,
  addClientMessage,
  createInvoice,
  getInvoicesByLead,
  recordPayment,
  getOrCreateConversation,
  addConversationMessage,
  getConversationTimeline,
  createNotification,
  getNotifications,
  getMessageTemplates,
  getTeamMembers,
  createTeamMember,
  createProject,
  getProjects,
  createTask,
  getTasksByProject,
  updateTaskStatus,
  addTaskComment,
  logTimeEntry,
  createCalendarEvent,
  getCalendarEvents,
  createMeeting,
  getMeetings,
  updateMeetingNotes,
  addTaskDependency,
  getTaskDependencies,
  createClientDeliverable,
  getClientDeliverablesByLead,
  approveDeliverable,
  addClientFeedback,
  createClientTicket,
  getClientTicketsByLead,
  addTicketMessage,
  createDocument,
  getDocuments,
  createDocumentVersion,
  createDocumentRequest,
  getDocumentRequestsByLead,
  createWorkflowDefinition,
  getWorkflowDefinitions,
  logWorkflowEvent,
  logWorkflowRun,
  createClientNotification,
  getClientNotifications,
  createClientChangeRequest,
  getClientChangeRequests,
  logClientActivity,
  getClientActivityLogs,
  createProjectPhase,
  getProjectPhases,
  createProjectRisk,
  getProjectRisks,
  createProjectBlocker,
  getProjectBlockers,
  createExpense,
  getExpenses,
  createPaymentPlan,
  getPaymentPlansByInvoice,
  saveLeadAttribution,
  getLeadAttribution,
  createCampaign,
  getCampaigns,
  calculateClientHealthScore,
  getClientHealthHistory,
  createClientRenewal,
  getClientRenewals
};
