import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await sql`
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;

    // Group columns by table
    const tables: Record<string, any[]> = {};
    result.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push({
        column: row.column_name,
        type: row.data_type
      });
    });

    return res.status(200).json({
      success: true,
      tables: tables,
      tableCount: Object.keys(tables).length
    });

  } catch (error: any) {
    console.error('Schema inspection error:', error);
    return res.status(500).json({
      error: 'Failed to inspect schema',
      details: error.message
    });
  }
}
