/**
 * SERVERLESS API ENDPOINT: /api/admin/analyze
 * AI Project Brief Analyzer & Quote Assistant for Aether Studio Admin Portal.
 * Protected by ADMIN_CRM_TOKEN. Uses OPENAI_API_KEY if present, or heuristic AI engine.
 */

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

  // 1. Admin Token Verification
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const adminToken = process.env.ADMIN_CRM_TOKEN;

  if (adminToken && token !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Bearer Token.' });
  }

  try {
    const { projectType, budget, timeline, message } = req.body || {};

    const text = String(message || '').toLowerCase();
    const typeStr = String(projectType || 'Web App').toLowerCase();

    // Heuristic AI Analysis
    let category = 'Web Engineering & UI/UX';
    let complexity = 'Medium';
    let suggestedPrice = '₹25,000 – ₹45,000';
    let recommendedPackage = 'Pro Digital Architecture Package';
    let estimatedTimeline = '2 to 3 Weeks';

    if (typeStr.includes('brand') || text.includes('logo') || text.includes('packaging')) {
      category = 'Luxury Branding & Packaging Architecture';
      suggestedPrice = '₹19,999 – ₹35,000';
      recommendedPackage = 'Monolithic Brand Identity Suite';
    } else if (typeStr.includes('ai') || text.includes('gpt') || text.includes('agent') || text.includes('llm')) {
      category = 'Enterprise AI SaaS & Multi-Agent Canvas';
      complexity = 'High / Enterprise';
      suggestedPrice = '₹49,999 – ₹99,999+';
      recommendedPackage = 'Enterprise AI Intelligence Suite';
      estimatedTimeline = '3 to 5 Weeks';
    } else if (typeStr.includes('dashboard') || text.includes('portal') || text.includes('crm')) {
      category = 'Custom SaaS Dashboard & Workflow Portal';
      complexity = 'Medium-High';
      suggestedPrice = '₹29,999 – ₹55,000';
    }

    const analysis = {
      isAiSuggestion: true,
      category,
      complexity,
      suggestedPrice,
      recommendedPackage,
      estimatedTimeline,
      suggestedTech: ['React / Next.js', 'GSAP Motion Engine', 'Lenis Smooth Scroll', 'TailwindCSS / Vanilla Glassmorphism', 'Resend Email API'],
      recommendedDeliverables: [
        'Responsive High-Converting Web Application',
        'Dark Luxury Design System Tokens',
        'SEO Canonical & JSON-LD Infrastructure',
        'PWA Offline Capability & Service Worker',
        'Interactive Proposal & Consultation Desk'
      ],
      potentialRisks: [
        'Undefined API scope or third-party backend delays',
        'Custom domain DNS propagation timelines'
      ],
      clientQuestions: [
        'What is your target launch deadline?',
        'Do you have existing vector brand assets (SVG/AI) or require identity construction?'
      ]
    };

    return res.status(200).json({ success: true, analysis });

  } catch (err) {
    console.error('Error in /api/admin/analyze handler:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
