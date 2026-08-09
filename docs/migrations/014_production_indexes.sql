-- AETHER STUDIO — CRM PHASE 14 MIGRATION: PRODUCTION PERFORMANCE INDEXES
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE INDEX IF NOT EXISTS idx_leads_created_status ON leads(created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_status ON invoices(created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_conv_msg_created ON conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_lead_created ON lead_activity(lead_id, created_at DESC);
