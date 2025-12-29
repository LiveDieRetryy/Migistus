import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

/**
 * Server-Sent Events (SSE) endpoint for real-time updates
 * Works on Vercel without Socket.IO!
 * 
 * Client connects and receives:
 * - New messages
 * - Online user updates
 * - Typing indicators
 * - Notifications
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = parseInt(req.query.userId as string);
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  let lastMessageCheck = Date.now();
  let lastOnlineCheck = Date.now();

  // Poll database for updates every 2 seconds
  const intervalId = setInterval(async () => {
    try {
      // Check for new messages
      if (Date.now() - lastMessageCheck >= 2000) {
        try {
          const messages = await sql`
            SELECT dm.*, 
                   c.user1_id, 
                   c.user2_id,
                   u.username as sender_username
            FROM direct_messages dm
            JOIN conversations c ON dm.conversation_id = c.id
            JOIN users u ON dm.sender_id = u.id
            WHERE (c.user1_id = ${userId} OR c.user2_id = ${userId})
              AND dm.created_at > NOW() - INTERVAL '3 seconds'
            ORDER BY dm.created_at DESC
            LIMIT 10
          `;

          if (messages.rows.length > 0) {
            res.write(`data: ${JSON.stringify({ 
              type: 'messages', 
              data: messages.rows 
            })}\n\n`);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
        
        lastMessageCheck = Date.now();
      }

      // Check for online users every 5 seconds
      if (Date.now() - lastOnlineCheck >= 5000) {
        try {
          const onlineUsers = await sql`
            SELECT DISTINCT user_id 
            FROM sessions 
            WHERE is_active = true 
              AND expires_at > NOW()
              AND last_active > NOW() - INTERVAL '5 minutes'
          `;

          res.write(`data: ${JSON.stringify({ 
            type: 'online', 
            data: onlineUsers.rows.map(row => row.user_id)
          })}\n\n`);
        } catch (error) {
          console.error('Error fetching online users:', error);
        }
        
        lastOnlineCheck = Date.now();
      }

      // Send heartbeat to keep connection alive
      res.write(`:heartbeat\n\n`);

    } catch (error) {
      console.error('SSE error:', error);
    }
  }, 2000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(intervalId);
    console.log(`[SSE] User ${userId} disconnected`);
  });
}
