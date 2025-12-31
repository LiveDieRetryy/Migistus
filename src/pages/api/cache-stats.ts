import { NextApiRequest, NextApiResponse } from 'next';
import { appCache as cache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const stats = cache.getStats();
    return res.status(200).json({
      success: true,
      cache: stats
    });
  }

  if (req.method === 'DELETE') {
    // Clear all cache
    cache.clear();
    return res.status(200).json({
      success: true,
      message: 'Cache cleared'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
