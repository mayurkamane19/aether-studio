/**
 * SERVERLESS POSTGRESQL DATABASE CONNECTOR: lib/db.js
 * Handles connection pooling, parameterized queries, search filtering,
 * lead scoring, notes, and activity timeline logging for Aether Studio.
 * Uses process.env.DATABASE_URL.
 */

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

  const sql = `
    INSERT INTO leads (
      lead_id, name, email, company, project_type, budget, timeline,
      preferred_contact, message, status, lead_score, source, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    ON CONFLICT (lead_id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING id, lead_id, created_at;
  `;

  const res = await query(sql, [
    leadId, name, email, company, projectType, budget, timeline,
    preferredContact, message, status, scoreToSave, source
  ]);

  if (res.success) {
    logLeadActivity(leadId, 'LEAD_CREATED', `Lead ${leadId} submitted by ${name} (${email})`);
  }

  return res;
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
           message, status, lead_score AS "leadScore", source, created_at AS "submissionDate"
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
  getLeadsPaginated,
  updateLeadStatus,
  addLeadNote,
  getLeadNotes,
  logLeadActivity,
  getLeadActivity
};
