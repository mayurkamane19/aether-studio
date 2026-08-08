/**
 * SERVERLESS POSTGRESQL DATABASE CONNECTOR: lib/db.js
 * Handles safe connection pooling, parameterized queries, and graceful fallbacks for Aether Studio.
 * Uses process.env.DATABASE_URL (PostgreSQL / Supabase).
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
    leadScore = 0,
    source = 'Website'
  } = leadData;

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

  return await query(sql, [
    leadId, name, email, company, projectType, budget, timeline,
    preferredContact, message, status, leadScore, source
  ]);
}

async function getAllLeads() {
  const sql = `
    SELECT id, lead_id AS "leadId", name, email, company, project_type AS "projectType",
           budget AS "budgetRange", timeline, preferred_contact AS "contactMethod",
           message, status, lead_score AS "leadScore", source, created_at AS "submissionDate"
    FROM leads
    ORDER BY created_at DESC
    LIMIT 200;
  `;
  return await query(sql);
}

async function updateLeadStatus(leadId, newStatus) {
  const sql = `
    UPDATE leads
    SET status = $1, updated_at = NOW()
    WHERE lead_id = $2
    RETURNING id, lead_id, status;
  `;
  return await query(sql, [newStatus, leadId]);
}

module.exports = {
  query,
  saveLead,
  getAllLeads,
  updateLeadStatus
};
