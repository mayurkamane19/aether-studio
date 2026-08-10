-- AETHER STUDIO — CRM PHASE 24 MIGRATION: UNIFIED COMMUNICATION CENTER 2.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(50) UNIQUE NOT NULL,
  lead_id VARCHAR(50) REFERENCES leads(lead_id) ON DELETE CASCADE,
  channel VARCHAR(50) DEFAULT 'CONTACT_FORM',
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'OPEN',
  priority VARCHAR(20) DEFAULT 'NORMAL',
  assigned_to VARCHAR(100) DEFAULT 'Unassigned',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_lead ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conv_status ON conversations(status);

CREATE TABLE IF NOT EXISTS communication_messages (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(50) UNIQUE NOT NULL,
  conversation_id VARCHAR(50) NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  sender_name VARCHAR(100) DEFAULT 'System',
  direction VARCHAR(20) DEFAULT 'INBOUND',
  body TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_msg_conv ON communication_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_comm_msg_internal ON communication_messages(is_internal);

CREATE TABLE IF NOT EXISTS communication_templates (
  id SERIAL PRIMARY KEY,
  template_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'GENERAL',
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
