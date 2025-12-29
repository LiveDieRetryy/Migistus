import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { createSession, setSessionCookie } from "@/lib/session";
import formidable from 'formidable';

// Disable default body parser to handle FormData
export const config = {
  api: {
    bodyParser: false,
  },
};

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

// Parse FormData using formidable
function parseForm(req: NextApiRequest): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Parse FormData
    const { fields, files } = await parseForm(req);
    
    // Extract values (formidable returns arrays for fields)
    const getValue = (field: any) => Array.isArray(field) ? field[0] : field;
    
    const username = getValue(fields.username);
    const email = getValue(fields.email);
    const password = getValue(fields.password);
    const firstName = getValue(fields.firstName);
    const lastName = getValue(fields.lastName);
    const dateOfBirth = getValue(fields.dateOfBirth);
    const country = getValue(fields.country);
    const state = getValue(fields.state);
    const city = getValue(fields.city);
    const zipCode = getValue(fields.zipCode);
    const phoneNumber = getValue(fields.phoneNumber);
    const referralSource = getValue(fields.referralSource);
    const agreeToTermsValue = getValue(fields.agreeToTerms);
    const agreeToMarketingValue = getValue(fields.agreeToMarketing);
    const agreeToTerms = agreeToTermsValue === 'true' || agreeToTermsValue === true;
    const agreeToMarketing = agreeToMarketingValue === 'true' || agreeToMarketingValue === true;
    const preferredLanguage = getValue(fields.preferredLanguage);
    const timezone = getValue(fields.timezone);
    const gender = getValue(fields.gender);
    const accountPurpose = getValue(fields.accountPurpose);
    const avatarFile = files.avatar ? (Array.isArray(files.avatar) ? files.avatar[0] : files.avatar) : null;

    console.log('📝 Registration data:', { 
      username, 
      email, 
      firstName, 
      lastName,
      agreeToTerms,
      agreeToTermsRaw: agreeToTermsValue,
      hasAvatar: !!avatarFile 
    });
  
  // Validate required fields
  if (!username || !email || !password || !firstName || !lastName || !dateOfBirth || !country) {
    const missing = [];
    if (!username) missing.push('username');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!firstName) missing.push('firstName');
    if (!lastName) missing.push('lastName');
    if (!dateOfBirth) missing.push('dateOfBirth');
    if (!country) missing.push('country');
    
    console.log('❌ Missing required fields:', missing);
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
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
  
  // Process avatar file if uploaded
  let avatarPath = null;
  if (avatarFile) {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(avatarFile.originalFilename || '.jpg');
      const filename = `${username.toLowerCase()}_${timestamp}${ext}`;
      const destPath = path.join(uploadDir, filename);
      
      // Copy file from temp location to uploads folder
      const fileData = fs.readFileSync(avatarFile.filepath);
      fs.writeFileSync(destPath, fileData);
      
      // Set avatar path (relative to public folder)
      avatarPath = `/uploads/avatars/${filename}`;
      
      console.log('✅ Avatar uploaded:', avatarPath);
    } catch (err) {
      console.error('❌ Avatar upload failed:', err);
      // Continue registration without avatar
    }
  }
  
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
    avatar: avatarPath,
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
  const sessionToken = await createSession(newUser.id, newUser.username, newUser.email, newUser.tier);
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
    session: {
      user: userResponse,
      sessionId: sessionToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    },
    message: "Welcome to MIGISTUS! Your account has been created successfully."
  });
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
}
