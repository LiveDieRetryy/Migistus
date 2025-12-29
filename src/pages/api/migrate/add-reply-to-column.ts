import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Add reply_to_id column to direct_messages table
    await sql`
      ALTER TABLE direct_messages 
      ADD COLUMN IF NOT EXISTS reply_to_id INTEGER REFERENCES direct_messages(id)
    `;

    console.log('✅ Migration complete: reply_to_id column added to direct_messages table');

    return res.status(200).json({ 
      success: true,
      message: 'Reply column added successfully'
    });
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
