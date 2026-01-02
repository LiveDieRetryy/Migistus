import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get followers for a user
    const { userId, type } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    try {
      if (type === 'followers') {
        const followers = await db.getFollowers(parseInt(userId as string));
        
        // Get full user info including follower counts and tier for each follower
        const followersWithDetails = await Promise.all(
          followers.map(async (f) => {
            const userFollowers = await db.getFollowers(f.id);
            return {
              id: f.id,
              username: f.username,
              avatar: f.avatar,
              tier: f.tier || 'Initiate',
              followers: userFollowers.length,
              online: await db.isUserOnline(f.id, false)
            };
          })
        );
        
        return res.status(200).json({ 
          followers: followersWithDetails, 
          count: followersWithDetails.length 
        });
      } else if (type === 'following') {
        const following = await db.getFollowing(parseInt(userId as string));
        
        // Get full user info including follower counts and tier for each following
        const followingWithDetails = await Promise.all(
          following.map(async (f) => {
            const userFollowers = await db.getFollowers(f.id);
            return {
              id: f.id,
              username: f.username,
              avatar: f.avatar,
              tier: f.tier || 'Initiate',
              followers: userFollowers.length,
              online: await db.isUserOnline(f.id, false)
            };
          })
        );
        
        return res.status(200).json({ 
          following: followingWithDetails, 
          count: followingWithDetails.length 
        });
      } else {
        // Get both
        const [followers, following] = await Promise.all([
          db.getFollowers(parseInt(userId as string)),
          db.getFollowing(parseInt(userId as string))
        ]);
        
        // Get full user info for all
        const [followersWithDetails, followingWithDetails] = await Promise.all([
          Promise.all(
            followers.map(async (f) => {
              const userFollowers = await db.getFollowers(f.id);
              return {
                id: f.id,
                username: f.username,
                avatar: f.avatar,
                tier: f.tier || 'Initiate',
                followers: userFollowers.length,
                online: await db.isUserOnline(f.id, false)
              };
            })
          ),
          Promise.all(
            following.map(async (f) => {
              const userFollowers = await db.getFollowers(f.id);
              return {
                id: f.id,
                username: f.username,
                avatar: f.avatar,
                tier: f.tier || 'Initiate',
                followers: userFollowers.length,
                online: await db.isUserOnline(f.id, false)
              };
            })
          )
        ]);
        
        return res.status(200).json({
          followers: followersWithDetails,
          following: followingWithDetails,
          followersCount: followersWithDetails.length,
          followingCount: followingWithDetails.length
        });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch follow data' });
    }
  }

  if (req.method === 'POST') {
    // Follow/unfollow a user
    const session = await getSessionFromRequest(req);
    
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { followingId, action } = req.body;
    const followerId = session.userId;
    
    if (!followingId) {
      return res.status(400).json({ error: 'followingId is required' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    try {
      if (action === 'follow') {
        await db.followUser(followerId, followingId);
        console.log(`✅ User ${followerId} followed user ${followingId}`);
        return res.status(200).json({ 
          success: true, 
          message: 'Successfully followed user'
        });
      } else if (action === 'unfollow') {
        await db.unfollowUser(followerId, followingId);
        console.log(`✅ User ${followerId} unfollowed user ${followingId}`);
        return res.status(200).json({ 
          success: true, 
          message: 'Successfully unfollowed user'
        });
      } else {
        return res.status(400).json({ error: 'Invalid action. Use "follow" or "unfollow"' });
      }
    } catch (error) {
      console.error('Followers API error:', error);
      return res.status(500).json({ error: 'Failed to update follow status' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
