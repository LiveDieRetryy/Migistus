// API endpoint for recording live user interactions
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { type, userId, supplierId, productId, metadata } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'Event type is required' });
    }

    const event = await db.createAnalyticsEvent({
      eventType: type,
      userId: userId ? parseInt(userId) : undefined,
      supplierId: supplierId ? parseInt(supplierId) : undefined,
      productId: productId ? parseInt(productId) : undefined,
      metadata,
      userAgent: req.headers['user-agent'] || undefined,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || undefined
    });

    return res.status(200).json({ success: true, eventId: event.id });
    
  } catch (error) {
    console.error('Error recording tracking event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
