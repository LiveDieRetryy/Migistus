import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { createSession, setSessionCookie } from "@/lib/session";

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
  
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }
  
  // Security: reject passwords that are too short
  if (password.length < 3) {
    console.log("❌ Password too short (< 3 characters)");
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const users = readUsers();
  
  // Debug logging
  console.log("Login attempt with:", email);
  console.log("Available users:");
  users.forEach((u: any, index: number) => {
    console.log(`  ${index}: email="${u.email}", username="${u.username}"`);
  });
  
  // Allow login by username or email (case-insensitive)
  const userIndex = users.findIndex((u: any) => 
    u.email?.toLowerCase() === email.toLowerCase() || 
    u.username?.toLowerCase() === email.toLowerCase()
  );
  
  console.log("User search result:", userIndex);
  
  if (userIndex === -1) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const user = users[userIndex];
  
  // Check if user is banned
  if (user.banned) {
    return res.status(403).json({ error: "Account has been suspended" });
  }
  
  // Handle users without passwords (legacy accounts)
  if (!user.password) {
    console.log("❌ User has no password stored");
    return res.status(401).json({ 
      error: "Account needs password setup. Please contact support or reset your password." 
    });
  }
  
  console.log("🔐 Validating password...");
  console.log("  - Stored hash:", user.password.substring(0, 20) + "...");
  console.log("  - Password length:", password.length);
  
  const valid = await bcrypt.compare(password, user.password);
  
  console.log("  - Password valid:", valid);
  
  if (!valid) {
    console.log("❌ Invalid password for user:", user.username);
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  console.log("✅ Password validated successfully for user:", user.username);
  
  // Create server-side session
  const sessionToken = createSession(user.id, user.username, user.email, user.tier || "New Member");
  setSessionCookie(res, sessionToken);
  
  // Update login tracking
  users[userIndex] = {
    ...user,
    lastLogin: new Date().toISOString().split('T')[0],
    loginCount: (user.loginCount || 0) + 1
  };
  
  writeUsers(users);

  // Return user data (without sensitive information) - flattened structure
  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    tier: user.tier || "New Member",
    // Personal information (support both nested and flat structures)
    firstName: user.firstName || (user.profile?.firstName) || "",
    lastName: user.lastName || (user.profile?.lastName) || "",
    country: user.country || (user.profile?.country) || "",
    state: user.state || (user.profile?.state) || "",
    city: user.city || (user.profile?.city) || "",
    phoneNumber: user.phoneNumber || (user.profile?.phoneNumber) || "",
    dateOfBirth: user.dateOfBirth || (user.profile?.dateOfBirth) || "",
    avatar: user.avatar || (user.profile?.avatar) || null,
    bio: user.bio || (user.profile?.bio) || "",
    joinDate: user.joinDate || (user.profile?.joinedDate) || new Date().toISOString().split('T')[0],
    // Stats (support both nested and flat structures)
    totalPledges: user.totalPledges || (user.stats?.totalPledges) || 0,
    totalVotes: user.totalVotes || (user.stats?.totalVotes) || 0,
    dropsJoined: user.dropsJoined || (user.stats?.dropsJoined) || 0,
    followers: user.followers || (user.stats?.followers) || 0,
    following: user.following || (user.stats?.following) || 0,
    profileViews: user.profileViews || (user.stats?.profileViews) || 0,
    // Tokens and wallet
    guildTokens: user.guildTokens || user.guildCoins || 0,
    guildCoins: user.guildCoins || user.guildTokens || 0,
    wallet: user.wallet || 0,
    verified: user.verified || false,
    // Preferences (support both nested and flat structures)
    agreeToMarketing: user.agreeToMarketing || (user.preferences?.agreeToMarketing) || false,
    emailNotifications: user.emailNotifications || (user.preferences?.emailNotifications) || true,
    theme: user.theme || (user.preferences?.theme) || "dark",
    language: user.language || (user.preferences?.language) || "en"
  };

  res.status(200).json({ 
    success: true, 
    user: userResponse,
    message: `Welcome back, ${user.username}!`
  });
}
