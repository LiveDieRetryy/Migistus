import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const SESSIONS_PATH = path.resolve("public/data/user-sessions.json");

function ensureDataDirectory() {
  const dataDir = path.dirname(SESSIONS_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readSessions() {
  ensureDataDirectory();
  if (!fs.existsSync(SESSIONS_PATH)) {
    fs.writeFileSync(SESSIONS_PATH, "[]");
    return [];
  }
  try {
    const data = fs.readFileSync(SESSIONS_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading sessions file:', error);
    return [];
  }
}

function writeSessions(sessions: any[]) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(SESSIONS_PATH, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Error writing sessions file:', error);
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const sessions = readSessions();
      const now = Date.now();
      const activeSessions = sessions.filter((s: any) => {
        const lastActivity = s.lastActivity || s.loginTime;
        if (!lastActivity) return false;
        const sessionAge = now - new Date(lastActivity).getTime();
        return sessionAge < 24 * 60 * 60 * 1000;
      });
      
      if (activeSessions.length !== sessions.length) {
        writeSessions(activeSessions);
      }
      
      return res.status(200).json(activeSessions);
    } catch (error) {
      console.error('Error in sessions GET:', error);
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST") {
    try {
      const { userId, action, sessionId, page, userAgent, ip, timestamp } = req.body;
      const sessions = readSessions();
      const now = timestamp || new Date().toISOString();
      
      if (action === "login") {
        const session = {
          userId,
          sessionId,
          loginTime: now,
          lastActivity: now,
          currentPage: page || "/",
          userAgent: userAgent || "",
          ip: ip || "",
          isActive: true
        };
        sessions.push(session);
      } else if (action === "logout") {
        const sessionIndex = sessions.findIndex((s: any) => 
          s.userId === userId && s.sessionId === sessionId
        );
        if (sessionIndex !== -1) {
          sessions[sessionIndex].isActive = false;
          sessions[sessionIndex].logoutTime = now;
          sessions[sessionIndex].lastActivity = now;
        }
      } else if (action === "heartbeat") {
        const sessionIndex = sessions.findIndex((s: any) => 
          s.userId === userId && s.sessionId === sessionId && s.isActive
        );
        if (sessionIndex !== -1) {
          sessions[sessionIndex].lastActivity = now;
          if (page) sessions[sessionIndex].currentPage = page;
        }
      }
      
      writeSessions(sessions);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in sessions POST:', error);
      return res.status(500).json({ error: "Failed to update session" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
