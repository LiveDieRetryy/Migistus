import type { NextApiRequest, NextApiResponse } from 'next';
import { productStorage } from '@/utils/productStorageV2';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const products = await productStorage.getProducts();
    const staffPicks = await db.getAllStaffPicks();
    
    const stats = {
      total: products.length,
      comingSoon: products.filter((product: any) => product.status === 'coming-soon' || product.status === 'upcoming').length,
      live: products.filter((product: any) => product.status === 'live' || product.status === 'active').length,
      completed: products.filter((product: any) => product.status === 'completed' || product.status === 'ended').length,
      staffPicks: staffPicks.length,
      byCategory: products.reduce((acc: any, product: any) => {
        const category = product.category || 'General';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
      totalPledges: products.reduce((sum: number, product: any) => sum + (product.pledgeCount || 0), 0),
      totalValue: products.reduce((sum: number, product: any) => sum + (product.totalPledged || 0), 0)
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error generating product stats:', error);
    res.status(500).json({ error: 'Failed to generate product statistics' });
  }
}
