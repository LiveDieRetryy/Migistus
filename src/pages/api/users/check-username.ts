import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Basic format validation
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return res.status(200).json({
      available: false,
      error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
    });
  }

  try {
    // Check if username exists (case-insensitive)
    const result = await sql`
      SELECT username FROM users WHERE LOWER(username) = LOWER(${username})
    `;

    const available = result.rows.length === 0;

    // Generate suggestions if username is taken
    let suggestions: string[] = [];
    if (!available) {
      const currentYear = new Date().getFullYear();
      
      suggestions = [
        `${username}${Math.floor(Math.random() * 999)}`,
        `${username}_${currentYear}`,
        `${username}_official`,
        `the_${username}`
      ];
    }

    return res.status(200).json({
      available,
      suggestions
    });
  } catch (error: any) {
    console.error('Error checking username:', error);
    
    // If database is not connected, allow username (development mode)
    if (error.message?.includes('missing_connection_string') || error.code === 'missing_connection_string') {
      return res.status(200).json({
        available: true,
        suggestions: [],
        note: 'Database not connected - validation skipped'
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to check username availability',
      details: error.message 
    });
  }
}
