import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const reviewsPath = path.join(process.cwd(), 'public', 'data', 'product-reviews.json');

interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  orderId?: number;
}

const getReviews = (): Review[] => {
  try {
    if (!fs.existsSync(reviewsPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(reviewsPath, 'utf8'));
  } catch (error) {
    console.error('Error reading reviews:', error);
    return [];
  }
};

const saveReviews = (reviews: Review[]) => {
  fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, reviewId } = req.query;
  const numericReviewId = parseInt(reviewId as string, 10);

  if (isNaN(numericReviewId)) {
    return res.status(400).json({ error: 'Invalid review ID' });
  }

  if (req.method === 'POST') {
    const { helpful } = req.body; // true for helpful, false for not helpful

    const reviews = getReviews();
    const reviewIndex = reviews.findIndex(r => r.id === numericReviewId);

    if (reviewIndex === -1) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (helpful === true) {
      reviews[reviewIndex].helpful += 1;
    } else if (helpful === false) {
      reviews[reviewIndex].notHelpful += 1;
    } else {
      return res.status(400).json({ error: 'Invalid helpful value' });
    }

    saveReviews(reviews);

    return res.status(200).json(reviews[reviewIndex]);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
