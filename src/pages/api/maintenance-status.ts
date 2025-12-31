import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const maintenanceMode = await db.getMaintenanceStatus();
    res.status(200).json({ maintenanceMode });
  } catch (error) {
    console.error('Error reading maintenance status:', error);
    // If there's an error, assume maintenance is off
    res.status(200).json({ maintenanceMode: false });
  }
}
