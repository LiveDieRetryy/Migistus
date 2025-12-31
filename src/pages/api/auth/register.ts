import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { createSession, setSessionCookie } from "@/lib/session";
import { sendEmail, emailTemplates } from "@/lib/email";
import { db } from "@/lib/db";
import { validateUsername } from "@/lib/profanity-filter";
import { appCache as cache } from "@/lib/cache";
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

function generateVerificationToken(): string {
  // Generate a 6-digit verification code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Disable default body parser to handle FormData
export const config = {
  api: {
    bodyParser: false,
  },
};

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

  // Validate username for profanity and format
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) {
    return res.status(400).json({ error: usernameValidation.error });
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

  // Check for existing users in database
  const existingEmail = await db.getUser(email.toLowerCase());
  if (existingEmail) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const existingUsername = await db.getUserByUsername(username);
  if (existingUsername) {
    return res.status(400).json({ error: "Username already taken" });
  }

  // Hash password for development file storage only
  // Production database hashing is handled in db.createUser
  const hash = await bcrypt.hash(password, 10);
  
  // Process avatar file if uploaded
  let avatarPath = null;
  if (avatarFile) {
    try {
      const { put } = await import('@vercel/blob');
      
      // Read file buffer
      const fileBuffer = fs.readFileSync(avatarFile.filepath);
      
      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(avatarFile.originalFilename || '.jpg');
      const filename = `avatars/${username.toLowerCase()}_${timestamp}${ext}`;
      
      // Upload to Vercel Blob Storage
      const blob = await put(filename, fileBuffer, {
        access: 'public',
        contentType: avatarFile.mimetype || 'image/jpeg',
      });
      
      // Use Blob URL instead of local path
      avatarPath = blob.url;
      
      console.log('✅ Avatar uploaded to Vercel Blob:', avatarPath);
    } catch (err) {
      console.error('❌ Avatar upload failed:', err);
      // Continue registration without avatar
    }
  }
  
  console.log("📝 Registering new user:", {
    username,
    email
  });

  // Create user in database
  const savedUser = await db.createUser({
    username,
    email,
    password: password,
    tier: "Initiate",
    firstName,
    lastName,
    dateOfBirth,
    country,
    state: state || null,
    city: city || null,
    phoneNumber: phoneNumber || null,
    referralSource: referralSource || null,
    agreeToMarketing: agreeToMarketing || false,
    avatar: avatarPath
  });
  console.log("✅ User created in database:", savedUser.id);
  
  // Create server-side session for auto-login
  const sessionToken = await createSession(savedUser.id, savedUser.username, savedUser.email, savedUser.tier);
  setSessionCookie(res, sessionToken);
  
  console.log("✅ Session created for new user:", savedUser.username);
  console.log("📢 Registration complete - client should dispatch 'newUserRegistered' event");
  
  // Generate verification token and send email (don't block registration if it fails)
  try {
    const verificationCode = generateVerificationToken();
    
    // Store verification token in database
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.createVerificationToken(savedUser.email, verificationCode, expiresAt);
    console.log("✅ Verification token stored in database");
    
    const template = emailTemplates.emailVerification(savedUser.username, verificationCode, 60);
    
    await sendEmail({
      to: savedUser.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
    console.log("✅ Verification email sent to:", savedUser.email);
  } catch (emailError) {
    console.error("⚠️ Failed to send verification email:", emailError);
    // Continue - don't fail registration because email failed
  }
  
  // Return the new user object for localStorage (without sensitive data)
  const userResponse = {
    id: savedUser.id,
    username: savedUser.username,
    email: savedUser.email,
    tier: savedUser.tier,
    firstName: savedUser.first_name || savedUser.firstName,
    lastName: savedUser.last_name || savedUser.lastName,
    country: savedUser.country,
    state: savedUser.state,
    city: savedUser.city,
    avatar: savedUser.avatar,
    bio: savedUser.bio || "",
    joinDate: savedUser.join_date || savedUser.joinDate,
    totalPledges: savedUser.totalPledges || 0,
    totalVotes: savedUser.totalVotes || 0,
    dropsJoined: savedUser.dropsJoined || 0,
    followers: savedUser.followers || 0,
    following: savedUser.following || 0,
    guildCoins: savedUser.guildCoins || 100,
    guildTokens: savedUser.guildTokens || 100
  };

  // Invalidate users cache
  cache.invalidate('users:all');

  res.status(201).json({ 
    success: true, 
    user: userResponse,
    session: {
      user: userResponse,
      sessionId: sessionToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    },
    requiresVerification: true,
    message: "Welcome to MIGISTUS! Please check your email to verify your account."
  });
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
}