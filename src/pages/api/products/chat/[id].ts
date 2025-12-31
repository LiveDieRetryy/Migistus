import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionToken, getSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Product chat has been migrated to database-based messaging
  // This endpoint is deprecated - use the conversations API instead
  
  return res.status(410).json({ 
    error: 'This endpoint has been deprecated',
    message: 'Product chat has been migrated to the conversations API. Please use /api/conversations endpoints instead.'
  });
}
