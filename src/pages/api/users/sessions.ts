import type { NextApiRequest, NextApiResponse } from "next";
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      // Get all active sessions from database
      const sessions = await db.getAllActiveSessions();
      
      // Filter to only sessions active in last 24 hours
      const now = Date.now();
      const activeSessions = sessions.filter((s: any) => {
        const lastActivity = s.last_active;
        if (!lastActivity) return false;
        const sessionAge = now - new Date(lastActivity).getTime();
        return sessionAge < 24 * 60 * 60 * 1000;
      });
      
      // Format response to match expected structure
      const formattedSessions = activeSessions.map((s: any) => ({
        userId: s.user_id,
        sessionId: s.session_id,
        loginTime: s.created_at,
        lastActivity: s.last_active,
        currentPage: s.current_page,
        userAgent: s.user_agent,
        ip: s.ip_address,
        isActive: s.is_active,
        username: s.username,
        email: s.email,
        tier: s.tier
      }));
      
      return res.status(200).json(formattedSessions);
    } catch (error) {
      console.error('Error in sessions GET:', error);
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST") {
    try {
      const { userId, action, sessionId, page, userAgent, ip, timestamp } = req.body;
      
      if (action === "login") {
        // Session creation is handled by the auth endpoints
        // This just updates the activity
        await db.updateSessionPage(sessionId, page || "/", ip, userAgent);
      } else if (action === "logout") {
        await db.endSession(sessionId);
      } else if (action === "heartbeat") {
        await db.updateSessionPage(sessionId, page, ip, userAgent);
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in sessions POST:', error);
      return res.status(500).json({ error: "Failed to update session" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

