import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tables = [
      'users', 'products', 'votes', 'orders', 'conversations', 'messages',
      'notifications', 'user_profiles', 'followers', 'chat_messages',
      'email_campaigns', 'password_reset_tokens', 'live_drops'
    ];

    const schemas: any = {};

    for (const table of tables) {
      try {
        const result = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = ${table}
          ORDER BY ordinal_position
        `;
        schemas[table] = result.rows.map(r => ({ name: r.column_name, type: r.data_type }));
      } catch (error: any) {
        schemas[table] = { error: error.message };
      }
    }

    return res.status(200).json({ schemas });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
