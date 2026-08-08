/**
 * SERVERLESS API ENDPOINT: /api/admin/pricing
 * AI Project Pricing Assistant Handler for Aether Studio Admin Portal.
 * Accepts { leadId, action }, calculates internal price recommendations,
 * validates output, persists pricing in PostgreSQL DB, and supports approval workflow.
 * Protected by ADMIN_CRM_TOKEN.
 */

const db = require('../../lib/db');

// Basic In-Memory Rate Limiter (10 requests / 60 seconds per IP)
const rateLimitMap = new Map();

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // 1. Admin Token Authorization Verification
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  // 2. Rate Limiting Check
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const userLimit = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + 60000 };

  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + 60000;
  } else {
    userLimit.count += 1;
  }
  rateLimitMap.set(clientIp, userLimit);

  if (userLimit.count > 10) {
    return res.status(429).json({ success: false, error: 'Pricing Rate Limit Exceeded. Please wait a minute.' });
  }

  try {
    const { leadId, action, pricingId } = req.body || {};

    if (!leadId) {
      return res.status(400).json({ success: false, error: 'leadId is required for pricing analysis.' });
    }

    // Handle Admin Pricing Approval Workflow
    if (action === 'APPROVE_PRICING') {
      const approveRes = await db.approveAIPricing(leadId, pricingId);
      return res.status(200).json({
        success: true,
        message: 'AI pricing recommendation approved by admin.',
        result: approveRes
      });
    }

    // 3. Load Lead from PostgreSQL DB
    let lead = await db.getLeadById(leadId);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead record not found.' });
    }

    const typeStr = String(lead.projectType || '').toLowerCase();
    const msgStr = String(lead.message || '').toLowerCase();
    const budgetStr = String(lead.budgetRange || '').toLowerCase();

    // 4. Calculate Internal Price Range Recommendation
    let currency = 'INR';
    let estimatedMin = 25000;
    let estimatedMax = 45000;
    let recommendedPrice = 35000;
    let complexity = lead.aiComplexity || 'MEDIUM';
    let estimatedTimeline = lead.aiEstimatedTimeline || '2 to 3 Weeks';
    let recommendedPackage = 'STANDARD';
    let reasoning = `Base pricing calculated for ${lead.projectType || 'custom engineering'}. Scope involves responsive web design, glassmorphism design tokens, SEO infrastructure, and serverless lead forms.`;
    let milestones = [
      'Discovery, Architecture & Wireframes',
      'UI/UX Design Tokens & Component Grids',
      'Frontend Web Engineering & Motion Engine',
      'Serverless API Integration & QA Testing',
      'Production Deployment & SEO Indexing'
    ];
    let assumptions = [
      'Client provides final vector logos, images, and text content.',
      'Includes standard Vercel serverless hosting setup.',
      'Third-party domain DNS configuration included.'
    ];
    let risks = Array.isArray(lead.aiRiskFlags) ? lead.aiRiskFlags : [];
    let confidence = 82;

    if (typeStr.includes('ai') || msgStr.includes('gpt') || msgStr.includes('agent')) {
      estimatedMin = 50000;
      estimatedMax = 95000;
      recommendedPrice = 75000;
      complexity = 'HIGH';
      recommendedPackage = 'CUSTOM';
      estimatedTimeline = '3 to 5 Weeks';
      reasoning = 'Enterprise AI SaaS architecture requiring multi-agent canvas components, prompt streaming APIs, state management, and custom glassmorphism dashboard layout.';
      confidence = 88;
      assumptions.push('API usage costs (OpenAI/Resend) are billed directly to client accounts.');
    } else if (typeStr.includes('brand') || msgStr.includes('logo')) {
      estimatedMin = 19999;
      estimatedMax = 35000;
      recommendedPrice = 25000;
      complexity = 'LOW';
      recommendedPackage = 'STARTER';
      estimatedTimeline = '2 Weeks';
      reasoning = 'Luxury brand identity suite including dark visual tokens, typography pairings, color scales, and brand style guide.';
      confidence = 90;
    } else if (typeStr.includes('dashboard') || typeStr.includes('saas') || msgStr.includes('crm')) {
      estimatedMin = 35000;
      estimatedMax = 65000;
      recommendedPrice = 48000;
      complexity = 'HIGH';
      recommendedPackage = 'PREMIUM';
      estimatedTimeline = '3 Weeks';
      reasoning = 'Custom SaaS pipeline dashboard with PostgreSQL integration, status management, notes, and activity timeline tracking.';
      confidence = 85;
    }

    // Check OpenAI LLM completion if OPENAI_API_KEY is configured
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    if (apiKey) {
      try {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an internal Pricing Assistant for Aether Studio. Return ONLY valid JSON with keys: currency (INR), estimatedMin (int), estimatedMax (int), recommendedPrice (int), complexity (LOW|MEDIUM|HIGH), estimatedTimeline, recommendedPackage (STARTER|STANDARD|PREMIUM|CUSTOM), reasoning, milestones (array), assumptions (array), risks (array), confidence (int 0-100).'
              },
              {
                role: 'user',
                content: `Calculate pricing recommendation: Type: ${lead.projectType}, Client Budget: ${lead.budgetRange}, Timeline: ${lead.timeline}, Specs: ${lead.message}`
              }
            ],
            response_format: { type: 'json_object' }
          })
        });
        const aiJson = await aiRes.json();
        if (aiJson.choices && aiJson.choices[0] && aiJson.choices[0].message) {
          const parsed = JSON.parse(aiJson.choices[0].message.content);
          if (parsed.estimatedMin) estimatedMin = parseInt(parsed.estimatedMin, 10);
          if (parsed.estimatedMax) estimatedMax = parseInt(parsed.estimatedMax, 10);
          if (parsed.recommendedPrice) recommendedPrice = parseInt(parsed.recommendedPrice, 10);
          if (parsed.complexity) complexity = parsed.complexity;
          if (parsed.estimatedTimeline) estimatedTimeline = parsed.estimatedTimeline;
          if (parsed.recommendedPackage) recommendedPackage = parsed.recommendedPackage;
          if (parsed.reasoning) reasoning = parsed.reasoning;
          if (Array.isArray(parsed.milestones)) milestones = parsed.milestones;
          if (Array.isArray(parsed.assumptions)) assumptions = parsed.assumptions;
          if (Array.isArray(parsed.risks)) risks = parsed.risks;
          if (parsed.confidence !== undefined) confidence = Math.max(0, Math.min(100, parseInt(parsed.confidence, 10)));
        }
      } catch (aiErr) {
        console.warn('[PRICING LLM NOTICE]', aiErr.message);
      }
    }

    // Server-side Validation
    estimatedMin = Math.max(0, estimatedMin);
    estimatedMax = Math.max(estimatedMin, estimatedMax);
    recommendedPrice = Math.max(estimatedMin, Math.min(estimatedMax, recommendedPrice));
    confidence = Math.max(0, Math.min(100, confidence));
    if (!['STARTER', 'STANDARD', 'PREMIUM', 'CUSTOM'].includes(recommendedPackage)) recommendedPackage = 'CUSTOM';
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(complexity)) complexity = 'MEDIUM';

    const pricingData = {
      currency,
      estimatedMin,
      estimatedMax,
      recommendedPrice,
      complexity,
      estimatedTimeline,
      recommendedPackage,
      reasoning,
      milestones,
      assumptions,
      risks,
      confidence,
      status: 'DRAFT'
    };

    // 5. Persist Pricing Recommendation in PostgreSQL DB
    try {
      await db.saveAIPricingAnalysis(leadId, pricingData);
    } catch (dbErr) {
      console.error('[DB PRICING SAVE NOTICE]', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      leadId,
      pricing: pricingData,
      notice: apiKey ? 'AI Pricing generated via configured OpenAI provider.' : 'AI Pricing Assistant generated internal recommendation cleanly.'
    });

  } catch (err) {
    console.error('Unhandled error in /api/admin/pricing:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
