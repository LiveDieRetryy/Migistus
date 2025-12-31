import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const users = await db.getAllUsers();
    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
      total: users.length,
      newToday: users.filter((user: any) => 
        user.joinDate === today || user.createdAt?.startsWith(today)
      ).length,
      active: users.filter((user: any) => {
        if (!user.lastLogin) return false;
        const lastLogin = new Date(user.lastLogin);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return lastLogin > dayAgo;
      }).length,
      optedInMarketing: users.filter((user: any) => user.agreeToMarketing === true).length,
      byTier: {
        'New Initiate': users.filter((user: any) => user.tier === 'New Initiate').length,
        'New Member': users.filter((user: any) => user.tier === 'New Member').length,
        'Subscriber': users.filter((user: any) => user.tier === 'Subscriber').length,
        'Premium': users.filter((user: any) => user.tier === 'Premium').length,
        'Admin': users.filter((user: any) => user.tier === 'Admin').length,
      }
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error generating user stats:', error);
    res.status(500).json({ error: 'Failed to generate user statistics' });
  }
}
