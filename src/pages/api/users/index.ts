import type { NextApiRequest, NextApiResponse } from "next";
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`Users API: ${req.method} request received`);

  if (req.method === "GET") {
    try {
      console.log("🔐 Fetching users from database");
      const users = await db.getAllUsers();
      console.log(`✅ Database returned ${users.length} users`);
      return res.status(200).json({
        users,
        totalUsers: users.length,
        lastUpdated: new Date().toISOString()
      });
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
