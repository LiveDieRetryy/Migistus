import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { db, isProduction } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/session";

// Fallback to file-based auth in development
import fs from "fs";
import path from "path";

const USERS_PATH = path.resolve("public/data/users.json");

function readUsersFile() {
  try {
    if (!fs.existsSync(USERS_PATH)) {
      return [];
    }
    const fileContent = fs.readFileSync(USERS_PATH, "utf-8");
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : (data.users || []);
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
  
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }
  
  // Security: reject passwords that are too short
  if (password.length < 3) {
    console.log("❌ Password too short (< 3 characters)");
    return res.status(401).json({ error: "Invalid credentials" });
  }

  try {
    let user: any = null;

    // Use database in production, fallback to files in development
    console.log("🔍 Environment check:", {
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
      isProduction: isProduction(),
      hasPostgresUrl: !!process.env.POSTGRES_URL
    });

    if (isProduction()) {
      console.log("🔐 Production mode: Using database authentication");
      user = await db.getUserByEmailOrUsername(email.toLowerCase());
      console.log("✅ Database query successful, user found:", !!user);
    } else {
      console.log("🔐 Development mode: Using file-based authentication");
      const users = readUsersFile();
      const foundUser = users.find((u: any) => 
        u.email?.toLowerCase() === email.toLowerCase() || 
        u.username?.toLowerCase() === email.toLowerCase()
      );
      user = foundUser || null;
    }

    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user is banned
    if (user.banned) {
      return res.status(403).json({ error: "Account has been suspended" });
    }

    // Check if email is verified
    const emailVerified = user.email_verified !== false; // Default to true for legacy accounts
    if (!emailVerified) {
      console.log("⚠️ Email not verified for user:", email);
      return res.status(403).json({ 
        error: "Email not verified",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
        username: user.username,
        message: "Please verify your email address before logging in."
      });
    }

    // Handle users without passwords (legacy accounts)
    const passwordHash = user.password_hash || user.password;
    if (!passwordHash) {
      console.log("❌ User has no password stored");
      return res.status(401).json({ 
        error: "Account needs password setup. Please contact support or reset your password." 
      });
    }

    console.log("🔐 Validating password...");
    const valid = await bcrypt.compare(password, passwordHash);

    if (!valid) {
      console.log("❌ Invalid password for user:", user.username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("✅ Password validated successfully for user:", user.username);

    // Create session using session library
    const sessionToken = await createSession(
      user.id, 
      user.username, 
      user.email, 
      user.tier || "Initiate"
    );
    
    setSessionCookie(res, sessionToken);

    // Update last login in database (production only)
    if (isProduction()) {
      await db.updateLastLogin(user.id);
    }

    // Return user data (without sensitive information)
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      tier: user.tier || "Initiate",
      firstName: user.first_name || user.firstName || "",
      lastName: user.last_name || user.lastName || "",
      country: user.country || "",
      state: user.state || "",
      city: user.city || "",
      phoneNumber: user.phone_number || user.phoneNumber || "",
      dateOfBirth: user.date_of_birth || user.dateOfBirth || "",
      avatar: user.avatar || null,
      bio: user.bio || "",
      joinDate: user.created_at || user.joinDate || new Date().toISOString().split('T')[0],
      verified: user.verified || false,
    };

    res.status(200).json({ 
      success: true, 
      user: userResponse,
      message: `Welcome back, ${user.username}!`
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error during login" });
  }
}
