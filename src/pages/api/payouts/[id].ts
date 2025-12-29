import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { paymentStorage } from '@/utils/paymentStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    
    // Only master tier can process payouts
    if (!session || session.tier !== 'master') {
      return res.status(403).json({ error: 'Forbidden - Master tier required' });
    }

    const { id } = req.query;
    const payoutId = parseInt(id as string);

    if (isNaN(payoutId)) {
      return res.status(400).json({ error: 'Invalid payout ID' });
    }

    if (req.method === 'GET') {
      // Get payout details
      const payout = await paymentStorage.getPayout(payoutId);

      if (!payout) {
        return res.status(404).json({ error: 'Payout not found' });
      }

      return res.status(200).json({ payout });

    } else if (req.method === 'POST') {
      // Process payout
      const { status } = req.body;

      if (!status || !['completed', 'failed', 'canceled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const payout = await paymentStorage.getPayout(payoutId);

      if (!payout) {
        return res.status(404).json({ error: 'Payout not found' });
      }

      if (payout.status !== 'pending') {
        return res.status(400).json({ error: 'Can only process pending payouts' });
      }

      // Update payout status
      const updatedPayout = await paymentStorage.updatePayoutStatus(
        payoutId,
        status,
        status === 'completed' ? new Date().toISOString() : undefined
      );

      return res.status(200).json({ 
        success: true, 
        payout: updatedPayout 
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Payout detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
