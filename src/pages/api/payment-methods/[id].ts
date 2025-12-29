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
    const methodId = parseInt(id as string);

    if (isNaN(methodId)) {
      return res.status(400).json({ error: 'Invalid payment method ID' });
    }

    if (req.method === 'PATCH') {
      // Set as default payment method
      const method = await paymentStorage.setDefaultPaymentMethod(methodId, session.userId);

      if (!method) {
        return res.status(404).json({ error: 'Payment method not found' });
      }

      return res.status(200).json({ success: true, method });

    } else if (req.method === 'DELETE') {
      // Delete payment method
      await paymentStorage.deletePaymentMethod(methodId, session.userId);
      return res.status(200).json({ success: true });

    } else {
      res.setHeader('Allow', ['PATCH', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Payment method detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
