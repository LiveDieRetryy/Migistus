import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { dropId, status } = req.body;
    
    if (!dropId || !status) {
      return res.status(400).json({ error: 'Missing dropId or status' });
    }

    const drop = await db.getLiveDropById(parseInt(dropId));
    
    if (!drop) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    const updates: any = { status };
    
    if (status === 'completed' || status === 'ended') {
      updates.endTime = new Date().toISOString();
    }
    
    const updatedDrop = await db.updateLiveDrop(parseInt(dropId), updates);
    
    res.status(200).json({ success: true, drop: updatedDrop });
  } catch (error) {
    console.error('Error updating drop status:', error);
    res.status(500).json({ error: 'Failed to update drop status' });
  }
}
