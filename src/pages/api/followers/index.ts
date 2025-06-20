import { NextApiRequest, NextApiResponse } from 'next';

interface FollowData {
  followerId: number;
  followingId: number;
  timestamp: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get followers for a user
    const { userId, type } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    try {
      const followData = JSON.parse(localStorage?.getItem('migistus_follows') || '[]');
      
      if (type === 'followers') {
        // Get users following this user
        const followers = followData
          .filter((follow: FollowData) => follow.followingId === parseInt(userId as string))
          .map((follow: FollowData) => ({
            userId: follow.followerId,
            timestamp: follow.timestamp
          }));
        
        return res.status(200).json({ followers, count: followers.length });
      } else if (type === 'following') {
        // Get users this user is following
        const following = followData
          .filter((follow: FollowData) => follow.followerId === parseInt(userId as string))
          .map((follow: FollowData) => ({
            userId: follow.followingId,
            timestamp: follow.timestamp
          }));
        
        return res.status(200).json({ following, count: following.length });
      } else {
        // Get both followers and following counts
        const followers = followData.filter((follow: FollowData) => follow.followingId === parseInt(userId as string));
        const following = followData.filter((follow: FollowData) => follow.followerId === parseInt(userId as string));
          return res.status(200).json({
          followersCount: followers.length,
          followingCount: following.length,
          followers: followers.map((f: FollowData) => ({ userId: f.followerId, timestamp: f.timestamp })),
          following: following.map((f: FollowData) => ({ userId: f.followingId, timestamp: f.timestamp }))
        });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch follow data' });
    }
  }

  if (req.method === 'POST') {
    // Follow/unfollow a user
    const { followerId, followingId, action } = req.body;
    
    if (!followerId || !followingId) {
      return res.status(400).json({ error: 'followerId and followingId are required' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    try {
      const followData = JSON.parse(localStorage?.getItem('migistus_follows') || '[]');
      const existingFollowIndex = followData.findIndex(
        (follow: FollowData) => follow.followerId === followerId && follow.followingId === followingId
      );

      if (action === 'follow') {
        if (existingFollowIndex === -1) {
          // Add new follow
          followData.push({
            followerId,
            followingId,
            timestamp: new Date().toISOString()
          });
          
          // Track activity for both users
          if (typeof window !== 'undefined') {
            const { activityTracker } = require('@/utils/activityTracker');
            activityTracker.trackActivity({
              userId: followerId,
              type: 'social',
              action: `Started following user ${followingId}`,
              targetUserId: followingId
            });
            
            activityTracker.trackActivity({
              userId: followingId,
              type: 'social',
              action: `Gained a new follower (${followerId})`,
              targetUserId: followerId
            });
          }
        }
      } else if (action === 'unfollow') {
        if (existingFollowIndex !== -1) {
          // Remove follow
          followData.splice(existingFollowIndex, 1);
          
          // Track activity
          if (typeof window !== 'undefined') {
            const { activityTracker } = require('@/utils/activityTracker');
            activityTracker.trackActivity({
              userId: followerId,
              type: 'social',
              action: `Unfollowed user ${followingId}`,
              targetUserId: followingId
            });
          }
        }
      }

      localStorage?.setItem('migistus_follows', JSON.stringify(followData));
      
      // Get updated counts
      const followersCount = followData.filter((follow: FollowData) => follow.followingId === followingId).length;
      const followingCount = followData.filter((follow: FollowData) => follow.followerId === followerId).length;
      
      return res.status(200).json({
        success: true,
        isFollowing: action === 'follow',
        followersCount,
        followingCount
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update follow status' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
