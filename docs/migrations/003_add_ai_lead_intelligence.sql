-- AETHER STUDIO — CRM PHASE 3 MIGRATION: AI LEAD SCORING & SALES INTELLIGENCE
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

-- 1. Safely add AI Intelligence columns to leads table if they do not exist
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS lead_priority VARCHAR(50) DEFAULT 'NOT SCORED',
    ADD COLUMN IF NOT EXISTS ai_summary TEXT,
    ADD COLUMN IF NOT EXISTS ai_project_category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ai_complexity VARCHAR(50),
    ADD COLUMN IF NOT EXISTS ai_estimated_budget_min INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_estimated_budget_max INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_estimated_timeline VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ai_recommended_action VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ai_risk_flags JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_missing_information JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- 2. Create lead_ai_analysis table for historical AI evaluation tracking
CREATE TABLE IF NOT EXISTS lead_ai_analysis (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
    score INT NOT NULL,
    priority VARCHAR(50) NOT NULL,
    project_category VARCHAR(100),
    complexity VARCHAR(50),
    estimated_budget_min INT DEFAULT 0,
    estimated_budget_max INT DEFAULT 0,
    estimated_timeline VARCHAR(100),
    summary TEXT,
    recommended_action VARCHAR(100),
    risk_flags JSONB DEFAULT '[]'::jsonb,
    missing_information JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_ai_analysis_lead_id ON lead_ai_analysis(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_ai_analysis_created_at ON lead_ai_analysis(created_at DESC);
