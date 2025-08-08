import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";

// Hardcoded admin credentials for fallback
const ADMIN_USER = "Admin";
const ADMIN_PASS = "Admin";

const USERS_PATH = path.resolve("public/data/users.json");

function readUsers() {
  try {
    if (!fs.existsSync(USERS_PATH)) {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const { username, password } = req.body;
  
  // First check hardcoded admin credentials
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.status(200).json({ success: true });
  }
  
  // Then check against users database for admin accounts
  const users = readUsers();
  const adminUser = users.find((u: any) => 
    (u.email === "admin@migistus.com" || u.username === "Administrator" || u.username === username || u.email === username) &&
    (u.tier === "Admin" || u.username === "Administrator" || u.email === "admin@migistus.com")
  );
  
  if (adminUser && adminUser.password) {
    try {
      const valid = await bcrypt.compare(password, adminUser.password);
      if (valid) {
        return res.status(200).json({ success: true });
      }
    } catch (error) {
      console.error("Error comparing password:", error);
    }
  }
  
  return res.status(401).json({ error: "Invalid admin credentials" });
}
