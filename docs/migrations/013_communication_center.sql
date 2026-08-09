-- AETHER STUDIO — CRM PHASE 13 MIGRATION: OMNICHANNEL COMMUNICATION CENTER
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  client_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) DEFAULT 'Aether Studio Project Inquiry',
  status VARCHAR(50) DEFAULT 'OPEN',
  priority VARCHAR(50) DEFAULT 'NORMAL',
  channel VARCHAR(50) DEFAULT 'EMAIL',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_to VARCHAR(100) DEFAULT 'Strategy Team',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  sender_type VARCHAR(50) NOT NULL,
  sender_name VARCHAR(255),
  sender_email VARCHAR(255),
  channel VARCHAR(50) DEFAULT 'EMAIL',
  direction VARCHAR(20) DEFAULT 'OUTBOUND',
  subject VARCHAR(255),
  message TEXT NOT NULL,
  external_message_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'SENT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conv_msg_conv_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_msg_lead_id ON conversation_messages(lead_id);

CREATE TABLE IF NOT EXISTS message_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(50) DEFAULT 'EMAIL',
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(50) REFERENCES leads(lead_id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'NORMAL',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
