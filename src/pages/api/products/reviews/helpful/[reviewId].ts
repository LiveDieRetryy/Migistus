import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { reviewId } = req.query;
  const numericReviewId = parseInt(reviewId as string, 10);

  if (isNaN(numericReviewId)) {
    return res.status(400).json({ error: 'Invalid review ID' });
  }

  if (req.method === 'POST') {
    const { helpful } = req.body; // true for helpful, false for not helpful

    try {
      const updatedReview = await db.updateReviewHelpful(numericReviewId, helpful);
      
      if (!updatedReview) {
        return res.status(404).json({ error: 'Review not found' });
      }

      return res.status(200).json(updatedReview);
    } catch (error) {
      console.error('Error updating review helpful:', error);
      return res.status(500).json({ error: 'Failed to update review' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
