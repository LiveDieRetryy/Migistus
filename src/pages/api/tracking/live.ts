import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const TRACKING_PATH = path.resolve("public/data/user-tracking");
const SESSIONS_PATH = path.resolve("public/data/user-sessions.json");
const ACTIVITY_PATH = path.resolve("public/data/user-activity.json");

function ensureDataDirectory() {
  if (!fs.existsSync(TRACKING_PATH)) {
    fs.mkdirSync(TRACKING_PATH, { recursive: true });
  }
}

function readSessions() {
  if (!fs.existsSync(SESSIONS_PATH)) {
    fs.writeFileSync(SESSIONS_PATH, "[]");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(SESSIONS_PATH, "utf-8"));
  } catch (error) {
    console.error('Error reading sessions:', error);
    return [];
  }
}

function writeSessions(sessions: any[]) {
  try {
    fs.writeFileSync(SESSIONS_PATH, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Error writing sessions:', error);
  }
}

function readActivity() {
  if (!fs.existsSync(ACTIVITY_PATH)) {
    fs.writeFileSync(ACTIVITY_PATH, "[]");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(ACTIVITY_PATH, "utf-8"));
  } catch (error) {
    console.error('Error reading activity:', error);
    return [];
  }
}

function writeActivity(activities: any[]) {
  try {
    fs.writeFileSync(ACTIVITY_PATH, JSON.stringify(activities, null, 2));
  } catch (error) {
    console.error('Error writing activity:', error);
  }
}

function trackUserActivity(userId: number, sessionId: string, activity: any) {
  const activities = readActivity();
  const newActivity = {
    id: Date.now() + Math.random(),
    userId,
    sessionId,
    ...activity,
    timestamp: new Date().toISOString()
  };
  
  activities.unshift(newActivity);
  
  // Keep only last 1000 activities
  if (activities.length > 1000) {
    activities.splice(1000);
  }
  
  writeActivity(activities);
  return newActivity;
}

function updateUserSession(userId: number, sessionId: string, updates: any) {
  const sessions = readSessions();
  const sessionIndex = sessions.findIndex((s: any) => 
    s.userId === userId && s.sessionId === sessionId
  );
  
  if (sessionIndex !== -1) {
    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      ...updates,
      lastActivity: new Date().toISOString()
    };
  } else {
    // Create new session
    sessions.push({
      userId,
      sessionId,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ...updates
    });
  }
  
  writeSessions(sessions);
  return sessions[sessionIndex] || sessions[sessions.length - 1];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { userId, sessionId, type, action, details, page } = req.body;
      
      if (!userId || !sessionId) {
        return res.status(400).json({ error: "userId and sessionId are required" });
      }
      
      // Track the activity
      const activity = trackUserActivity(userId, sessionId, {
        type: type || 'navigation',
        action: action || 'page_visit',
        page,
        details: details || {},
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      });
      
      // Update session info
      const session = updateUserSession(userId, sessionId, {
        currentPage: page,
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      });
      
      return res.status(200).json({ 
        success: true, 
        activity,
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
      
      let activities = readActivity();
      
      // Filter by user if specified
      if (userId) {
        activities = activities.filter((a: any) => a.userId === parseInt(userId as string));
      }
      
      // Filter by session if specified
      if (sessionId) {
        activities = activities.filter((a: any) => a.sessionId === sessionId);
      }
      
      // Filter by type if specified
      if (type) {
        activities = activities.filter((a: any) => a.type === type);
      }
      
      // Limit results
      activities = activities.slice(0, parseInt(limit as string));
      
      return res.status(200).json(activities);
      
    } catch (error) {
      console.error('Live tracking GET error:', error);
      return res.status(500).json({ error: "Failed to get activities" });
    }
  }
  
  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
