import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { paymentStorage } from '@/utils/paymentStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    const transactionId = parseInt(id as string);

    if (isNaN(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    if (req.method === 'GET') {
      // Get transaction details
      const transaction = await paymentStorage.getTransaction(transactionId);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Verify ownership
      if (transaction.userId !== session.userId && session.tier !== 'master') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return res.status(200).json({ transaction });

    } else if (req.method === 'POST') {
      // Process refund
      const { amount, reason } = req.body;

      const transaction = await paymentStorage.getTransaction(transactionId);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Verify ownership
      if (transaction.userId !== session.userId && session.tier !== 'master') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Verify transaction is completed
      if (transaction.status !== 'completed') {
        return res.status(400).json({ error: 'Can only refund completed transactions' });
      }

      // Validate amount
      const refundAmount = amount ? parseFloat(amount) : transaction.amount;
      if (refundAmount <= 0 || refundAmount > transaction.amount) {
        return res.status(400).json({ error: 'Invalid refund amount' });
      }

      // Check for existing refunds
      const existingRefunds = await paymentStorage.getTransactionRefunds(transactionId);
      const totalRefunded = existingRefunds.reduce((sum: number, r: any) => {
        if (r.status === 'completed') return sum + parseFloat(r.amount);
        return sum;
      }, 0);

      if (totalRefunded + refundAmount > transaction.amount) {
        return res.status(400).json({ error: 'Refund amount exceeds available balance' });
      }

      // Create refund
      const refund = await paymentStorage.createRefund({
        transactionId,
        amount: refundAmount,
        reason: reason || 'Customer requested refund',
        status: 'pending'
      });

      // In production, this would integrate with Stripe/PayPal
      // For now, simulate immediate success
      await paymentStorage.updateRefundStatus(
        refund.id,
        'completed',
        new Date().toISOString()
      );

      // Update transaction status if fully refunded
      if (totalRefunded + refundAmount >= transaction.amount) {
        await paymentStorage.updateTransactionStatus(transactionId, 'refunded');
      }

      return res.status(200).json({ 
        success: true, 
        refund: {
          ...refund,
          status: 'completed'
        }
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Payment detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
