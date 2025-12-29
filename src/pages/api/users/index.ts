import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { db, isProduction } from '@/lib/db';

const usersFilePath = path.resolve("public/data/users.json");

function ensureDataDirectory() {
  const dataDir = path.dirname(usersFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readUsers() {
  ensureDataDirectory();
  if (!fs.existsSync(usersFilePath)) {
    const initialData = {
      users: [],
      totalUsers: 0,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(usersFilePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));
    if (!data.users || !Array.isArray(data.users)) {
      return {
        users: [],
        totalUsers: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    return data;
  } catch (error) {
    console.error('Error reading users file:', error);
    return {
      users: [],
      totalUsers: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

function writeUsers(data: any) {
  ensureDataDirectory();
  try {
    const dataToWrite = {
      ...data,
      totalUsers: Array.isArray(data.users) ? data.users.length : 0,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(usersFilePath, JSON.stringify(dataToWrite, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`Users API: ${req.method} request received`);

  if (req.method === "GET") {
    try {
      if (isProduction()) {
        console.log("🔐 Production mode: Fetching users from database");
        const users = await db.getAllUsers();
        console.log(`✅ Database returned ${users.length} users`);
        return res.status(200).json({
          users,
          totalUsers: users.length,
          lastUpdated: new Date().toISOString()
        });
      } else {
        console.log("🔓 Development mode: Reading users from file");
        const data = readUsers();
        console.log(`Users API GET: Returning ${data.users.length} users`);
        return res.status(200).json(data);
      }
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
    try {
      console.log('Users API POST: Request body:', req.body);
      
      if (!req.body) {
        return res.status(400).json({ error: "No data provided" });
      }

      const newUsers = Array.isArray(req.body) ? req.body : [req.body];
      
      if (newUsers.length === 0) {
        return res.status(400).json({ error: "No users provided" });
      }

      console.log(`Users API POST: Processing ${newUsers.length} users`);

      const data = readUsers();
      
      let addedCount = 0;
      const existingIds = new Set(data.users.map((u: any) => u.id));
      const existingEmails = new Set(data.users.map((u: any) => u.email?.toLowerCase()));

      for (const user of newUsers) {
        if (!user.id || !user.username || !user.email) {
          console.warn('Skipping invalid user:', user);
          continue;
        }

        if (existingIds.has(user.id) || existingEmails.has(user.email.toLowerCase())) {
          console.log(`User already exists: ${user.username} (${user.email})`);
          continue;
        }

        const userToAdd = {
          id: user.id,
          username: user.username,
          email: user.email,
          tier: user.tier || 'Initiate',
          banned: user.banned || false,
          joinDate: user.joinDate || new Date().toISOString().split('T')[0],
          lastLogin: user.lastLogin || new Date().toISOString().split('T')[0],
          wallet: user.wallet || 0,
          guildCoins: user.guildCoins || 0
        };

        data.users.push(userToAdd);
        existingIds.add(user.id);
        existingEmails.add(user.email.toLowerCase());
        addedCount++;
        
        console.log(`Added user: ${userToAdd.username}`);
      }

      const writeSuccess = writeUsers(data);
      
      if (!writeSuccess) {
        return res.status(500).json({ error: "Failed to save users" });
      }

      console.log(`Users API POST: Successfully added ${addedCount} users`);
      
      return res.status(201).json({ 
        success: true, 
        addedUsers: addedCount,
        totalUsers: data.users.length,
        message: `Successfully added ${addedCount} user(s)`
      });
      
    } catch (error) {
      console.error('Users API POST error:', error);
      return res.status(500).json({ 
        error: "Failed to save users",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
