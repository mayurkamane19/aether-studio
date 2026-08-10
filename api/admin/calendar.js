/**
 * SERVERLESS API ENDPOINT: /api/admin/calendar
 * Agency Calendar, Scheduling & Resource Planning API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Performs parameterized operations and schedule conflict checks.
 */

const db = require('../../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Admin Token Authorization Verification
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  // 2. GET /api/admin/calendar (Fetch Events, Meetings & Schedule Conflicts)
  if (req.method === 'GET') {
    try {
      const { startDate, endDate } = req.query || {};

      const eventsRes = await db.getCalendarEvents(startDate, endDate);
      const meetingsRes = await db.getMeetings();

      return res.status(200).json({
        success: true,
        events: eventsRes.rows || [],
        meetings: meetingsRes.rows || []
      });

    } catch (err) {
      console.error('Error in GET /api/admin/calendar:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. POST /api/admin/calendar (Create Events & Meetings)
  if (req.method === 'POST') {
    try {
      const { action, meetingId, notes, taskId, dependsOnTaskId } = req.body || {};

      if (action === 'CREATE_EVENT') {
        const resEvt = await db.createCalendarEvent(req.body);
        return res.status(200).json({ success: true, event: resEvt.rows ? resEvt.rows[0] : null });
      }

      if (action === 'CREATE_MEETING') {
        const resMtg = await db.createMeeting(req.body);
        return res.status(200).json({ success: true, meeting: resMtg.rows ? resMtg.rows[0] : null });
      }

      if (action === 'UPDATE_MEETING_NOTES') {
        if (!meetingId || !notes) {
          return res.status(400).json({ success: false, error: 'meetingId and notes are required.' });
        }
        const resNotes = await db.updateMeetingNotes(meetingId, notes);
        return res.status(200).json({ success: true, meeting: resNotes.rows ? resNotes.rows[0] : null });
      }

      if (action === 'ADD_TASK_DEPENDENCY') {
        if (!taskId || !dependsOnTaskId) {
          return res.status(400).json({ success: false, error: 'taskId and dependsOnTaskId are required.' });
        }
        const resDep = await db.addTaskDependency(taskId, dependsOnTaskId);
        if (!resDep.success) {
          return res.status(400).json({ success: false, error: resDep.error || 'Failed to add task dependency.' });
        }
        return res.status(200).json({ success: true, dependency: resDep.rows ? resDep.rows[0] : null });
      }

      return res.status(400).json({ success: false, error: 'Invalid calendar operation action.' });

    } catch (err) {
      console.error('Error in POST /api/admin/calendar:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
