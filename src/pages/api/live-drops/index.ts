import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const liveDrops = await db.getAllLiveDrops();
      const stats = await db.getLiveDropStats();
      
      return res.status(200).json({
        liveDrops,
        stats
      });
    }

    if (req.method === 'POST') {
      const { productId, productName, pledgeGoal, startTime, duration } = req.body;
      
      if (!productId || !productName || !startTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newLiveDrop = await db.createLiveDrop({
        productId: parseInt(productId),
        productName,
        pledgeGoal: parseFloat(pledgeGoal || 0),
        startTime,
        durationHours: parseInt(duration || 24)
      });
      
      return res.status(201).json(newLiveDrop);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Error in live-drops API:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
