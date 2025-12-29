import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { paymentStorage } from '@/utils/paymentStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get user's invoices
      const { limit = '50', offset = '0', status } = req.query;

      const limitNum = Math.min(Math.max(parseInt(limit as string) || 50, 1), 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      let invoices = await paymentStorage.getUserInvoices(
        session.userId,
        limitNum,
        offsetNum
      );

      // Filter by status if provided
      if (status && typeof status === 'string') {
        invoices = invoices.filter((i: any) => i.status === status);
      }

      return res.status(200).json({ invoices });

    } else if (req.method === 'POST') {
      // Generate invoice
      const { subscriptionId, orderId, items, dueDate } = req.body;

      // Validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required' });
      }

      // Calculate total
      const total = items.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.price) * parseInt(item.quantity));
      }, 0);

      if (total <= 0) {
        return res.status(400).json({ error: 'Invoice total must be greater than 0' });
      }

      // Create invoice
      const invoice = await paymentStorage.createInvoice({
        userId: session.userId,
        subscriptionId: subscriptionId ? parseInt(subscriptionId) : undefined,
        orderId: orderId ? parseInt(orderId) : undefined,
        amount: total,
        currency: 'USD',
        status: 'pending',
        dueDate: dueDate || undefined,
        items
      });

      return res.status(201).json({ invoice });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Invoices API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
