import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(200).json({
      available: false,
      error: 'Invalid email format'
    });
  }

  try {
    // Check if email exists (case-insensitive)
    const result = await sql`
      SELECT email FROM users WHERE LOWER(email) = LOWER(${email})
    `;

    const available = result.rows.length === 0;

    return res.status(200).json({
      available
    });
  } catch (error: any) {
    console.error('Error checking email:', error);
    
    // If database is not connected, allow email (development mode)
    if (error.message?.includes('missing_connection_string') || error.code === 'missing_connection_string') {
      return res.status(200).json({
        available: true,
        note: 'Database not connected - validation skipped'
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to check email availability',
      details: error.message 
    });
  }
}
