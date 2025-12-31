import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

interface ProductOrder {
  id: string;
  product_id: number;
  user_id: number;
  username: string;
  quantity: number;
  order_date: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add cache-busting headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    if (req.method === 'GET') {
      const { productId, userId } = req.query;

      // Get specific user's order for a product
      if (productId && userId) {
        const orders = await db.getProductOrders({
          productId: Number(productId),
          userId: Number(userId)
        });
        return res.status(200).json({ order: orders[0] || null });
      }

      // Get all orders for a product
      if (productId) {
        const orders = await db.getProductOrders({ productId: Number(productId) });
        return res.status(200).json({ orders });
      }

      // Get all orders for a user
      if (userId) {
        const orders = await db.getProductOrders({ userId: Number(userId) });
        return res.status(200).json({ orders });
      }

      // Return all orders
      const orders = await db.getProductOrders();
      return res.status(200).json({ orders });
    }

    if (req.method === 'POST') {
      const { productId, userId, username, quantity } = req.body;

      if (!productId || !userId || !username || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user already has an order for this product
      const existingOrders = await db.getProductOrders({
        productId: Number(productId),
        userId: Number(userId)
      });

      if (existingOrders.length > 0) {
        return res.status(400).json({ 
          error: 'You have already placed an order for this product',
          order: existingOrders[0]
        });
      }

      // Create new order
      const newOrder = await db.createProductOrder({
        productId: Number(productId),
        userId: Number(userId),
        username,
        quantity: Number(quantity)
      });

      return res.status(201).json({ order: newOrder });
    }

    if (req.method === 'PUT') {
      const { orderId, status } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const order = await db.updateProductOrderStatus(orderId, status);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.status(200).json({ order });
    }

    if (req.method === 'DELETE') {
      const { orderId } = req.query;

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID required' });
      }

      // Mark as cancelled instead of deleting
      const order = await db.updateProductOrderStatus(orderId as string, 'cancelled');
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.status(200).json({ message: 'Order cancelled', order });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Product orders API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
