import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  if (req.method === 'GET') {
    try {
      const followData = JSON.parse(localStorage?.getItem('migistus_follows') || '[]');
      const userIdNum = parseInt(userId as string);
      
      const followers = followData.filter((follow: any) => follow.followingId === userIdNum);
      const following = followData.filter((follow: any) => follow.followerId === userIdNum);
      
      return res.status(200).json({
        userId: userIdNum,
        followersCount: followers.length,
        followingCount: following.length,
        followers: followers.map((f: any) => ({
          userId: f.followerId,
          timestamp: f.timestamp
        })),
        following: following.map((f: any) => ({
          userId: f.followingId,
          timestamp: f.timestamp
        }))
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch user follow data' });
    }
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
