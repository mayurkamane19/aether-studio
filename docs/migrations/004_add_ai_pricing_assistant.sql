-- AETHER STUDIO — CRM PHASE 4 MIGRATION: AI PROJECT PRICING ASSISTANT
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

-- 1. Safely add AI Pricing columns to leads table if they do not exist
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS ai_recommended_price INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_price_min INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_price_max INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_pricing_confidence INT DEFAULT 80,
    ADD COLUMN IF NOT EXISTS ai_recommended_package VARCHAR(50) DEFAULT 'CUSTOM',
    ADD COLUMN IF NOT EXISTS ai_pricing_status VARCHAR(50) DEFAULT 'DRAFT';

-- 2. Create lead_pricing_analysis table for historical AI pricing analysis & approval tracking
CREATE TABLE IF NOT EXISTS lead_pricing_analysis (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'INR',
    estimated_min INT NOT NULL,
    estimated_max INT NOT NULL,
    recommended_price INT NOT NULL,
    complexity VARCHAR(50) DEFAULT 'MEDIUM',
    estimated_timeline VARCHAR(100) DEFAULT '2-3 Weeks',
    recommended_package VARCHAR(50) DEFAULT 'CUSTOM',
    reasoning TEXT,
    milestones JSONB DEFAULT '[]'::jsonb,
    assumptions JSONB DEFAULT '[]'::jsonb,
    risks JSONB DEFAULT '[]'::jsonb,
    confidence INT DEFAULT 80,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, APPROVED, SUPERSEDED
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_pricing_analysis_lead_id ON lead_pricing_analysis(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_pricing_analysis_created_at ON lead_pricing_analysis(created_at DESC);
