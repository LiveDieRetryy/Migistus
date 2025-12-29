import type { NextApiRequest, NextApiResponse } from 'next';
import { db, isProduction } from '@/lib/db';
import { isUserOnline as isUserOnlineFile, getOnlineUsers as getOnlineUsersFile } from '@/lib/session';
import { UserStorage3 as UserStorage } from '@/utils/userStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { userId, ignoreInvisible } = req.query;
    
    try {
      // Check specific user's online status
      if (userId) {
        const userIdNum = parseInt(userId as string);
        const ignoreInvis = ignoreInvisible === 'true';
        
        let online = false;
        
        if (isProduction()) {
          // Production: Check database
          online = await db.isUserOnline(userIdNum, ignoreInvis);
        } else {
          // Development: Check file
          online = isUserOnlineFile(userIdNum);
          
          // If not ignoring invisible, check user profile for invisible mode
          if (online && !ignoreInvis) {
            try {
              const userProfile = UserStorage.getUserProfile(userIdNum);
              if (userProfile?.isInvisible) {
                online = false;
              }
            } catch (error) {
              // Ignore errors, default to visible
            }
          }
        }
        
        return res.status(200).json({ userId: userIdNum, online });
      }
      
      // Get all online users
      let onlineUsers;
      
      if (isProduction()) {
        // Production: Get from database
        onlineUsers = await db.getOnlineUsers();
      } else {
        // Development: Get from file
        const usersFromFile = getOnlineUsersFile();
        
        // Filter out invisible users in development
        const visibilityMap = (global as any).visibilityMap || new Map();
        onlineUsers = usersFromFile.filter(user => {
          if (visibilityMap.has(user.userId)) {
            return !visibilityMap.get(user.userId);
          }
          
          try {
            const userProfile = UserStorage.getUserProfile(user.userId);
            if (userProfile?.isInvisible) {
              visibilityMap.set(user.userId, true);
              (global as any).visibilityMap = visibilityMap;
              return false;
            }
          } catch (error) {
            // Ignore errors, default to visible
          }
          
          return true;
        });
      }
      
      return res.status(200).json({ 
        count: onlineUsers.length,
        users: onlineUsers 
      });
    } catch (error) {
      console.error('Error checking online status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
