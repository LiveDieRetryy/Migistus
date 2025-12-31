import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { userId, ignoreInvisible } = req.query;
    
    try {
      // Check specific user's online status
      if (userId) {
        const userIdNum = parseInt(userId as string);
        const ignoreInvis = ignoreInvisible === 'true';
        
        const online = await db.isUserOnline(userIdNum, ignoreInvis);
        
        return res.status(200).json({ userId: userIdNum, online });
      }
      
      // Get all online users
      const onlineUsers = await db.getOnlineUsers();
      
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
