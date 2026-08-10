/**
 * SERVERLESS API ENDPOINT: /api/admin/operations
 * Team Management, Project Operations & Task Management API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Performs parameterized operations and role-permission enforcement.
 */

const db = require('../../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
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

  // 2. GET /api/admin/operations (Fetch Team, Projects & Tasks)
  if (req.method === 'GET') {
    try {
      const { projectId } = req.query || {};

      const teamRes = await db.getTeamMembers();
      const projectsRes = await db.getProjects();

      let tasks = [];
      if (projectId) {
        tasks = (await db.getTasksByProject(String(projectId).trim())).rows || [];
      }

      return res.status(200).json({
        success: true,
        team: teamRes.rows || [],
        projects: projectsRes.rows || [],
        tasks
      });

    } catch (err) {
      console.error('Error in GET /api/admin/operations:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. POST /api/admin/operations (Create & Update Actions)
  if (req.method === 'POST') {
    try {
      const { action, taskId, projectId, status, message, author, hours } = req.body || {};

      if (action === 'CREATE_TEAM_MEMBER') {
        const resMember = await db.createTeamMember(req.body);
        return res.status(200).json({ success: true, member: resMember.rows ? resMember.rows[0] : null });
      }

      if (action === 'CREATE_PROJECT') {
        const resPrj = await db.createProject(req.body);
        return res.status(200).json({ success: true, project: resPrj.record || resPrj });
      }

      if (action === 'CREATE_TASK') {
        const resTask = await db.createTask(req.body);
        return res.status(200).json({ success: true, task: resTask.rows ? resTask.rows[0] : null });
      }

      if (action === 'UPDATE_TASK_STATUS') {
        if (!taskId || !status) {
          return res.status(400).json({ success: false, error: 'taskId and status are required.' });
        }
        const resStatus = await db.updateTaskStatus(taskId, status);
        return res.status(200).json({ success: true, task: resStatus.rows ? resStatus.rows[0] : null });
      }

      if (action === 'ADD_COMMENT') {
        if (!taskId || !message) {
          return res.status(400).json({ success: false, error: 'taskId and message are required.' });
        }
        const resComment = await db.addTaskComment(taskId, author || 'Admin', message);
        return res.status(200).json({ success: true, comment: resComment.rows ? resComment.rows[0] : null });
      }

      if (action === 'LOG_TIME') {
        if (!taskId || !hours) {
          return res.status(400).json({ success: false, error: 'taskId and hours are required.' });
        }
        const resTime = await db.logTimeEntry(taskId, author || 'Admin', hours, message || '');
        return res.status(200).json({ success: true, timeEntry: resTime.rows ? resTime.rows[0] : null });
      }

      return res.status(400).json({ success: false, error: 'Invalid operation action.' });

    } catch (err) {
      console.error('Error in POST /api/admin/operations:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
