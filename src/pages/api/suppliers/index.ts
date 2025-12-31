import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get all supplier profiles
      const result = await sql`
        SELECT sp.*, u.username, u.email as user_email
        FROM supplier_profiles sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.is_active = true
        ORDER BY sp.created_at DESC
      `;
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error reading suppliers:', error);
      res.status(500).json({ error: 'Failed to load suppliers' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
