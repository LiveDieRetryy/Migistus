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
      // Get wallet balance and info
      const wallet = await paymentStorage.getWallet(session.userId);
      return res.status(200).json({ wallet });

    } else if (req.method === 'POST') {
      // Add credits to wallet
      const { amount, type, description, paymentMethodId } = req.body;

      // Validation
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const creditAmount = parseFloat(amount);

      if (creditAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }

      // If adding funds, require payment
      if (type === 'deposit' || !type) {
        if (!paymentMethodId) {
          return res.status(400).json({ error: 'Payment method required for deposits' });
        }

        // Create payment transaction
        await paymentStorage.createTransaction({
          userId: session.userId,
          type: 'payment',
          amount: creditAmount,
          currency: 'USD',
          status: 'completed',
          paymentMethodId: parseInt(paymentMethodId),
          description: 'Wallet credit purchase'
        });
      }

      // Update wallet balance
      const wallet = await paymentStorage.updateWalletBalance(
        session.userId,
        creditAmount,
        type || 'deposit',
        description || 'Credits added to wallet'
      );

      return res.status(200).json({ 
        success: true, 
        wallet,
        message: 'Wallet updated successfully'
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Wallet API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
