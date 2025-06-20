import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";

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
    loginCount: 0
  };

  users.push(newUser);
  writeUsers(users);
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
