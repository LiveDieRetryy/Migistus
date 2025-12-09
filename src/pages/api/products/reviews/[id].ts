import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const reviewsPath = path.join(process.cwd(), 'public', 'data', 'product-reviews.json');
const ordersPath = path.join(process.cwd(), 'public', 'data', 'product-orders.json');
const sessionsPath = path.join(process.cwd(), 'public', 'data', 'user-sessions.json');

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

interface Order {
  id: number;
  userId: number;
  productId: number;
  status: 'pending' | 'completed' | 'cancelled' | 'delivered';
  quantity: number;
  createdAt: string;
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

const getOrders = (): Order[] => {
  try {
    if (!fs.existsSync(ordersPath)) {
      console.log('Orders file does not exist, returning empty array');
      return [];
    }
    const fileContent = fs.readFileSync(ordersPath, 'utf8');
    if (!fileContent || fileContent.trim() === '') {
      console.log('Orders file is empty');
      return [];
    }
    const orders = JSON.parse(fileContent);
    return Array.isArray(orders) ? orders : [];
  } catch (error) {
    console.error('Error reading orders:', error);
    return [];
  }
};

const getUserFromSession = (sessionId: string | undefined): number | null => {
  if (!sessionId) return null;
  
  try {
    if (!fs.existsSync(sessionsPath)) {
      console.log('Sessions file does not exist');
      return null;
    }
    const fileContent = fs.readFileSync(sessionsPath, 'utf8');
    if (!fileContent || fileContent.trim() === '') {
      console.log('Sessions file is empty');
      return null;
    }
    const sessions = JSON.parse(fileContent);
    if (!Array.isArray(sessions)) {
      console.log('Sessions data is not an array');
      return null;
    }
    const session = sessions.find((s: any) => s.sessionId === sessionId);
    return session?.userId || null;
  } catch (error) {
    console.error('Error reading sessions:', error);
    return null;
  }
};

const hasUserPurchasedProduct = (userId: number, productId: number): { purchased: boolean; orderId?: number } => {
  const orders = getOrders();
  const completedOrder = orders.find(
    order => 
      order.userId === userId && 
      order.productId === productId && 
      (order.status === 'completed' || order.status === 'delivered')
  );
  
  return {
    purchased: !!completedOrder,
    orderId: completedOrder?.id
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const productId = parseInt(id as string, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  // GET - Fetch all reviews for a product
  if (req.method === 'GET') {
    const reviews = getReviews();
    const productReviews = reviews
      .filter(review => review.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json(productReviews);
  }

  // POST - Create a new review (only for verified purchasers)
  if (req.method === 'POST') {
    const sessionId = req.cookies.sessionId;
    const userId = getUserFromSession(sessionId);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify user has purchased this product
    const { purchased, orderId } = hasUserPurchasedProduct(userId, productId);
    
    if (!purchased) {
      return res.status(403).json({ 
        error: 'Only verified purchasers can review this product',
        verifiedPurchase: false
      });
    }

    const { rating, title, comment, userName } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Review title is required' });
    }

    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({ error: 'Review must be at least 10 characters' });
    }

    const reviews = getReviews();

    // Check if user already reviewed this product
    const existingReview = reviews.find(
      r => r.productId === productId && r.userId === userId
    );

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    const newReview: Review = {
      id: reviews.length > 0 ? Math.max(...reviews.map(r => r.id)) + 1 : 1,
      productId,
      userId,
      userName: userName || `User ${userId}`,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      verifiedPurchase: true,
      helpful: 0,
      notHelpful: 0,
      createdAt: new Date().toISOString(),
      orderId
    };

    reviews.push(newReview);
    saveReviews(reviews);

    return res.status(201).json(newReview);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
