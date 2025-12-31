import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const polls = await db.getCommunityPolls();
    const votes = await db.getVotes();
    
    const stats = {
      activePolls: polls.filter((poll: any) => poll.status === 'active').length,
      totalPolls: polls.length,
      pendingApproval: polls.filter((poll: any) => poll.status === 'pending').length,
      totalVotes: votes.length,
      votesToday: votes.filter((vote: any) => {
        const today = new Date().toISOString().split('T')[0];
        return vote.timestamp?.startsWith(today);
      }).length,
      topCategories: polls.reduce((acc: any, poll: any) => {
        const category = poll.category || 'General';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error generating voting stats:', error);
    res.status(500).json({ error: 'Failed to generate voting statistics' });
  }
}
