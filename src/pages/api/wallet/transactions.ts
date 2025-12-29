import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { paymentStorage } from '@/utils/paymentStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { limit = '50', offset = '0' } = req.query;

    const limitNum = Math.min(Math.max(parseInt(limit as string) || 50, 1), 100);
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

    const transactions = await paymentStorage.getWalletTransactions(
      session.userId,
      limitNum,
      offsetNum
    );

    return res.status(200).json({ transactions });

  } catch (error) {
    console.error('Wallet transactions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
