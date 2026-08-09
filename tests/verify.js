const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const filesToCheck = [
  'index.html',
  'blog/index.html',
  'blog/ai-modern-web-development/index.html',
  'blog/website-performance-seo/index.html',
  'blog/ai-automation-small-businesses/index.html',
  'blog/high-converting-business-website/index.html',
  'blog/modern-ui-ux-trends-2026/index.html'
];

let errors = 0;
let passes = 0;

// Secret Key Patterns to guard against
const secretPatterns = [
  /re_[0-9a-zA-Z]{20,}/,            // Resend live key pattern
  /sk_live_[0-9a-zA-Z]{20,}/,       // Stripe live key pattern
  /SG\.[0-9a-zA-Z._-]{30,}/,        // Sendgrid live key pattern
  /postgresql:\/\/[^:]+:[^@]+@/     // Real DB connection string with password
];

filesToCheck.forEach(file => {
  const filePath = path.resolve(rootDir, file);
  if (!fs.existsSync(filePath)) {
    console.error('❌ MISSING FILE:', file);
    errors++;
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // 1. Check GA4 ID
  if (content.includes('G-B246FD27DH')) passes++; else { console.error('❌ GA4 missing in:', file); errors++; }

  // 2. Check GSC tag
  if (content.includes('iFXQsPcB0YgUxkq2UGpohhUhgYj3qs1s_iGg4sPKwRU')) passes++; else { console.error('❌ GSC missing in:', file); errors++; }

  // 3. Check Canonical tag
  if (content.includes('<link rel="canonical" href="https://aetherstudio.com/')) passes++; else { console.error('❌ Canonical missing in:', file); errors++; }

  // 4. Check for Hardcoded Secrets
  let hasSecret = false;
  secretPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      console.error(`❌ HARDCODED SECRET PATTERN MATCHED IN ${file}:`, pattern);
      hasSecret = true;
      errors++;
    }
  });
  if (!hasSecret) passes++;
});

// Check critical backend files existence
const criticalBackendFiles = [
  'api/contact.js',
  'api/health.js',
  'api/proposal.js',
  'api/client.js',
  'lib/db.js',
  'vercel.json',
  'portal.html'
];

criticalBackendFiles.forEach(f => {
  const fp = path.resolve(rootDir, f);
  if (fs.existsSync(fp)) {
    passes++;
  } else {
    console.error('❌ CRITICAL FILE MISSING:', f);
    errors++;
  }
});

console.log('==========================================');
console.log('CLIENT-READY AGENCY PLATFORM QA RESULTS:');
console.log(`PASSED CHECKS: ${passes}`);
console.log(`FAILED CHECKS: ${errors}`);
console.log('==========================================');

if (errors > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL CLIENT-READY PLATFORM QA CHECKS PASSED WITH 0 ERRORS!');
  process.exit(0);
}
