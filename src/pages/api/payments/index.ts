import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { paymentStorage } from '@/utils/paymentStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      // Process a payment
      const { amount, currency, paymentMethodId, orderId, description, type } = req.body;

      // Validation
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      if (!type || !['payment', 'subscription', 'payout'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
      }

      // Create transaction
      const transaction = await paymentStorage.createTransaction({
        userId: session.userId,
        type,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        status: 'pending',
        paymentMethodId: paymentMethodId || undefined,
        orderId: orderId || undefined,
        description: description || undefined,
        metadata: {}
      });

      // In production, this would integrate with Stripe/PayPal
      // For now, simulate immediate success
      await paymentStorage.updateTransactionStatus(
        transaction.id,
        'completed',
        { processedAt: new Date().toISOString() }
      );

      return res.status(200).json({ 
        success: true, 
        transaction: {
          ...transaction,
          status: 'completed'
        }
      });

    } else if (req.method === 'GET') {
      // Get transaction history
      const { limit = '50', offset = '0', type } = req.query;

      const limitNum = Math.min(Math.max(parseInt(limit as string) || 50, 1), 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      let transactions = await paymentStorage.getUserTransactions(
        session.userId,
        limitNum,
        offsetNum
      );

      // Filter by type if provided
      if (type && typeof type === 'string') {
        transactions = transactions.filter((t: any) => t.type === type);
      }

      return res.status(200).json({ transactions });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Payment API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
