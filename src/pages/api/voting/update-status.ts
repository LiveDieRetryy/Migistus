import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { pollId, status } = req.body;
    
    if (!pollId || !status) {
      return res.status(400).json({ error: 'Missing pollId or status' });
    }

    const poll = await db.getCommunityPoll(parseInt(pollId));
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const updatedPoll = await db.updateCommunityPoll(parseInt(pollId), { status });
    
    res.status(200).json({ success: true, poll: updatedPoll });
  } catch (error) {
    console.error('Error updating poll status:', error);
    res.status(500).json({ error: 'Failed to update poll status' });
  }
}
