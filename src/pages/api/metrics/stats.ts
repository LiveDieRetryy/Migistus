import type { NextApiRequest, NextApiResponse } from 'next';
import { metrics } from '@/lib/metrics';
import { appCache as cache } from '@/lib/cache';
import { getServerSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Require admin access
    const session = await getServerSession(req, res);
    if (!session || session.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      const { timeWindow } = req.query;
      const window = timeWindow ? parseInt(timeWindow as string) : 60000;

      // Get metrics stats
      const stats = metrics.getStats(window);
      const allMetrics = metrics.getAllMetrics();
      
      // Get cache stats
      const cacheStats = cache.getStats();

      return res.status(200).json({
        success: true,
        metrics: stats,
        lifetime: allMetrics,
        cache: cacheStats,
        timestamp: Date.now()
      });
    }

    if (req.method === 'DELETE') {
      // Clear metrics
      metrics.clear();
      return res.status(200).json({ success: true, message: 'Metrics cleared' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Metrics stats error:', error);
    return res.status(500).json({ error: error.message });
  }
}
