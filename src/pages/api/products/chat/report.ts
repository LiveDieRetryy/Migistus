import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({ error: 'Deprecated', message: 'Use /api/moderation' });
}
