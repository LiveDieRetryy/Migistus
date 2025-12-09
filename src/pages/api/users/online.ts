import type { NextApiRequest, NextApiResponse } from 'next';
import { getOnlineUsers, isUserOnline } from '@/lib/session';
import { UserStorage3 as UserStorage } from '@/utils/userStorage';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { userId, ignoreInvisible } = req.query;
    
    // Check specific user's online status
    if (userId) {
      const userIdNum = parseInt(userId as string);
      const online = isUserOnline(userIdNum);
      
      // If ignoreInvisible is true (when viewing own profile), return actual online status
      if (ignoreInvisible === 'true') {
        return res.status(200).json({ userId: userIdNum, online });
      }
      
      // Check if user is in invisible mode
      // First check in-memory map (for performance)
      let isInvisible = false;
      const visibilityMap = (global as any).visibilityMap || new Map();
      
      if (visibilityMap.has(userIdNum)) {
        isInvisible = visibilityMap.get(userIdNum) === true;
      } else {
        // If not in memory, check user profile (persistent storage)
        try {
          const userProfile = UserStorage.getUserProfile(userIdNum);
          if (userProfile?.isInvisible) {
            isInvisible = true;
            // Cache it in memory for future requests
            visibilityMap.set(userIdNum, true);
            (global as any).visibilityMap = visibilityMap;
          }
        } catch (error) {
          // Ignore errors, default to visible
        }
      }
      
      // If user is invisible, return offline even if they're online
      const visibleOnline = online && !isInvisible;
      
      return res.status(200).json({ userId: userIdNum, online: visibleOnline });
    }
    
    // Get all online users (excluding invisible ones)
    const onlineUsers = getOnlineUsers();
    const visibilityMap = (global as any).visibilityMap || new Map();
    
    // Filter out invisible users
    const visibleOnlineUsers = onlineUsers.filter(user => {
      // Check in-memory map first
      if (visibilityMap.has(user.userId)) {
        return !visibilityMap.get(user.userId);
      }
      
      // Check user profile
      try {
        const userProfile = UserStorage.getUserProfile(user.userId);
        if (userProfile?.isInvisible) {
          // Cache in memory
          visibilityMap.set(user.userId, true);
          (global as any).visibilityMap = visibilityMap;
          return false;
        }
      } catch (error) {
        // Ignore errors, default to visible
      }
      
      return true;
    });
    
    return res.status(200).json({ 
      count: visibleOnlineUsers.length,
      users: visibleOnlineUsers 
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
