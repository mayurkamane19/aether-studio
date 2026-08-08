-- AETHER STUDIO — CRM PHASE 2 MIGRATION: LEAD NOTES & ACTIVITY TIMELINE
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

-- 1. Create lead_notes table for internal admin notes
CREATE TABLE IF NOT EXISTS lead_notes (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);

-- 2. Create lead_activity table for audit trail & CRM activity timeline
CREATE TABLE IF NOT EXISTS lead_activity (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- LEAD_CREATED, STATUS_CHANGED, NOTE_ADDED, PROPOSAL_CREATED, PROPOSAL_SENT, FOLLOWUP_SENT
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_activity_lead_id ON lead_activity(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_created_at ON lead_activity(created_at DESC);
