import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { createSession, setSessionCookie } from "@/lib/session";

const USERS_PATH = path.resolve("public/data/users.json");

function readUsers() {
  try {
    if (!fs.existsSync(USERS_PATH)) {
      // Create the file with proper structure
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
    const jsonString = JSON.stringify(data, null, 2);
    
    // Write synchronously to ensure completion
    fs.writeFileSync(USERS_PATH, jsonString, { encoding: 'utf-8', flag: 'w' });
    
    console.log(`📁 File written to: ${USERS_PATH}`);
    console.log(`📊 File size: ${jsonString.length} bytes`);
    
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
    const { 
    username, 
    email, 
    password,
    firstName,
    lastName,
    dateOfBirth,
    country,
    state,
    city,
    phoneNumber,
    referralSource,
    agreeToTerms,
    agreeToMarketing
  } = req.body;
  
  // Validate required fields
  if (!username || !email || !password || !firstName || !lastName || !dateOfBirth || !country) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate terms agreement
  if (!agreeToTerms) {
    return res.status(400).json({ error: "You must agree to the Terms of Service" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long" });
  }

  // Validate age (must be 13 or older)
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  if (age < 13) {
    return res.status(400).json({ error: "You must be at least 13 years old to register" });
  }

  const users = readUsers();
  
  // Check for existing email
  if (users.some((u: any) => u.email === email)) {
    return res.status(400).json({ error: "Email already registered" });
  }

  // Check for existing username
  if (users.some((u: any) => u.username === username)) {
    return res.status(400).json({ error: "Username already taken" });
  }

  const hash = await bcrypt.hash(password, 10);
    const newUser = {
    id: Date.now(),
    username,
    email,
    password: hash,
    tier: "New Member",
    banned: false,
    verified: false,
    joinDate: new Date().toISOString().split('T')[0],
    lastLogin: null,
    wallet: 0,
    guildCoins: 100, // Welcome bonus
    guildTokens: 100, // Alternative name for compatibility
    // Personal information (flattened for compatibility)
    firstName,
    lastName,
    dateOfBirth,
    country,
    state: state || null,
    city: city || null,
    phoneNumber: phoneNumber || null,
    referralSource: referralSource || null,
    // Profile information
    avatar: null,
    bio: "",
    // Preferences
    agreeToMarketing: agreeToMarketing || false,
    emailNotifications: true,
    pushNotifications: false,
    theme: "dark",
    language: "en",
    // Stats
    totalPledges: 0,
    totalVotes: 0,
    dropsJoined: 0,
    followers: 0,
    following: 0,
    profileViews: 0,
    createdAt: new Date().toISOString(),
    loginCount: 0,
    // Marketing preferences
    marketingEmails: agreeToMarketing || false,
    productUpdates: true,
    orderUpdates: true,
    updatedAt: new Date().toISOString()
  };

  console.log("📝 Registering new user:", {
    username: newUser.username,
    email: newUser.email,
    id: newUser.id
  });

  users.push(newUser);
  
  console.log(`💾 Writing ${users.length} users to file...`);
  
  try {
    writeUsers(users);
    console.log("✅ User data written successfully");
  } catch (error) {
    console.error("❌ Failed to write user data:", error);
    return res.status(500).json({ error: "Failed to save user account. Please try again." });
  }
  
  // Verify the write was successful by reading back
  const verifyUsers = readUsers();
  const savedUser = verifyUsers.find((u: any) => u.id === newUser.id);
  if (!savedUser) {
    console.error("❌ User was not found after write - file write may have failed!");
    return res.status(500).json({ error: "Account creation verification failed. Please contact support." });
  }
  console.log("✅ User verified in database:", savedUser.username);
  
  // Create server-side session for auto-login
  const sessionToken = createSession(newUser.id, newUser.username, newUser.email, newUser.tier);
  setSessionCookie(res, sessionToken);
  
  console.log("✅ Session created for new user:", newUser.username);
  console.log("📢 Registration complete - client should dispatch 'newUserRegistered' event");
  
  // Return the new user object for localStorage (without sensitive data)
  const userResponse = {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    tier: newUser.tier,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    country: newUser.country,
    state: newUser.state,
    city: newUser.city,
    avatar: newUser.avatar,
    bio: newUser.bio,
    joinDate: newUser.joinDate,
    totalPledges: newUser.totalPledges,
    totalVotes: newUser.totalVotes,
    dropsJoined: newUser.dropsJoined,
    followers: newUser.followers,
    following: newUser.following,
    guildCoins: newUser.guildCoins,
    guildTokens: newUser.guildTokens
  };

  res.status(201).json({ 
    success: true, 
    user: userResponse,
    message: "Welcome to MIGISTUS! Your account has been created successfully."
  });
}
