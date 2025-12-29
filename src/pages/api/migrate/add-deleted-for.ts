import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Adding deleted_for column to direct_messages table...');

    // Add the column
    await sql`
      ALTER TABLE direct_messages 
      ADD COLUMN IF NOT EXISTS deleted_for integer[] DEFAULT ARRAY[]::integer[]
    `;

    console.log('✅ deleted_for column added');

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_direct_messages_deleted_for 
      ON direct_messages USING GIN (deleted_for)
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
