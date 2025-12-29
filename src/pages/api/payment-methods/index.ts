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
      // Get user's payment methods
      const methods = await paymentStorage.getUserPaymentMethods(session.userId);
      
      // Remove sensitive token data
      const safeMethods = methods.map((m: any) => ({
        id: m.id,
        type: m.type,
        provider: m.provider,
        last4: m.last4,
        expiryMonth: m.expiryMonth,
        expiryYear: m.expiryYear,
        isDefault: m.isDefault,
        createdAt: m.createdAt
      }));

      return res.status(200).json({ methods: safeMethods });

    } else if (req.method === 'POST') {
      // Add new payment method
      const { type, provider, token, last4, expiryMonth, expiryYear, isDefault } = req.body;

      // Validation
      if (!type || !['card', 'paypal', 'bank_account'].includes(type)) {
        return res.status(400).json({ error: 'Invalid payment method type' });
      }

      if (!provider || !['stripe', 'paypal'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid payment provider' });
      }

      if (!token || typeof token !== 'string' || token.length < 10) {
        return res.status(400).json({ error: 'Invalid payment token' });
      }

      // For cards, validate expiry
      if (type === 'card') {
        if (!last4 || !/^\d{4}$/.test(last4)) {
          return res.status(400).json({ error: 'Invalid card last 4 digits' });
        }

        if (!expiryMonth || expiryMonth < 1 || expiryMonth > 12) {
          return res.status(400).json({ error: 'Invalid expiry month' });
        }

        const currentYear = new Date().getFullYear();
        if (!expiryYear || expiryYear < currentYear || expiryYear > currentYear + 20) {
          return res.status(400).json({ error: 'Invalid expiry year' });
        }
      }

      // In production, this would validate token with Stripe/PayPal
      // For now, accept the token as-is

      const method = await paymentStorage.addPaymentMethod({
        userId: session.userId,
        type,
        provider,
        token,
        last4: type === 'card' ? last4 : undefined,
        expiryMonth: type === 'card' ? parseInt(expiryMonth) : undefined,
        expiryYear: type === 'card' ? parseInt(expiryYear) : undefined,
        isDefault: isDefault === true
      });

      // Remove token from response
      const safeMethod = {
        id: method.id,
        type: method.type,
        provider: method.provider,
        last4: method.last4,
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        isDefault: method.isDefault,
        createdAt: method.createdAt
      };

      return res.status(201).json({ method: safeMethod });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Payment methods API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
