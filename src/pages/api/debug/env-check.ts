import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Security: Only allow in development or with secret key
  const debugKey = req.query.key;
  if (process.env.NODE_ENV === 'production' && debugKey !== process.env.DEBUG_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    useDatabase: process.env.NEXT_PUBLIC_USE_DATABASE,
    isProduction: process.env.NEXT_PUBLIC_USE_DATABASE === 'true' || process.env.NODE_ENV === 'production',
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 8),
    hasGuildPrice: !!process.env.STRIPE_GUILD_PRICE_ID,
    hasElitePrice: !!process.env.STRIPE_ELITE_PRICE_ID,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    hasDatabaseUrl: !!process.env.POSTGRES_URL,
  };

  res.status(200).json(envCheck);
}
