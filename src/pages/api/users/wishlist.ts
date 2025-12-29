import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSessionFromRequest(req);

  if (!session || !session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.userId;

  if (req.method === 'GET') {
    try {
      const wishlist = await db.getWishlist(userId);
      return res.status(200).json({ wishlist });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ error: 'productId is required' });
      }

      const result = await db.addToWishlist(userId, productId);
      return res.status(200).json({ success: true, wishlist: result });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return res.status(500).json({ error: 'Failed to add to wishlist' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ error: 'productId is required' });
      }

      const result = await db.removeFromWishlist(userId, productId);
      return res.status(200).json({ success: true, removed: result });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
