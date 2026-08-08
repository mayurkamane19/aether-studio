-- AETHER STUDIO — POSTGRESQL / SUPABASE LEADS TABLE MIGRATION
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) DEFAULT 'Independent',
    project_type VARCHAR(255) DEFAULT 'General Inquiry',
    budget VARCHAR(100) DEFAULT 'Not Specified',
    timeline VARCHAR(100) DEFAULT 'Flexible',
    preferred_contact VARCHAR(100) DEFAULT 'Email',
    message TEXT,
    status VARCHAR(50) DEFAULT 'NEW',
    lead_score INT DEFAULT 0,
    source VARCHAR(100) DEFAULT 'Website',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lead lookup by lead_id, email, status, and creation date
CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Valid Status values: NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST
