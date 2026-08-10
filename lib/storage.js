/**
 * AETHER STUDIO — SECURE STORAGE ABSTRACTION ENGINE
 * Server-side storage abstraction for document uploads, path sanitization,
 * MIME type verification, SHA-256 checksum generation, and short-lived download authorization.
 * Zero private storage credentials exposed to frontend.
 */

const crypto = require('crypto');
const path = require('path');

// Safe Allowed MIME Types
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain'
]);

// Strictly Blocked Executable Extensions
const PROHIBITED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.ps1', '.sh', '.dll', '.scr', '.msi',
  '.php', '.js', '.vbs', '.py', '.com', '.jar', '.vbe', '.jse'
]);

/**
 * Sanitizes a filename to prevent Path Traversal and Command Injection attacks.
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_document';
  }
  // Strip path separators, null bytes, and control characters
  let safeName = path.basename(filename).replace(/[\0\x00-\x1F\x7F<>:"/\\|?*]/g, '');
  safeName = safeName.replace(/\.\./g, '').trim();
  return safeName || 'unnamed_document';
}

/**
 * Validates file extension and MIME type.
 */
function validateFileType(filename, mimeType) {
  const ext = path.extname(filename).toLowerCase();

  if (PROHIBITED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Security Alert: Prohibited file extension (${ext}) detected.` };
  }

  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
    return { valid: false, error: `Unsupported MIME type (${mimeType}). Please upload PDF, images, Word, Excel, CSV, or text documents.` };
  }

  return { valid: true };
}

/**
 * Generates a structured server-side storage key.
 * Pattern: clients/{leadId}/projects/{projectId}/documents/{documentId}/{version}/{filename}
 */
function generateStorageKey(leadId = 'general', projectId = 'default', documentId, version = 'v1.0', filename) {
  const safeLead = String(leadId).replace(/[^a-zA-Z0-9_-]/g, '');
  const safeProj = String(projectId).replace(/[^a-zA-Z0-9_-]/g, '');
  const safeDoc = String(documentId).replace(/[^a-zA-Z0-9_-]/g, '');
  const safeVer = String(version).replace(/[^a-zA-Z0-9._-]/g, '');
  const safeName = sanitizeFilename(filename);

  return `clients/${safeLead}/projects/${safeProj}/documents/${safeDoc}/${safeVer}/${safeName}`;
}

/**
 * Calculates SHA-256 Checksum for content.
 */
function calculateChecksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generates a short-lived download verification token (expires in 15 minutes).
 */
function generateSignedDownloadToken(documentId, leadId, expiresInMinutes = 15) {
  const secret = process.env.ADMIN_CRM_TOKEN || 'aether-studio-secure-download-secret';
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const payload = `${documentId}:${leadId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return {
    downloadToken: `${payload}:${hmac}`,
    expiresAt: new Date(expiresAt).toISOString()
  };
}

module.exports = {
  sanitizeFilename,
  validateFileType,
  generateStorageKey,
  calculateChecksum,
  generateSignedDownloadToken
};
