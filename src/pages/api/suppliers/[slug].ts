import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;

  if (req.method === 'GET') {
    try {
      const profile = await db.getSupplierProfile(slug as string);
      
      if (!profile) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      return res.status(200).json({ profile });
    } catch (error) {
      console.error('Error fetching supplier profile:', error);
      return res.status(500).json({ error: 'Failed to fetch supplier profile' });
    }
  }

  if (req.method === 'PUT') {
    const session = await getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Check if user owns this profile
      const existingProfile = await db.getSupplierProfile(slug as string);
      if (!existingProfile || existingProfile.user_id !== session.userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const profile = await db.updateSupplierProfile(session.userId, req.body);

      return res.status(200).json({ profile });
    } catch (error) {
      console.error('Error updating supplier profile:', error);
      return res.status(500).json({ error: 'Failed to update supplier profile' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
