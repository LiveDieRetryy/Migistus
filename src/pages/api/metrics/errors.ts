import type { NextApiRequest, NextApiResponse } from 'next';
import { metrics } from '@/lib/metrics';
import { getServerSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Require admin access
    const session = await getServerSession(req, res);
    if (!session || session.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : 50;

      const errors = metrics.getRecentErrors(limitNum);

      return res.status(200).json({
        success: true,
        errors,
        count: errors.length,
        timestamp: Date.now()
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Metrics errors error:', error);
    return res.status(500).json({ error: error.message });
  }
}
