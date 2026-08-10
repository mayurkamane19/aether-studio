/**
 * SERVERLESS API ENDPOINT: /api/admin/workflows
 * Automation & Workflow Engine API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Manages workflow definitions, events, and dry-run testing.
 */

const db = require('../../lib/db');
const workflows = require('../../lib/workflows');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Admin Token Verification
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  // 2. GET /api/admin/workflows (List Definitions & Executions)
  if (req.method === 'GET') {
    try {
      const { triggerEvent } = req.query || {};

      const wfRes = await db.getWorkflowDefinitions(triggerEvent);
      return res.status(200).json({
        success: true,
        workflows: wfRes.rows || []
      });

    } catch (err) {
      console.error('Error in GET /api/admin/workflows:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. POST /api/admin/workflows (Create Workflow, Emit Event, Test)
  if (req.method === 'POST') {
    try {
      const { action, eventType, entityType, entityId, payload } = req.body || {};

      if (action === 'CREATE_WORKFLOW') {
        const createRes = await db.createWorkflowDefinition(req.body);
        return res.status(200).json({ success: true, workflow: createRes.rows ? createRes.rows[0] : null });
      }

      if (action === 'EMIT_EVENT') {
        if (!eventType || !entityType || !entityId) {
          return res.status(400).json({ success: false, error: 'eventType, entityType, and entityId are required.' });
        }
        const emitRes = await workflows.emitEvent(eventType, entityType, entityId, payload || {});
        return res.status(200).json(emitRes);
      }

      if (action === 'TEST_WORKFLOW') {
        // Safe dry-run evaluation
        const conditions = Array.isArray(req.body.conditions) ? req.body.conditions : [];
        const passed = conditions.every(c => workflows.evaluateCondition(c, payload || {}));
        return res.status(200).json({
          success: true,
          dryRun: true,
          allConditionsPassed: passed,
          notice: passed ? 'Workflow conditions satisfied in dry-run mode.' : 'Workflow conditions not satisfied.'
        });
      }

      return res.status(400).json({ success: false, error: 'Invalid workflow operation action.' });

    } catch (err) {
      console.error('Error in POST /api/admin/workflows:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
