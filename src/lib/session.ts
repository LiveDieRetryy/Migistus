import { NextApiRequest, NextApiResponse } from 'next';
import { serialize, parse } from 'cookie';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface Session {
  userId: number;
  username: string;
  email: string;
  tier: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number; // Track when user was last active
}

// File-based session storage for production reliability
const SESSIONS_FILE = path.join(process.cwd(), 'public', 'data', 'sessions.json');

const SESSION_COOKIE_NAME = 'migistus_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Ensure sessions file exists
 */
function ensureSessionsFile(): void {
  if (!fs.existsSync(SESSIONS_FILE)) {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SESSIONS_FILE, '{}');
  }
}

/**
 * Read sessions from file
 */
function readSessions(): Record<string, Session> {
  try {
    ensureSessionsFile();
    const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const sessions = JSON.parse(data) as Record<string, Session>;
    
    // Clean expired sessions on read
    const now = Date.now();
    const activeSessions: Record<string, Session> = {};
    
    for (const [token, session] of Object.entries(sessions)) {
      if (session && typeof session === 'object' && session.expiresAt > now) {
        activeSessions[token] = session;
      }
    }
    
    // Write back cleaned sessions if any were expired
    if (Object.keys(activeSessions).length !== Object.keys(sessions).length) {
      writeSessions(activeSessions);
    }
    
    return activeSessions;
  } catch (error) {
    console.error('Error reading sessions:', error);
    return {};
  }
}

/**
 * Write sessions to file
 */
function writeSessions(sessions: Record<string, Session>): void {
  try {
    ensureSessionsFile();
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Error writing sessions:', error);
  }
}

/**
 * Generate a secure random session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new session for a user
 */
export function createSession(userId: number, username: string, email: string, tier: string): string {
  const token = generateSessionToken();
  const now = Date.now();
  
  const session: Session = {
    userId,
    username,
    email,
    tier,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
    lastActivity: now, // Initialize with current time
  };
  
  const sessions = readSessions();
  sessions[token] = session;
  writeSessions(sessions);
  
  return token;
}

/**
 * Get session from token
 */
export function getSession(token: string): Session | null {
  const sessions = readSessions();
  const session = sessions[token];
  
  if (!session) {
    return null;
  }
  
  // Check if session is expired
  if (Date.now() > session.expiresAt) {
    deleteSession(token);
    return null;
  }
  
  return session;
}

/**
 * Delete a session (logout)
 */
export function deleteSession(token: string): void {
  const sessions = readSessions();
  delete sessions[token];
  writeSessions(sessions);
}

/**
 * Get session token from request cookies
 */
export function getSessionToken(req: NextApiRequest): string | null {
  const cookies = parse(req.headers.cookie || '');
  return cookies[SESSION_COOKIE_NAME] || null;
}

/**
 * Get session from request
 */
export function getSessionFromRequest(req: NextApiRequest): Session | null {
  const token = getSessionToken(req);
  if (!token) {
    return null;
  }
  return getSession(token);
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(res: NextApiResponse, token: string): void {
  const cookie = serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  });
  
  res.setHeader('Set-Cookie', cookie);
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(res: NextApiResponse): void {
  const cookie = serialize(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  res.setHeader('Set-Cookie', cookie);
}

/**
 * Require authentication middleware
 * Returns the session or sends 401 response
 */
export function requireAuth(req: NextApiRequest, res: NextApiResponse): Session | null {
  const session = getSessionFromRequest(req);
  
  if (!session) {
    res.status(401).json({ 
      success: false,
      error: 'Unauthorized - Please log in',
      code: 'AUTH_REQUIRED'
    });
    return null;
  }
  
  return session;
}

/**
 * Require admin authentication
 */
export function requireAdmin(req: NextApiRequest, res: NextApiResponse): Session | null {
  const session = requireAuth(req, res);
  
  if (!session) {
    return null;
  }
  
  if (session.tier !== 'Admin') {
    res.status(403).json({ 
      success: false,
      error: 'Forbidden - Admin access required',
      code: 'ADMIN_REQUIRED'
    });
    return null;
  }
  
  return session;
}

/**
 * Extend session expiration (refresh on activity)
 */
export function extendSession(token: string): boolean {
  const sessions = readSessions();
  const session = sessions[token];
  
  if (!session) {
    return false;
  }
  
  const now = Date.now();
  session.expiresAt = now + SESSION_DURATION;
  session.lastActivity = now; // Update last activity time
  sessions[token] = session;
  writeSessions(sessions);
  return true;
}

/**
 * Update user's last activity timestamp
 */
export function updateUserActivity(token: string): boolean {
  const sessions = readSessions();
  const session = sessions[token];
  
  if (!session) {
    return false;
  }
  
  session.lastActivity = Date.now();
  sessions[token] = session;
  writeSessions(sessions);
  return true;
}

/**
 * Check if a user is currently online
 * User is considered online if they've been active within the last 5 minutes
 */
export function isUserOnline(userId: number): boolean {
  const sessions = readSessions();
  const now = Date.now();
  
  for (const session of Object.values(sessions)) {
    // User is online if they have a valid (non-expired) session
    if (session.userId === userId && session.expiresAt > now) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all currently online users
 */
export function getOnlineUsers(): Array<{ userId: number; username: string; tier: string; lastActivity: number }> {
  const sessions = readSessions();
  const now = Date.now();
  
  const onlineUsers = new Map<number, { userId: number; username: string; tier: string; lastActivity: number }>();
  
  for (const session of Object.values(sessions)) {
    // User is online if they have a valid (non-expired) session
    if (session.expiresAt > now) {
      const activityTime = session.lastActivity || session.createdAt;
      
      // Keep only the most recent session for each user
      const existing = onlineUsers.get(session.userId);
      if (!existing || activityTime > existing.lastActivity) {
        onlineUsers.set(session.userId, {
          userId: session.userId,
          username: session.username,
          tier: session.tier,
          lastActivity: activityTime
        });
      }
    }
  }
  
  return Array.from(onlineUsers.values());
}
