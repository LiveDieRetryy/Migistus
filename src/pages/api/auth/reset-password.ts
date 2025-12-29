import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { sendEmail, emailTemplates } from "@/lib/email";

const USERS_PATH = path.resolve("public/data/users.json");
const RESET_TOKENS_PATH = path.resolve("public/data/reset-tokens.json");

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

function readResetTokens() {
  try {
    if (!fs.existsSync(RESET_TOKENS_PATH)) {
      fs.writeFileSync(RESET_TOKENS_PATH, JSON.stringify({ tokens: [] }, null, 2));
      return [];
    }
    const data = JSON.parse(fs.readFileSync(RESET_TOKENS_PATH, "utf-8"));
    return data.tokens || [];
  } catch (error) {
    console.error("Error reading reset tokens:", error);
    return [];
  }
}

function writeResetTokens(tokens: any[]) {
  try {
    const dir = path.dirname(RESET_TOKENS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(RESET_TOKENS_PATH, JSON.stringify({ tokens }, null, 2));
  } catch (error) {
    console.error("Error writing reset tokens:", error);
    throw new Error("Failed to save reset token");
  }
}

function generateResetToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const { email, token, newPassword, adminKey } = req.body;
  
  // Handle two different flows:
  // 1. Request reset (only email provided)
  // 2. Complete reset (token + newPassword provided)
  // 3. Admin reset (adminKey + email + newPassword provided)
  
  if (adminKey) {
    // Admin reset flow
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
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[userIndex] = {
      ...users[userIndex],
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    };
    
    writeUsers(users);
    
    return res.status(200).json({ 
      success: true, 
      message: `Password updated for user: ${users[userIndex].username || users[userIndex].email}` 
    });
  }
  
  if (!email && (!token || !newPassword)) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  if (email && !token && !newPassword) {
    // Request reset flow - send email
    const users = readUsers();
    const user = users.find((u: any) => u.email === email);
    
    if (!user) {
      // Don't reveal if user exists - security best practice
      return res.status(200).json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }
    
    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Save reset token
    const tokens = readResetTokens();
    tokens.push({
      userId: user.id,
      email: user.email,
      token: resetToken,
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: new Date().toISOString()
    });
    writeResetTokens(tokens);
    
    // Send reset email
    try {
      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      const template = emailTemplates.passwordReset(user.username, resetUrl, 60);
      
      await sendEmail({
        to: user.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
      
      console.log("✅ Password reset email sent to:", user.email);
    } catch (emailError) {
      console.error("❌ Failed to send reset email:", emailError);
      return res.status(500).json({ error: "Failed to send reset email" });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: "If an account with that email exists, a password reset link has been sent." 
    });
  }
  
  if (token && newPassword) {
    // Complete reset flow - verify token and update password
    const tokens = readResetTokens();
    const tokenData = tokens.find((t: any) => t.token === token && !t.used);
    
    if (!tokenData) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    
    // Check if token is expired
    if (new Date(tokenData.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Reset token has expired" });
    }
    
    // Find user and update password
    const users = readUsers();
    const userIndex = users.findIndex((u: any) => u.id === tokenData.userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[userIndex] = {
      ...users[userIndex],
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    };
    
    writeUsers(users);
    
    // Mark token as used
    const tokenIndex = tokens.findIndex((t: any) => t.token === token);
    if (tokenIndex !== -1) {
      tokens[tokenIndex].used = true;
      tokens[tokenIndex].usedAt = new Date().toISOString();
      writeResetTokens(tokens);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: "Password updated successfully" 
    });
  }
  
  return res.status(400).json({ error: "Invalid request" });
}
