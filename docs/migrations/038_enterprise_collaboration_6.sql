-- AETHER STUDIO — CRM PHASE 38 MIGRATION: ENTERPRISE COLLABORATION & WORKSPACE 6.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS workspace_messages (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(50) UNIQUE NOT NULL,
  channel VARCHAR(100) DEFAULT 'GENERAL',
  sender VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wm_channel ON workspace_messages(channel);
