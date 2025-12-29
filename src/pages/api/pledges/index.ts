// pages/api/pledges/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { productStorage } from '@/utils/productStorageV2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { productId, userId } = req.query;

      if (productId) {
        const pledges = await productStorage.getProductPledges(parseInt(productId as string));
        const pledgeCount = await productStorage.getProductPledgeCount(parseInt(productId as string));
        
        return res.status(200).json({
          pledges,
          count: pledges.length,
          total: pledgeCount
        });
      }

      if (userId) {
        const pledges = await productStorage.getUserPledges(parseInt(userId as string));
        return res.status(200).json({ pledges });
      }

      return res.status(200).json({ pledges: [] });
    }

    if (req.method === 'POST') {
      const { productId, userId, quantity } = req.body;

      if (!productId || !userId) {
        return res.status(400).json({ error: 'productId and userId are required' });
      }

      const pledge = await productStorage.createPledge({ productId, userId, quantity });
      return res.status(201).json(pledge);
    }

    if (req.method === 'PUT') {
      const { productId, userId, quantity } = req.body;

      if (!productId || !userId || quantity === undefined) {
        return res.status(400).json({ error: 'productId, userId, and quantity are required' });
      }

      const pledge = await productStorage.updatePledge(productId, userId, quantity);
      return res.status(200).json(pledge);
    }

    if (req.method === 'DELETE') {
      const { productId, userId } = req.body;

      if (!productId || !userId) {
        return res.status(400).json({ error: 'productId and userId are required' });
      }

      await productStorage.deletePledge(productId, userId);
      return res.status(200).json({ message: 'Pledge deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Pledges API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error', pledges: [] });
  }
}
