import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const ACTIVITY_PATH = path.resolve("public/data/user-activity.json");

function ensureDataDirectory() {
  const dataDir = path.dirname(ACTIVITY_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readActivity() {
  ensureDataDirectory();
  if (!fs.existsSync(ACTIVITY_PATH)) {
    fs.writeFileSync(ACTIVITY_PATH, "[]");
    return [];
  }
  try {
    const data = fs.readFileSync(ACTIVITY_PATH, "utf-8");
    const parsed = JSON.parse(data);
    
    // Handle both array format and old object format
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.activities)) {
      // Old format: {activities: [...]} - migrate to new format
      const activities = parsed.activities;
      fs.writeFileSync(ACTIVITY_PATH, JSON.stringify(activities, null, 2));
      return activities;
    } else {
      // Invalid format - reset to empty array
      console.warn('Invalid user-activity.json format, resetting to empty array');
      fs.writeFileSync(ACTIVITY_PATH, "[]");
      return [];
    }
  } catch (error) {
    console.error('Error reading activity file:', error);
    return [];
  }
}

function writeActivity(activities: any[]) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(ACTIVITY_PATH, JSON.stringify(activities, null, 2));
  } catch (error) {
    console.error('Error writing activity file:', error);
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { userId } = req.query;
    
    try {
      const activities = readActivity();
      
      if (userId) {
        const userActivities = activities.filter((a: any) => a.userId === parseInt(String(userId)));
        return res.status(200).json(userActivities);
      }
      
      return res.status(200).json(activities);
    } catch (error) {
      console.error('Error in activity GET:', error);
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST") {
    try {
      const activity = {
        ...req.body,
        timestamp: req.body.timestamp || new Date().toISOString(),
        id: Date.now() + Math.random()
      };
      
      const activities = readActivity();
      activities.unshift(activity);
      
      // Keep only last 1000 activities to prevent file bloat
      if (activities.length > 1000) {
        activities.splice(1000);
      }
      
      writeActivity(activities);
      
      // Also update session activity for online status tracking
      try {
        const { updateUserActivity } = require('@/lib/session');
        const { parse } = require('cookie');
        const cookies = parse(req.headers.cookie || '');
        const sessionToken = cookies.migistus_session;
        
        if (sessionToken) {
          updateUserActivity(sessionToken);
        }
      } catch (sessionError) {
        // Don't fail the activity save if session update fails
        console.debug('Session activity update failed:', sessionError);
      }
      
      return res.status(201).json({ success: true, activity });
    } catch (error) {
      console.error('Error in activity POST:', error);
      return res.status(500).json({ error: "Failed to save activity" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
