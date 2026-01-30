-- Migration: Create integrations table
-- Version: 001
-- Description: Creates the main integrations table with indexes

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY,
    source_system VARCHAR(255) NOT NULL,
    target_system VARCHAR(255) NOT NULL,
    operation VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL,
    request_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    response_timestamp TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_integrations_source_system ON integrations(source_system);
CREATE INDEX idx_integrations_target_system ON integrations(target_system);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_created_at ON integrations(created_at DESC);
CREATE INDEX idx_integrations_request_timestamp ON integrations(request_timestamp DESC);

-- Create composite index for filtering
CREATE INDEX idx_integrations_system_status ON integrations(source_system, target_system, status);

-- Create GIN index for JSONB payload queries
CREATE INDEX idx_integrations_payload ON integrations USING GIN(payload);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE
    ON integrations FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE integrations IS 'Stores integration request and response data';
COMMENT ON COLUMN integrations.id IS 'Unique identifier for the integration';
COMMENT ON COLUMN integrations.source_system IS 'System initiating the integration';
COMMENT ON COLUMN integrations.target_system IS 'Target system for the integration';
COMMENT ON COLUMN integrations.operation IS 'Operation or action to be performed';
COMMENT ON COLUMN integrations.payload IS 'Request/response payload data';
COMMENT ON COLUMN integrations.status IS 'Current status of the integration';
COMMENT ON COLUMN integrations.retry_count IS 'Number of retry attempts';
