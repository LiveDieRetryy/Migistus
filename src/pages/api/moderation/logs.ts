import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const logs = await db.getModerationLogs();
      return res.status(200).json({ logs });
    } catch (error) {
      console.error('Error reading moderation logs:', error);
      return res.status(500).json({ error: 'Failed to load moderation logs' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
