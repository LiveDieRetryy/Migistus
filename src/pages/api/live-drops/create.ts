import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { productId, productName, pledgeGoal, startTime, duration } = req.body;
    
    // Validate required fields
    if (!productId || !productName || !startTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newDrop = await db.createLiveDrop({
      productId: parseInt(productId),
      productName,
      pledgeGoal: parseFloat(pledgeGoal || 0),
      startTime,
      durationHours: parseInt(duration || 24)
    });
    
    res.status(201).json({ success: true, drop: newDrop });
  } catch (error) {
    console.error('Error creating live drop:', error);
    res.status(500).json({ error: 'Failed to create live drop' });
  }
}
