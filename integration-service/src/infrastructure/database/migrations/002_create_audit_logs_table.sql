-- Migration: Create audit logs table
-- Version: 002
-- Description: Creates audit logs table for tracking all integration activities

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    user_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audit_logs_integration_id ON audit_logs(integration_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Create GIN index for event_data
CREATE INDEX idx_audit_logs_event_data ON audit_logs USING GIN(event_data);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Audit trail for all integration activities';
COMMENT ON COLUMN audit_logs.integration_id IS 'Reference to the integration';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event (created, updated, failed, etc.)';
COMMENT ON COLUMN audit_logs.event_data IS 'Additional event data in JSON format';
