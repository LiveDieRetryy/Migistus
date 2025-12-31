import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  if (req.method === 'GET') {
    try {
      const userIdNum = parseInt(userId as string);
      
      const [followers, following] = await Promise.all([
        db.getFollowers(userIdNum),
        db.getFollowing(userIdNum)
      ]);
      
      return res.status(200).json({
        userId: userIdNum,
        followersCount: followers.length,
        followingCount: following.length,
        followers: followers.map((f: any) => ({
          userId: f.id,
          username: f.username,
          avatar: f.avatar
        })),
        following: following.map((f: any) => ({
          userId: f.id,
          username: f.username,
          avatar: f.avatar
        }))
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch user follow data' });
    }
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
