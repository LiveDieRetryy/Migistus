import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Adding status column to conversations table...');

    // Add status column (pending, accepted, ignored)
    await sql`
      ALTER TABLE conversations 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'accepted'
    `;

    console.log('✅ status column added');

    // Add initiated_by column to track who started the conversation
    await sql`
      ALTER TABLE conversations 
      ADD COLUMN IF NOT EXISTS initiated_by INTEGER
    `;

    console.log('✅ initiated_by column added');

    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_conversations_status 
      ON conversations (status)
    `;

    console.log('✅ Index created');

    return res.status(200).json({
      success: true,
      message: 'Migration completed successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
