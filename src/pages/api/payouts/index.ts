import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { paymentStorage } from '@/utils/paymentStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    
    // Only master tier can access payouts
    if (!session || session.tier !== 'master') {
      return res.status(403).json({ error: 'Forbidden - Master tier required' });
    }

    if (req.method === 'GET') {
      // Get payouts (all or pending)
      const { status, limit = '50', offset = '0' } = req.query;

      const limitNum = Math.min(Math.max(parseInt(limit as string) || 50, 1), 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      let payouts;

      if (status === 'pending') {
        payouts = await paymentStorage.getPendingPayouts(limitNum);
      } else {
        payouts = await paymentStorage.getUserPayouts(
          session.userId,
          limitNum,
          offsetNum
        );
      }

      return res.status(200).json({ payouts });

    } else if (req.method === 'POST') {
      // Create payout request
      const { amount, method, destination } = req.body;

      // Validation
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      if (!method || !['bank_transfer', 'paypal', 'stripe'].includes(method)) {
        return res.status(400).json({ error: 'Invalid payout method' });
      }

      if (!destination || typeof destination !== 'string' || destination.length < 5) {
        return res.status(400).json({ error: 'Invalid destination' });
      }

      // Create payout
      const payout = await paymentStorage.createPayout({
        userId: session.userId,
        amount: parseFloat(amount),
        currency: 'USD',
        status: 'pending',
        method,
        destination
      });

      return res.status(201).json({ payout });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Payouts API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
