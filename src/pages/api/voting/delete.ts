import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { pollId } = req.body;
    
    if (!pollId) {
      return res.status(400).json({ error: 'Missing pollId' });
    }

    const poll = await db.getCommunityPoll(parseInt(pollId));
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    await db.deleteCommunityPoll(parseInt(pollId));
    
    res.status(200).json({ success: true, message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ error: 'Failed to delete poll' });
  }
}
