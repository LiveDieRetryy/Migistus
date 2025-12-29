-- Add deleted_for column to direct_messages table
-- This column stores an array of user IDs who have deleted this message for themselves

ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS deleted_for integer[] DEFAULT ARRAY[]::integer[];

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_deleted_for ON direct_messages USING GIN (deleted_for);

-- Add a comment to document the column
COMMENT ON COLUMN direct_messages.deleted_for IS 'Array of user IDs who have deleted this message for themselves';
