import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";

const USERS_PATH = path.resolve("public/data/users.json");

function readUsers() {
  try {
    if (!fs.existsSync(USERS_PATH)) {
      const initialData = { users: [] };
      fs.writeFileSync(USERS_PATH, JSON.stringify(initialData, null, 2));
      return [];
    }
    
    const fileContent = fs.readFileSync(USERS_PATH, "utf-8");
    const data = JSON.parse(fileContent);
    
    // Handle both old flat array format and new object format
    if (Array.isArray(data)) {
      return data;
    } else if (data.users && Array.isArray(data.users)) {
      return data.users;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

function writeUsers(users: any[]) {
  try {
    // Ensure directory exists
    const dir = path.dirname(USERS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write in the expected format (object with users array)
    const data = { users };
    fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing users file:", error);
    throw new Error("Failed to save user data");
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const { email, newPassword, adminKey } = req.body;
  
  // Simple security check - require admin key for password reset
  if (adminKey !== "migistus-admin-reset-2025") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  if (!email || !newPassword) {
    return res.status(400).json({ error: "Missing email or new password" });
  }
  
  const users = readUsers();
  const userIndex = users.findIndex((u: any) => u.email === email || u.username === email);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  
  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update user password
  users[userIndex] = {
    ...users[userIndex],
    password: hashedPassword,
    updatedAt: new Date().toISOString()
  };
  
  writeUsers(users);
  
  res.status(200).json({ 
    success: true, 
    message: `Password updated for user: ${users[userIndex].username || users[userIndex].email}` 
  });
}
