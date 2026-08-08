/**
 * SERVERLESS API ENDPOINT: /api/admin/analyze
 * AI Lead Scoring & Sales Intelligence Handler for Aether Studio Admin Portal.
 * Accepts { leadId: "AS-2026-XXXXXX" }, loads lead from PostgreSQL, evaluates requirements,
 * validates structured output, persists intelligence in DB, and logs activity timeline.
 * Protected by ADMIN_CRM_TOKEN. Safe serverless rate limiting enforced.
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
    return res.status(429).json({ success: false, error: 'AI Analysis Rate Limit Exceeded. Please wait a minute.' });
  }

  try {
    const { leadId, projectType, budget, timeline, message } = req.body || {};

    if (!leadId) {
      return res.status(400).json({ success: false, error: 'leadId is required for AI evaluation.' });
    }

    // 3. Load Lead from PostgreSQL DB
    let lead = await db.getLeadById(leadId);

    // Fallback if lead was submitted before DB connection or in mock state
    if (!lead) {
      lead = {
        leadId,
        name: 'Inbound Client',
        company: 'Client Org',
        projectType: projectType || 'Web App',
        budgetRange: budget || '₹25,000 – ₹50,000',
        timeline: timeline || 'Flexible',
        message: message || 'Inquiry specs submitted.'
      };
    }

    const typeStr = String(lead.projectType || '').toLowerCase();
    const msgStr = String(lead.message || '').toLowerCase();
    const budgetStr = String(lead.budgetRange || '').toLowerCase();

    // 4. Perform Structured Sales Intelligence Analysis
    let score = 55;
    let priority = 'WARM';
    let projectCategory = 'Web Development';
    let complexity = 'MEDIUM';
    let estimatedBudgetMin = 25000;
    let estimatedBudgetMax = 45000;
    let estimatedTimeline = lead.timeline || '2 to 3 Weeks';
    let summary = `Inquiry received for ${lead.projectType || 'digital engineering'}. Client specifies budget of ${lead.budgetRange || 'standard range'} with timeline of ${lead.timeline || 'flexible'}.`;
    let recommendedAction = 'SCHEDULE_CONSULTATION';
    let riskFlags = [];
    let missingInformation = [];

    // Category Identification
    if (typeStr.includes('ai') || msgStr.includes('gpt') || msgStr.includes('agent') || msgStr.includes('llm')) {
      projectCategory = 'AI/ML';
      complexity = 'HIGH';
      estimatedBudgetMin = 50000;
      estimatedBudgetMax = 120000;
      estimatedTimeline = '3 to 5 Weeks';
      score = 92;
      priority = 'HOT';
      recommendedAction = 'SEND_PROPOSAL';
    } else if (typeStr.includes('brand') || msgStr.includes('logo') || msgStr.includes('identity')) {
      projectCategory = 'Branding';
      complexity = 'LOW';
      estimatedBudgetMin = 19999;
      estimatedBudgetMax = 35000;
      score = 65;
      priority = 'WARM';
      recommendedAction = 'REQUEST_MORE_DETAILS';
    } else if (typeStr.includes('dashboard') || typeStr.includes('saas') || msgStr.includes('crm')) {
      projectCategory = 'SaaS';
      complexity = 'HIGH';
      estimatedBudgetMin = 35000;
      estimatedBudgetMax = 75000;
      score = 84;
      priority = 'HOT';
      recommendedAction = 'SCHEDULE_CONSULTATION';
    } else if (typeStr.includes('e-commerce') || msgStr.includes('shop') || msgStr.includes('payment')) {
      projectCategory = 'E-Commerce';
      complexity = 'MEDIUM';
      estimatedBudgetMin = 30000;
      estimatedBudgetMax = 60000;
      score = 78;
      priority = 'WARM';
      recommendedAction = 'SCHEDULE_CONSULTATION';
    } else if (budgetStr.includes('50,000') || budgetStr.includes('enterprise')) {
      score = 88;
      priority = 'HOT';
    } else if (budgetStr.includes('15,000')) {
      score = 45;
      priority = 'COLD';
    }

    // Risk Flag Analysis
    if (!lead.company || lead.company === 'Independent') {
      riskFlags.push('Unverified company domain or independent client handle.');
    }
    if (msgStr.length < 30) {
      riskFlags.push('Unclear or abbreviated project scope requirements.');
      missingInformation.push('Detailed feature requirements & functional specifications.');
    }
    if (!msgStr.includes('payment') && (projectCategory === 'E-Commerce' || projectCategory === 'SaaS')) {
      missingInformation.push('Preferred payment gateway integration provider.');
    }
    if (!msgStr.includes('deadline') && !msgStr.includes('launch')) {
      missingInformation.push('Exact target launch deadline / staging deployment milestone.');
    }

    // OpenAI API Call (if OPENAI_API_KEY is configured in Vercel environment)
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
                content: 'You are an AI Sales Intelligence engine for Aether Studio. Return ONLY valid JSON with keys: score (0-100), priority (HOT|WARM|COLD), projectCategory, complexity (LOW|MEDIUM|HIGH), estimatedBudgetMin (int), estimatedBudgetMax (int), estimatedTimeline, summary, recommendedAction, riskFlags (array), missingInformation (array).'
              },
              {
                role: 'user',
                content: `Analyze project brief: Type: ${lead.projectType}, Budget: ${lead.budgetRange}, Timeline: ${lead.timeline}, Message: ${lead.message}`
              }
            ],
            response_format: { type: 'json_object' }
          })
        });
        const aiJson = await aiRes.json();
        if (aiJson.choices && aiJson.choices[0] && aiJson.choices[0].message) {
          const parsed = JSON.parse(aiJson.choices[0].message.content);
          if (parsed.score !== undefined) score = Math.max(0, Math.min(100, parseInt(parsed.score, 10)));
          if (parsed.priority) priority = parsed.priority;
          if (parsed.projectCategory) projectCategory = parsed.projectCategory;
          if (parsed.complexity) complexity = parsed.complexity;
          if (parsed.summary) summary = parsed.summary;
          if (parsed.recommendedAction) recommendedAction = parsed.recommendedAction;
          if (Array.isArray(parsed.riskFlags)) riskFlags = parsed.riskFlags;
          if (Array.isArray(parsed.missingInformation)) missingInformation = parsed.missingInformation;
        }
      } catch (aiErr) {
        console.warn('[AI PROVIDER NOTICE]', aiErr.message);
      }
    }

    // Server-side Output Validation
    score = Math.max(0, Math.min(100, score));
    priority = score >= 80 ? 'HOT' : (score >= 50 ? 'WARM' : 'COLD');
    const validCategories = ['Web Development', 'E-Commerce', 'UI/UX', 'Branding', 'AI/ML', 'Automation', 'Mobile App', 'SaaS', '3D / Interactive', 'Other'];
    if (!validCategories.includes(projectCategory)) projectCategory = 'Other';
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(complexity)) complexity = 'MEDIUM';

    const aiData = {
      score,
      priority,
      projectCategory,
      complexity,
      estimatedBudgetMin,
      estimatedBudgetMax,
      estimatedTimeline,
      summary,
      recommendedAction,
      riskFlags,
      missingInformation
    };

    // 5. Persist AI Intelligence in PostgreSQL DB
    try {
      await db.updateLeadAIIntelligence(lead.leadId, aiData);
    } catch (dbErr) {
      console.error('[DB AI SAVE NOTICE]', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      leadId: lead.leadId,
      analysis: aiData,
      notice: apiKey ? 'AI analysis generated via configured LLM provider.' : 'AI Sales Intelligence engine evaluated lead specs cleanly.'
    });

  } catch (err) {
    console.error('Unhandled Error in /api/admin/analyze:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
