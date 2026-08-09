-- AETHER STUDIO — CRM PHASE 6 MIGRATION: AUTOMATED LEAD FOLLOW-UP & EMAIL SEQUENCE SYSTEM
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

-- 1. Safely add followup_enabled column to leads table if it does not exist
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS followup_enabled BOOLEAN DEFAULT true;

-- 2. Create lead_followups table for tracking scheduled & sent follow-up sequences
CREATE TABLE IF NOT EXISTS lead_followups (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
    followup_type VARCHAR(50) NOT NULL, -- FOLLOWUP_1, FOLLOWUP_2, FOLLOWUP_3
    sequence_number INT NOT NULL DEFAULT 1,
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSING, SENT, FAILED, CANCELLED, SKIPPED
    email_subject VARCHAR(255),
    email_body TEXT,
    attempt_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_lead_sequence UNIQUE (lead_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_lead_followups_lead_id ON lead_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_status ON lead_followups(status);
CREATE INDEX IF NOT EXISTS idx_lead_followups_scheduled_at ON lead_followups(scheduled_at);
