import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { sendEmail, emailTemplates } from "@/lib/email";
import { db } from "@/lib/db";

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
    
    const user = await db.getUserByEmailOrUsername(email);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.updateUser(user.id, { password_hash: hashedPassword });
    
    return res.status(200).json({ 
      success: true, 
      message: `Password updated for user: ${user.username || user.email}` 
    });
  }
  
  if (!email && (!token || !newPassword)) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  if (email && !token && !newPassword) {
    // Request reset flow - send email
    const user = await db.getUserByEmailOrUsername(email);
    
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
    
    // Save reset token in database
    await db.createPasswordResetToken(email, resetToken, expiresAt);
    
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
    const tokenData = await db.getPasswordResetToken(token);
    
    if (!tokenData) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    
    // Find user and update password
    const user = await db.getUserByEmailOrUsername(tokenData.email);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.updateUser(user.id, { password_hash: hashedPassword });
    
    // Mark token as used
    await db.markPasswordResetTokenUsed(token);
    
    return res.status(200).json({ 
      success: true, 
      message: "Password updated successfully" 
    });
  }
  
  return res.status(400).json({ error: "Invalid request" });
}
