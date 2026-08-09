/**
 * SERVERLESS API ENDPOINT: /api/admin/invoices
 * Admin Invoicing, Financial Management & Payment Verification API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Performs decimal-safe calculations and records verified transactions.
 */

const db = require('../../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Admin Token Check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  // 1. GET /api/admin/invoices?leadId=...
  if (req.method === 'GET') {
    try {
      const { leadId } = req.query || {};
      if (!leadId) {
        return res.status(400).json({ success: false, error: 'leadId is required.' });
      }

      const invoicesRes = await db.getInvoicesByLead(String(leadId).trim());
      return res.status(200).json({
        success: true,
        invoices: invoicesRes.rows || []
      });

    } catch (err) {
      console.error('Error in GET /api/admin/invoices:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 2. POST /api/admin/invoices
  if (req.method === 'POST') {
    try {
      const { action = 'CREATE', leadId, invoiceId, amount, provider = 'MANUAL', reference = '' } = req.body || {};

      if (action === 'PAYMENT') {
        if (!invoiceId || !amount) {
          return res.status(400).json({ success: false, error: 'invoiceId and amount are required.' });
        }

        const payRes = await db.recordPayment({
          invoiceId,
          amount,
          provider,
          reference: reference || `PAY-AS-2026-${Date.now()}`
        });

        if (!payRes.success) {
          return res.status(400).json({ success: false, error: payRes.error || 'Payment recording failed.' });
        }

        return res.status(200).json({
          success: true,
          message: 'Payment successfully recorded and verified.'
        });
      }

      // Default: CREATE Invoice
      if (!leadId) {
        return res.status(400).json({ success: false, error: 'leadId is required to create an invoice.' });
      }

      const invResult = await db.createInvoice(req.body);

      if (!invResult.success) {
        return res.status(400).json({ success: false, error: 'Failed to create invoice.' });
      }

      return res.status(200).json({
        success: true,
        invoiceNumber: invResult.invoiceNumber,
        totalAmount: invResult.totalAmount,
        message: `Invoice ${invResult.invoiceNumber} created successfully.`
      });

    } catch (err) {
      console.error('Error in POST /api/admin/invoices:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
