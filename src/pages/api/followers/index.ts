import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest, isUserOnline as isUserOnlineFile } from '@/lib/session';
import { db, isProduction } from '@/lib/db';
import fs from 'fs';
import path from 'path';

interface FollowData {
  followerId: number;
  followingId: number;
  timestamp: string;
}

interface User {
  id: number;
  username: string;
  followers: number;
  following: number;
  [key: string]: any;
}

const FOLLOWERS_FILE = path.join(process.cwd(), 'public', 'data', 'followers.json');
const USERS_FILE = path.join(process.cwd(), 'public', 'data', 'users.json');

function readFollowers(): FollowData[] {
  try {
    const data = fs.readFileSync(FOLLOWERS_FILE, 'utf-8');
    const json = JSON.parse(data);
    return json.follows || [];
  } catch {
    return [];
  }
}

function writeFollowers(follows: FollowData[]): void {
  fs.writeFileSync(FOLLOWERS_FILE, JSON.stringify({ follows }, null, 2));
}

function updateUserFollowerCounts(userId: number, followers: number, following: number): void {
  try {
    const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    const userIndex = usersData.users.findIndex((u: User) => u.id === userId);
    
    if (userIndex !== -1) {
      usersData.users[userIndex].followers = followers;
      usersData.users[userIndex].following = following;
      usersData.users[userIndex].updatedAt = new Date().toISOString();
      fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
    }
  } catch (error) {
    console.error('Failed to update user follower counts:', error);
  }
}

function readUsers(): User[] {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    const json = JSON.parse(data);
    return json.users || [];
  } catch {
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get followers for a user
    const { userId, type } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    try {
      if (isProduction()) {
        console.log('🔐 Production mode: Using database for followers');
        
        if (type === 'followers') {
          const followers = await db.getFollowers(parseInt(userId as string));
          
          // Get online status for all followers
          const followersWithStatus = await Promise.all(
            followers.map(async (f) => ({
              id: f.id,
              username: f.username,
              avatar: f.avatar,
              online: await db.isUserOnline(f.id, false)
            }))
          );
          
          return res.status(200).json({ 
            followers: followersWithStatus, 
            count: followersWithStatus.length 
          });
        } else if (type === 'following') {
          const following = await db.getFollowing(parseInt(userId as string));
          
          // Get online status for all following
          const followingWithStatus = await Promise.all(
            following.map(async (f) => ({
              id: f.id,
              username: f.username,
              avatar: f.avatar,
              online: await db.isUserOnline(f.id, false)
            }))
          );
          
          return res.status(200).json({ 
            following: followingWithStatus, 
            count: followingWithStatus.length 
          });
        } else {
          // Get both
          const [followers, following] = await Promise.all([
            db.getFollowers(parseInt(userId as string)),
            db.getFollowing(parseInt(userId as string))
          ]);
          
          // Get online status for all
          const [followersWithStatus, followingWithStatus] = await Promise.all([
            Promise.all(
              followers.map(async (f) => ({
                id: f.id,
                username: f.username,
                avatar: f.avatar,
                online: await db.isUserOnline(f.id, false)
              }))
            ),
            Promise.all(
              following.map(async (f) => ({
                id: f.id,
                username: f.username,
                avatar: f.avatar,
                online: await db.isUserOnline(f.id, false)
              }))
            )
          ]);
          
          return res.status(200).json({
            followers: followersWithStatus,
            following: followingWithStatus,
            followersCount: followersWithStatus.length,
            followingCount: followingWithStatus.length
          });
        }
      }
      
      // Development: Use file-based storage
      const followData = readFollowers();
      const users = readUsers();
      
      if (type === 'followers') {
        // Get users following this user
        const followerIds = followData
          .filter((follow: FollowData) => follow.followingId === parseInt(userId as string))
          .map((follow: FollowData) => follow.followerId);
        
        // Get full user details for followers
        const followers = followerIds.map(followerId => {
          const user = users.find(u => u.id === followerId);
          return user ? {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            online: isUserOnlineFile(user.id)
          } : null;
        }).filter(Boolean);
        
        return res.status(200).json({ followers, count: followers.length });
      } else if (type === 'following') {
        // Get users this user is following
        const followingIds = followData
          .filter((follow: FollowData) => follow.followerId === parseInt(userId as string))
          .map((follow: FollowData) => follow.followingId);
        
        // Get full user details for following
        const following = followingIds.map(followingId => {
          const user = users.find(u => u.id === followingId);
          return user ? {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            online: isUserOnlineFile(user.id)
          } : null;
        }).filter(Boolean);
        
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
      if (isProduction()) {
        console.log('🔐 Production mode: Using database for follow/unfollow');
        
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
      }
      
      // Development: Use file-based storage
      const followData = readFollowers();
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
          writeFollowers(followData);
          
          // Update follower counts in users.json
          // For the follower (the person doing the following):
          const followerUserFollowers = followData.filter(f => f.followingId === followerId).length; // People following them
          const followerUserFollowing = followData.filter(f => f.followerId === followerId).length; // People they follow
          updateUserFollowerCounts(followerId, followerUserFollowers, followerUserFollowing);
          
          // For the person being followed:
          const targetUserFollowers = followData.filter(f => f.followingId === followingId).length; // People following them
          const targetUserFollowing = followData.filter(f => f.followerId === followingId).length; // People they follow
          updateUserFollowerCounts(followingId, targetUserFollowers, targetUserFollowing);
          
          console.log(`✅ User ${followerId} followed user ${followingId} | Target now has ${targetUserFollowers} followers`);
          return res.status(200).json({ 
            success: true, 
            message: 'Successfully followed user',
            followerCount: targetUserFollowers,
            followingCount: followerUserFollowing
          });
        } else {
          return res.status(400).json({ error: 'Already following this user' });
        }
      } else if (action === 'unfollow') {
        if (existingFollowIndex !== -1) {
          // Remove follow
          followData.splice(existingFollowIndex, 1);
          writeFollowers(followData);
          
          // Update follower counts in users.json
          // For the follower (the person doing the unfollowing):
          const followerUserFollowers = followData.filter(f => f.followingId === followerId).length; // People following them
          const followerUserFollowing = followData.filter(f => f.followerId === followerId).length; // People they follow
          updateUserFollowerCounts(followerId, followerUserFollowers, followerUserFollowing);
          
          // For the person being unfollowed:
          const targetUserFollowers = followData.filter(f => f.followingId === followingId).length; // People following them
          const targetUserFollowing = followData.filter(f => f.followerId === followingId).length; // People they follow
          updateUserFollowerCounts(followingId, targetUserFollowers, targetUserFollowing);
          
          console.log(`✅ User ${followerId} unfollowed user ${followingId} | Target now has ${targetUserFollowers} followers`);
          return res.status(200).json({ 
            success: true, 
            message: 'Successfully unfollowed user',
            followerCount: targetUserFollowers,
            followingCount: followerUserFollowing
          });
        } else {
          return res.status(400).json({ error: 'Not following this user' });
        }
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
