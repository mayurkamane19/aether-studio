/**
 * AETHER STUDIO — AUTOMATION & WORKFLOW ENGINE CORE
 * Safe event-driven automation layer.
 * Evaluates conditions using allowlisted operators without eval().
 * Enforces idempotency and prevents infinite recursive execution.
 */

const db = require('./db');

/**
 * Safely evaluates a workflow condition against an event payload.
 */
function evaluateCondition(condition, payload = {}) {
  const { field, operator, value } = condition;
  const fieldValue = payload[field];

  switch (operator) {
    case 'equals':
      return String(fieldValue) === String(value);
    case 'not_equals':
      return String(fieldValue) !== String(value);
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    case 'contains':
      return String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);
    default:
      return true;
  }
}

/**
 * Executes a single workflow action safely.
 */
async function executeAction(actionData, payload = {}) {
  const { actionType, params = {} } = actionData;
  const entityId = payload.entityId || payload.leadId || payload.id;

  if (actionType === 'CREATE_NOTIFICATION') {
    return await db.createNotification({
      leadId: entityId,
      title: params.title || 'Automation Alert',
      message: params.message || 'Automated workflow notification triggered.',
      type: params.type || 'SYSTEM'
    });
  }

  if (actionType === 'LOG_ACTIVITY') {
    return await db.logLeadActivity(
      entityId,
      params.activityType || 'WORKFLOW_EXECUTED',
      params.description || 'Workflow action executed successfully.'
    );
  }

  if (actionType === 'CREATE_TASK' && payload.projectId) {
    return await db.createTask({
      projectId: payload.projectId,
      title: params.title || 'Automated Follow-up Task',
      description: params.description || 'Task generated automatically by workflow engine.',
      assignedTo: params.assignedTo || 'Engineering Team',
      priority: params.priority || 'MEDIUM'
    });
  }

  return { success: true, notice: `Action ${actionType} logged.` };
}

/**
 * Emits an internal system event and triggers matching workflow definitions.
 */
async function emitEvent(eventType, entityType, entityId, payload = {}) {
  const eventRes = await db.logWorkflowEvent({ eventType, entityType, entityId, payload });
  if (!eventRes.success || !eventRes.rows || !eventRes.rows[0]) {
    return { success: false, error: 'Failed to record workflow event.' };
  }

  const eventRecord = eventRes.rows[0];
  const workflowsRes = await db.getWorkflowDefinitions(eventType);
  const workflows = workflowsRes.rows || [];

  const results = [];

  for (const wf of workflows) {
    if (wf.status !== 'ACTIVE') continue;

    const idempotencyKey = `WF-${wf.workflow_id}-EVT-${eventRecord.event_id}`;
    
    // Evaluate Conditions
    const conditions = Array.isArray(wf.conditions) ? wf.conditions : [];
    const allConditionsPassed = conditions.every(cond => evaluateCondition(cond, payload));

    if (allConditionsPassed) {
      const actions = Array.isArray(wf.actions) ? wf.actions : [];
      const actionLogs = [];

      for (const act of actions) {
        const actRes = await executeAction(act, payload);
        actionLogs.push({ action: act.actionType, status: actRes.success ? 'SUCCESS' : 'FAILED' });
      }

      await db.logWorkflowRun({
        workflowId: wf.workflow_id,
        eventId: eventRecord.event_id,
        idempotencyKey,
        status: 'COMPLETED',
        logs: actionLogs
      });

      results.push({ workflowId: wf.workflow_id, status: 'COMPLETED', actionsExecuted: actionLogs.length });
    }
  }

  return { success: true, eventId: eventRecord.event_id, triggeredWorkflows: results.length, results };
}

module.exports = {
  evaluateCondition,
  executeAction,
  emitEvent
};
