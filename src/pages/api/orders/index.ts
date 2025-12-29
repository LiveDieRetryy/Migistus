import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const session = await getSessionFromRequest(req);

      if (!session || !session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { limit, offset } = req.query;
      const orders = await db.getUserOrders(
        session.userId,
        parseInt(limit as string) || 50,
        parseInt(offset as string) || 0
      );

      return res.status(200).json({ orders });
    } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  if (req.method === 'POST') {
    const session = await getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { items, totalAmount, shippingAddress, billingAddress, paymentMethod, notes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
      }

      if (!totalAmount || totalAmount <= 0) {
        return res.status(400).json({ error: 'Valid total amount is required' });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const order = await db.createOrder(session.userId, {
        orderNumber,
        totalAmount,
        items,
        shippingAddress,
        billingAddress,
        paymentMethod,
        notes
      });

      return res.status(201).json({ order });
    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ error: 'Failed to create order' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
