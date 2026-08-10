/**
 * SERVERLESS API ENDPOINT: /api/admin/finance
 * Finance, Billing & Revenue Operations API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Manages Invoices, Payments, Expenses, and Receivables.
 */

const db = require('../../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Admin Token Check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  // 2. GET /api/admin/finance (Summary, Invoices, Expenses)
  if (req.method === 'GET') {
    try {
      const { leadId, projectId } = req.query || {};

      let invoices = [];
      if (leadId) {
        invoices = (await db.getInvoicesByLead(String(leadId).trim())).rows || [];
      } else {
        const invRes = await db.query(`SELECT * FROM invoices ORDER BY created_at DESC LIMIT 50;`);
        invoices = invRes.rows || [];
      }

      const expensesRes = await db.getExpenses(projectId ? String(projectId).trim() : null);
      const analytics = await db.getCRMAnalytics();

      return res.status(200).json({
        success: true,
        invoices,
        expenses: expensesRes.rows || [],
        analytics
      });

    } catch (err) {
      console.error('Error in GET /api/admin/finance:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. POST /api/admin/finance (Actions)
  if (req.method === 'POST') {
    try {
      const { action = 'CREATE_INVOICE', invoiceId, amount, provider, reference, paymentMethod } = req.body || {};

      if (action === 'CREATE_INVOICE') {
        const invRes = await db.createInvoice(req.body);
        return res.status(200).json(invRes);
      }

      if (action === 'RECORD_PAYMENT') {
        if (!invoiceId || !amount) {
          return res.status(400).json({ success: false, error: 'invoiceId and amount are required.' });
        }
        const payRes = await db.recordPayment({ invoiceId, amount, provider, reference, paymentMethod });
        return res.status(200).json({ success: true, payment: payRes });
      }

      if (action === 'CREATE_EXPENSE') {
        const expRes = await db.createExpense(req.body);
        return res.status(200).json({ success: true, expense: expRes.rows ? expRes.rows[0] : null });
      }

      if (action === 'CREATE_PAYMENT_PLAN') {
        const planRes = await db.createPaymentPlan(req.body);
        return res.status(200).json({ success: true, paymentPlan: planRes.rows ? planRes.rows[0] : null });
      }

      return res.status(400).json({ success: false, error: 'Invalid finance action.' });

    } catch (err) {
      console.error('Error in POST /api/admin/finance:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
