import type { NextApiRequest, NextApiResponse } from "next";
import { db } from '@/lib/db';
import { appCache as cache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`Users API: ${req.method} request received`);

  if (req.method === "GET") {
    try {
      // Try cache first
      const cacheKey = 'users:all';
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log("✅ Returning cached users");
        return res.status(200).json(cached);
      }

      console.log("🔐 Fetching users from database");
      const users = await db.getAllUsers();
      console.log(`✅ Database returned ${users.length} users`);
      
      const response = {
        users,
        totalUsers: users.length,
        lastUpdated: new Date().toISOString()
      };
      
      // Cache for 120 seconds (2 minutes)
      cache.set(cacheKey, response, 120 * 1000);
      
      return res.status(200).json(response);
    } catch (error) {
      console.error('Users API GET error:', error);
      return res.status(500).json({ 
        error: "Failed to read users", 
        users: [], 
        totalUsers: 0 
      });
    }
  }

  if (req.method === "POST") {
    return res.status(501).json({ 
      error: "User creation via bulk POST is not supported",
      message: "Use the registration endpoint to create users"
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
