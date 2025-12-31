import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const products = await db.getSupplierProducts();
      
      const pendingProducts = products.filter((product: any) => product.status === 'pending');
      
      return res.status(200).json({
        pendingCount: pendingProducts.length,
        totalCount: products.length,
        products: pendingProducts
      });
    } catch (error) {
      console.error('Error fetching supplier product stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
