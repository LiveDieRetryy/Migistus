import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Adding reactions column to direct_messages table...');

    // Add reactions column as JSONB
    await sql`
      ALTER TABLE direct_messages 
      ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb
    `;

    console.log('✅ reactions column added');

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
