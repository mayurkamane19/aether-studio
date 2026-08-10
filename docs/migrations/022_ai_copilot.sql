-- AETHER STUDIO — CRM PHASE 22 MIGRATION: AI BUSINESS COPILOT 2.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS ai_conversations (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(100) DEFAULT 'Admin',
  title VARCHAR(255) DEFAULT 'Executive Copilot Session',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);

CREATE TABLE IF NOT EXISTS ai_messages (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(50) UNIQUE NOT NULL,
  conversation_id VARCHAR(50) NOT NULL REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  intent VARCHAR(50),
  confidence VARCHAR(20) DEFAULT 'HIGH',
  sources JSONB,
  suggested_actions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON ai_messages(conversation_id);

CREATE TABLE IF NOT EXISTS ai_tool_runs (
  id SERIAL PRIMARY KEY,
  run_id VARCHAR(50) UNIQUE NOT NULL,
  tool_name VARCHAR(100) NOT NULL,
  conversation_id VARCHAR(50) REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE,
  params JSONB,
  status VARCHAR(50) DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tool_name ON ai_tool_runs(tool_name);
