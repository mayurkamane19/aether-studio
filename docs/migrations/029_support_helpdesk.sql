-- AETHER STUDIO — CRM PHASE 29 MIGRATION: ADVANCED SUPPORT & HELPDESK 2.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id SERIAL PRIMARY KEY,
  article_id VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50) DEFAULT 'GENERAL',
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PUBLISHED',
  author VARCHAR(100) DEFAULT 'Admin',
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_cat ON knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_status ON knowledge_articles(status);
