-- AETHER STUDIO — CRM PHASE 5 MIGRATION: PROFESSIONAL PROPOSAL MANAGEMENT
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    proposal_id VARCHAR(100) UNIQUE NOT NULL,
    lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
    version INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED, SUPERSEDED
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    company VARCHAR(255) DEFAULT 'Independent',
    project_name VARCHAR(255) DEFAULT 'Digital Engineering Project',
    project_type VARCHAR(255) DEFAULT 'Web Engineering',
    summary TEXT,
    scope TEXT,
    deliverables JSONB DEFAULT '[]'::jsonb,
    technology_stack JSONB DEFAULT '[]'::jsonb,
    timeline VARCHAR(100) DEFAULT '2 to 3 Weeks',
    milestones JSONB DEFAULT '[]'::jsonb,
    subtotal INT NOT NULL DEFAULT 0,
    discount INT DEFAULT 0,
    tax INT DEFAULT 0,
    total INT NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_schedule JSONB DEFAULT '[]'::jsonb,
    valid_until TIMESTAMPTZ,
    terms TEXT,
    rejection_reason TEXT,
    access_token VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_proposals_proposal_id ON proposals(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_access_token ON proposals(access_token);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);
