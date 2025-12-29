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

  const { id } = req.query;
  const reviewId = parseInt(id as string);

  if (isNaN(reviewId)) {
    return res.status(400).json({ error: 'Invalid review ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { rating, title, content, images } = req.body;

      const review = await db.updateProductReview(reviewId, session.userId, {
        rating,
        title,
        content,
        images
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found or unauthorized' });
      }

      return res.status(200).json({ review });
    } catch (error) {
      console.error('Error updating review:', error);
      return res.status(500).json({ error: 'Failed to update review' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await db.deleteProductReview(reviewId, session.userId);

      if (!result) {
        return res.status(404).json({ error: 'Review not found or unauthorized' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting review:', error);
      return res.status(500).json({ error: 'Failed to delete review' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
