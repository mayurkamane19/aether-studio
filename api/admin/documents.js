/**
 * SERVERLESS API ENDPOINT: /api/admin/documents
 * Secure Document Management, Storage & Version Control API for Aether Studio.
 * Protected by ADMIN_CRM_TOKEN. Performs storage key sanitization and signed download authorization.
 */

const db = require('../../lib/db');
const storage = require('../../lib/storage');

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

  // 2. GET /api/admin/documents (Fetch Document Metadata)
  if (req.method === 'GET') {
    try {
      const { leadId, projectId, visibility } = req.query || {};

      const docsRes = await db.getDocuments({ leadId, projectId, visibility });
      return res.status(200).json({
        success: true,
        documents: docsRes.rows || []
      });

    } catch (err) {
      console.error('Error in GET /api/admin/documents:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  // 3. POST /api/admin/documents (Register Metadata, Version & Downloads)
  if (req.method === 'POST') {
    try {
      const { action, name, filename, mimeType, leadId, projectId, documentId, version, visibility = 'INTERNAL' } = req.body || {};

      if (action === 'REGISTER_DOCUMENT') {
        const safeName = storage.sanitizeFilename(filename || name);
        const fileVal = storage.validateFileType(safeName, mimeType);

        if (!fileVal.valid) {
          return res.status(400).json({ success: false, error: fileVal.error });
        }

        const storageKey = storage.generateStorageKey(leadId, projectId, 'DOC', version || 'v1.0', safeName);
        const checksum = storage.calculateChecksum(safeName + Date.now());

        const docRes = await db.createDocument({
          name: name || safeName,
          category: req.body.category || 'DELIVERABLE',
          projectId,
          leadId,
          mimeType: mimeType || 'application/pdf',
          fileSize: req.body.fileSize || 1024,
          checksum,
          storageKey,
          visibility
        });

        return res.status(200).json({ success: true, document: docRes.rows ? docRes.rows[0] : null });
      }

      if (action === 'GENERATE_DOWNLOAD_LINK') {
        if (!documentId) {
          return res.status(400).json({ success: false, error: 'documentId is required.' });
        }
        const signed = storage.generateSignedDownloadToken(documentId, leadId || 'general');
        return res.status(200).json({
          success: true,
          downloadUrl: `/api/documents/download?token=${encodeURIComponent(signed.downloadToken)}`,
          expiresAt: signed.expiresAt
        });
      }

      if (action === 'REQUEST_DOCUMENT') {
        const reqRes = await db.createDocumentRequest(req.body);
        return res.status(200).json({ success: true, request: reqRes.rows ? reqRes.rows[0] : null });
      }

      return res.status(400).json({ success: false, error: 'Invalid document operation action.' });

    } catch (err) {
      console.error('Error in POST /api/admin/documents:', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
