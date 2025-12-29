import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { db, isProduction } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sendEmail, emailTemplates } from '@/lib/email';

interface VerificationToken {
  token: string;
  email: string;
  createdAt: string;
  used: boolean;
}

const TOKENS_FILE = path.join(process.cwd(), 'public', 'data', 'verification-tokens.json');
const USERS_FILE = path.join(process.cwd(), 'public', 'data', 'users.json');

// Ensure directory exists
function ensureDirectoryExists() {
  const dir = path.dirname(TOKENS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readTokens(): VerificationToken[] {
  ensureDirectoryExists();
  if (!fs.existsSync(TOKENS_FILE)) {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(TOKENS_FILE, 'utf8');
  return JSON.parse(data);
}

function writeTokens(tokens: VerificationToken[]) {
  ensureDirectoryExists();
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const fileContent = fs.readFileSync(USERS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : (data.users || []);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function writeUsers(users: any[]) {
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = { users };
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), { encoding: 'utf-8', flag: 'w' });
  } catch (error) {
    console.error('Error writing users file:', error);
    throw new Error('Failed to save user data');
  }
}

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
      let user: any = null;
      
      if (isProduction()) {
        console.log('🔐 Production mode: Checking user in database');
        try {
          user = await db.getUser(email.toLowerCase());
          console.log('✅ Database query successful, user found:', !!user);
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          // Fallback to file-based
          const users = readUsers();
          user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        }
      } else {
        console.log('🔓 Development mode: Using file-based storage');
        const users = readUsers();
        user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      }

      if (!user) {
        // Don't reveal if email exists
        return res.status(200).json({ 
          message: 'If an account exists with this email, a verification link has been sent.' 
        });
      }

      if (user.email_verified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }

      // Clean up old tokens for this email before creating a new one
      if (isProduction()) {
        try {
          await db.cleanupExpiredTokens();
          console.log('✅ Cleaned up expired tokens');
        } catch (cleanupError) {
          console.error('⚠️ Failed to cleanup tokens:', cleanupError);
        }
      }

      // Generate and store token
      const code = generateVerificationToken();
      
      if (isProduction()) {
        console.log('🔐 Production mode: Storing verification token in database');
        try {
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
          // Delete any existing tokens for this email first
          await sql`DELETE FROM verification_tokens WHERE email = ${email.toLowerCase()}`;
          await db.createVerificationToken(email.toLowerCase(), code, expiresAt);
          console.log('✅ Verification token stored in database');
        } catch (dbError) {
          console.error('❌ Database error, falling back to file storage:', dbError);
          const tokens = readTokens();
          const filteredTokens = tokens.filter(t => t.email !== email);
          filteredTokens.push({
            token: code,
            email,
            createdAt: new Date().toISOString(),
            used: false,
          });
          writeTokens(filteredTokens);
        }
      } else {
        console.log('🔓 Development mode: Storing verification token in file');
        const tokens = readTokens();
        const filteredTokens = tokens.filter(t => t.email !== email);
        filteredTokens.push({
          token: code,
          email,
          createdAt: new Date().toISOString(),
          used: false,
        });
        writeTokens(filteredTokens);
      }

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
        console.error('Email config check:', {
          hasHost: !!process.env.SMTP_HOST,
          hasPort: !!process.env.SMTP_PORT,
          hasUser: !!process.env.SMTP_USER,
          hasPass: !!process.env.SMTP_PASS,
        });
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
      let verificationToken: any = null;
      let tokenEmail: string = '';
      
      if (isProduction()) {
        console.log('🔐 Production mode: Checking verification code in database');
        try {
          verificationToken = await db.getVerificationToken(code);
          if (verificationToken) {
            tokenEmail = verificationToken.email;
            console.log('✅ Verification token found in database');
          }
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          // Fallback to file-based
          const tokens = readTokens();
          const fileToken = tokens.find(t => t.token === code);
          if (fileToken) {
            verificationToken = fileToken;
            tokenEmail = fileToken.email;
          }
        }
      } else {
        console.log('🔓 Development mode: Using file-based storage');
        const tokens = readTokens();
        const fileToken = tokens.find(t => t.token === code);
        if (fileToken) {
          verificationToken = fileToken;
          tokenEmail = fileToken.email;
        }
      }

      if (!verificationToken) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      if (verificationToken.used) {
        return res.status(400).json({ error: 'This verification code has already been used' });
      }

      // Check if code is expired (1 hour)
      const createdAt = new Date(verificationToken.created_at || verificationToken.createdAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 1) {
        return res.status(400).json({ error: 'Verification code has expired' });
      }

      // Mark user as verified
      if (isProduction()) {
        console.log('🔐 Production mode: Marking user as verified in database');
        try {
          await db.markUserAsVerified(tokenEmail);
          await db.markTokenAsUsed(code);
          console.log('✅ User verified in database');
        } catch (dbError) {
          console.error('❌ Database error, falling back to file storage:', dbError);
          // Fallback to file-based
          const users = readUsers();
          const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === tokenEmail.toLowerCase());
          if (userIndex !== -1) {
            users[userIndex].email_verified = true;
            writeUsers(users);
          }
          const tokens = readTokens();
          const tokenIndex = tokens.findIndex(t => t.token === code);
          if (tokenIndex !== -1) {
            tokens[tokenIndex].used = true;
            writeTokens(tokens);
          }
        }
      } else {
        console.log('🔓 Development mode: Using file-based storage');
        const users = readUsers();
        const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === tokenEmail.toLowerCase());
        if (userIndex !== -1) {
          users[userIndex].email_verified = true;
          writeUsers(users);
        }
        const tokens = readTokens();
        const tokenIndex = tokens.findIndex(t => t.token === code);
        if (tokenIndex !== -1) {
          tokens[tokenIndex].used = true;
          writeTokens(tokens);
        }
      }

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
