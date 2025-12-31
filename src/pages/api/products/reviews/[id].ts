import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionToken, getSession } from '@/lib/session';

const getUserFromSession = async (req: NextApiRequest): Promise<number | null> => {
  try {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) return null;
    
    const session = await getSession(sessionToken);
    if (!session) {
      console.log('No valid session found');
      return null;
    }
    
    return session.userId;
  } catch (error) {
    console.error('Error reading sessions:', error);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const productId = parseInt(id as string, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  // GET - Fetch all reviews for a product
  if (req.method === 'GET') {
    try {
      const reviews = await db.getProductReviews(productId);
      return res.status(200).json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  // POST - Create a new review (only for verified purchasers)
  if (req.method === 'POST') {
    const userId = await getUserFromSession(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Verify user has purchased this product
      const { purchased, orderId } = await db.hasUserPurchasedProduct(userId, productId);
      
      if (!purchased) {
        return res.status(403).json({ 
          error: 'Only verified purchasers can review this product',
          verifiedPurchase: false
        });
      }

      const { rating, title, content } = req.body;

      // Validation
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'Review title is required' });
      }

      if (!content || content.trim().length < 10) {
        return res.status(400).json({ error: 'Review must be at least 10 characters' });
      }

      // Check if user already reviewed this product
      const existingReviews = await db.getUserReviews(userId);
      const existingReview = existingReviews.find(
        (r: any) => r.product_id === productId
      );

      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this product' });
      }

      const newReview = await db.createProductReview(productId, userId, {
        rating,
        title: title.trim(),
        content: content.trim(),
        verifiedPurchase: true
      });

      return res.status(201).json(newReview);
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ error: 'Failed to create review' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
