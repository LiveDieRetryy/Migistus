import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { db } from '@/lib/db';
import { sendEmail, emailTemplates } from '@/lib/email';

function generateVerificationToken(): string {
  // Generate a 6-digit verification code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    // Request verification email (resend)
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      // Get user from database
      const user = await db.getUser(email.toLowerCase());

      if (!user) {
        // Don't reveal if email exists
        return res.status(200).json({ 
          message: 'If an account exists with this email, a verification link has been sent.' 
        });
      }

      if (user.email_verified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }

      // Clean up old tokens for this email
      await db.cleanupExpiredTokens();

      // Generate and store token
      const code = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Delete any existing tokens for this email first
      await sql`DELETE FROM verification_tokens WHERE email = ${email.toLowerCase()}`;
      await db.createVerificationToken(email.toLowerCase(), code, expiresAt);

      // Send verification email
      const template = emailTemplates.emailVerification(user.username, code, 60);
      
      try {
        const emailSent = await sendEmail({
          to: user.email,
          subject: template.subject,
          text: template.text,
          html: template.html,
        });
        
        if (emailSent) {
          console.log(`✅ Verification email sent successfully to ${user.email}`);
        } else {
          console.error(`❌ Failed to send verification email to ${user.email}`);
        }
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
        // Don't fail the request if email fails
      }

      return res.status(200).json({ 
        message: 'Verification code sent. Please check your email.' 
      });
    } catch (error) {
      console.error('Verification request error:', error);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }
  } else if (req.method === 'GET') {
    // Verify email with code
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    try {
      // Get verification token from database
      const verificationToken = await db.getVerificationToken(code);

      if (!verificationToken) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      if (verificationToken.used) {
        return res.status(400).json({ error: 'This verification code has already been used' });
      }

      // Check if code is expired (1 hour)
      const createdAt = new Date(verificationToken.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 1) {
        return res.status(400).json({ error: 'Verification code has expired' });
      }

      // Mark user as verified
      await db.markUserAsVerified(verificationToken.email);
      await db.markTokenAsUsed(code);

      return res.status(200).json({ 
        success: true,
        message: 'Email verified successfully! You can now log in.' 
      });
    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({ error: 'Failed to verify email' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
