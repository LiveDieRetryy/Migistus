import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Hardcoded admin credentials for fallback
const ADMIN_USER = "Admin";
const ADMIN_PASS = "Admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const { username, password } = req.body;
  
  console.log("🔐 Admin login attempt:", username);
  
  // First check hardcoded admin credentials
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    console.log("✅ Hardcoded admin login successful");
    return res.status(200).json({ success: true });
  }
  
  // Then check against users database for admin accounts
  const users = await db.getAllUsers();
  const adminUser = users.find((u: any) => 
    (u.email === "admin@migistus.com" || u.username === "Administrator" || u.username === username || u.email === username) &&
    (u.tier === "Admin" || u.username === "Administrator" || u.email === "admin@migistus.com")
  );
  
  console.log("  - Admin user found:", adminUser ? `${adminUser.username} (${adminUser.email})` : "none");
  
  if (adminUser && adminUser.password) {
    console.log("  - Has password, validating...");
    try {
      const valid = await bcrypt.compare(password, adminUser.password);
      console.log("  - Password valid:", valid);
      if (valid) {
        console.log("✅ Database admin login successful");
        return res.status(200).json({ success: true });
      }
    } catch (error) {
      console.error("Error comparing password:", error);
    }
  } else if (adminUser) {
    console.log("  - Admin user found but no password!");
  }
  
  console.log("❌ Admin login failed");
  return res.status(401).json({ error: "Invalid admin credentials" });
}
