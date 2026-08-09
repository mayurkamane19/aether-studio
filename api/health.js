/**
 * SERVERLESS API ENDPOINT: /api/health
 * Public Infrastructure Health & Operational Readiness Endpoint for Aether Studio.
 * Evaluates database connectivity and service availability safely without exposing secrets.
 */

const db = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const dbTest = await db.query('SELECT 1 AS alive;');
    const dbStatus = dbTest.success && dbTest.rows ? 'healthy' : 'degraded';

    return res.status(200).json({
      status: 'ok',
      service: 'Aether Studio Production Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: dbStatus
    });

  } catch (err) {
    return res.status(200).json({
      status: 'degraded',
      service: 'Aether Studio Production Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'degraded'
    });
  }
};
