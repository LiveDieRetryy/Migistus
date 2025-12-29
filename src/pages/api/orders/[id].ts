import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const session = await getSessionFromRequest(req);

      if (!session || !session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if it's an order ID or order number
      let order;
      if (isNaN(parseInt(id as string))) {
        order = await db.getOrderByNumber(id as string);
      } else {
        order = await db.getOrder(parseInt(id as string));
      }

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Only owner or admin can view order
      if (order.user_id !== session.userId && session.tier !== 'Admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return res.status(200).json({ order });
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }
  }

  if (req.method === 'PUT') {
    const session = await getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can update order status
    if (session.tier !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const { status, trackingNumber } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const data: any = { trackingNumber };

      if (status === 'shipped') {
        data.shippedAt = new Date();
      } else if (status === 'delivered') {
        data.deliveredAt = new Date();
      } else if (status === 'cancelled') {
        data.cancelledAt = new Date();
      }

      const order = await db.updateOrderStatus(parseInt(id as string), status, data);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.status(200).json({ order });
    } catch (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({ error: 'Failed to update order' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
