/**
 * AETHER STUDIO — PRODUCTION ENVIRONMENT CONFIGURATION HELPER
 * Controls domain canonicals, API endpoints, and environmental settings.
 */

const CONFIG = {
  // Production Canonical Base Domain
  SITE_URL: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? window.location.origin
    : 'https://aetherstudio.com',

  // Google Analytics 4 Measurement ID (PRESERVED)
  GA4_MEASUREMENT_ID: 'G-B246FD27DH',

  // Google Search Console Verification Meta Tag (PRESERVED)
  GSC_VERIFICATION_TAG: 'iFXQsPcB0YgUxkq2UGpohhUhgYj3qs1s_iGg4sPKwRU',

  // API Endpoints for Serverless Handlers
  ENDPOINTS: {
    CONTACT: '/api/contact',
    INQUIRY: '/api/inquiry',
    BOOKING: '/api/booking'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.AETHER_CONFIG = CONFIG;
}
