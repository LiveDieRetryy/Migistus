import type { NextApiRequest, NextApiResponse } from "next";
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { userId, sessionId, type, action, details, page } = req.body;
      
      if (!userId || !sessionId) {
        return res.status(400).json({ error: "userId and sessionId are required" });
      }

      const userAgent = req.headers['user-agent'] || 'unknown';
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

      // Create analytics event
      const event = await db.createAnalyticsEvent({
        eventType: type || 'navigation',
        userId: parseInt(userId),
        sessionId,
        pageUrl: page,
        metadata: {
          action: action || 'page_visit',
          details: details || {},
          userAgent,
          ip: ipAddress
        },
        userAgent,
        ipAddress
      });

      // Update or create session
      const session = await db.createUserSession({
        userId: parseInt(userId),
        sessionId,
        currentPage: page,
        userAgent,
        ipAddress
      });

      return res.status(200).json({ 
        success: true, 
        activity: event,
        session 
      });
      
    } catch (error) {
      console.error('Live tracking error:', error);
      return res.status(500).json({ error: "Failed to track activity" });
    }
  }
  
  if (req.method === "GET") {
    try {
      const { userId, sessionId, type, limit = 50 } = req.query;

      const events = await db.getAnalyticsEvents({
        userId: userId ? parseInt(userId as string) : undefined,
        sessionId: sessionId as string,
        eventType: type as string,
        limit: parseInt(limit as string)
      });

      return res.status(200).json(events);
      
    } catch (error) {
      console.error('Live tracking GET error:', error);
      return res.status(500).json({ error: "Failed to get activities" });
    }
  }
  
  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

