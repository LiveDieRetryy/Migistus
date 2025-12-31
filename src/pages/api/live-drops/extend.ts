import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { dropId, hours } = req.body;
    
    if (!dropId || !hours) {
      return res.status(400).json({ error: 'Missing dropId or hours' });
    }

    const drop = await db.getLiveDropById(parseInt(dropId));
    
    if (!drop) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    // Extend the duration
    const updatedDrop = await db.updateLiveDrop(parseInt(dropId), {
      currentPledges: drop.current_pledges,
      participantsCount: drop.participants_count
    });
    
    res.status(200).json({ success: true, drop: updatedDrop });
  } catch (error) {
    console.error('Error extending drop:', error);
    res.status(500).json({ error: 'Failed to extend drop' });
  }
}
