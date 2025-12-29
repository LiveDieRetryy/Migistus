-- Add message attachments support
-- Run this migration after add_direct_messaging.sql

CREATE TABLE IF NOT EXISTS message_attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL, -- 'image', 'video', 'document', 'audio'
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_file_type ON message_attachments(file_type);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_message_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_attachments_updated_at
BEFORE UPDATE ON message_attachments
FOR EACH ROW
EXECUTE FUNCTION update_message_attachments_updated_at();
