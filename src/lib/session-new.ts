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
  lastActivity: number;
}

const SESSION_COOKIE_NAME = 'migistus_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Environment detection
const isProduction = () => {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
};

// File-based storage for development
const SESSIONS_FILE = path.join(process.cwd(), 'public', 'data', 'sessions.json');

/**
 * Database functions (lazy-loaded to avoid circular dependencies)
 */
let dbModule: any = null;
async function getDb() {
  if (!dbModule) {
    dbModule = await import('./db');
  }
  return dbModule.db;
}

/**
 * Ensure sessions file exists (dev only)
 */
function ensureSessionsFile(): void {
  if (isProduction()) return;
  
  if (!fs.existsSync(SESSIONS_FILE)) {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SESSIONS_FILE, '{}');
  }
}

/**
 * Read sessions from file (dev only)
 */
function readSessionsFile(): Record<string, Session> {
  try {
    ensureSessionsFile();
    const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const sessions = JSON.parse(data) as Record<string, Session>;
    
    // Clean expired sessions
    const now = Date.now();
    const activeSessions: Record<string, Session> = {};
    
    for (const [token, session] of Object.entries(sessions)) {
      if (session && typeof session === 'object' && session.expiresAt > now) {
        activeSessions[token] = session;
      }
    }
    
    return activeSessions;
  } catch (error) {
    console.error('Error reading sessions:', error);
    return {};
  }
}

/**
 * Write sessions to file (dev only)
 */
function writeSessionsFile(sessions: Record<string, Session>): void {
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
export async function createSession(
  userId: number, 
  username: string, 
  email: string, 
  tier: string
): Promise<string> {
  const token = generateSessionToken();
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION;
  
  const session: Session = {
    userId,
    username,
    email,
    tier,
    createdAt: now,
    expiresAt,
    lastActivity: now,
  };
  
  if (isProduction()) {
    // Production: Store in database
    try {
      const db = await getDb();
      await db.createSession(userId, token, new Date(expiresAt));
      console.log('✅ Session created in database:', token.substring(0, 8) + '...');
    } catch (error) {
      console.error('❌ Failed to create session in database:', error);
      throw error;
    }
  } else {
    // Development: Store in file
    const sessions = readSessionsFile();
    sessions[token] = session;
    writeSessionsFile(sessions);
    console.log('✅ Session created in file:', token.substring(0, 8) + '...');
  }
  
  return token;
}

/**
 * Get session from token
 */
export async function getSession(token: string): Promise<Session | null> {
  if (isProduction()) {
    // Production: Get from database
    try {
      const db = await getDb();
      const dbSession = await db.getSession(token);
      
      if (!dbSession) {
        return null;
      }
      
      // Convert database session to Session interface
      return {
        userId: dbSession.user_id || dbSession.id,
        username: dbSession.username,
        email: dbSession.email,
        tier: dbSession.tier || 'Initiate',
        createdAt: new Date(dbSession.created_at).getTime(),
        expiresAt: new Date(dbSession.expires_at).getTime(),
        lastActivity: Date.now(),
      };
    } catch (error) {
      console.error('Error getting session from database:', error);
      return null;
    }
  } else {
    // Development: Get from file
    const sessions = readSessionsFile();
    const session = sessions[token];
    
    if (!session) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > session.expiresAt) {
      await deleteSession(token);
      return null;
    }
    
    return session;
  }
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  if (isProduction()) {
    // Production: Delete from database
    try {
      const db = await getDb();
      await db.deleteSession(token);
      console.log('✅ Session deleted from database');
    } catch (error) {
      console.error('Error deleting session from database:', error);
    }
  } else {
    // Development: Delete from file
    const sessions = readSessionsFile();
    delete sessions[token];
    writeSessionsFile(sessions);
    console.log('✅ Session deleted from file');
  }
}

/**
 * Extend session expiration (on activity)
 */
export async function extendSession(token: string): Promise<void> {
  const session = await getSession(token);
  if (!session) return;
  
  const newExpiresAt = Date.now() + SESSION_DURATION;
  
  if (isProduction()) {
    // Production: Update in database
    try {
      const db = await getDb();
      await db.createSession(session.userId, token, new Date(newExpiresAt));
    } catch (error) {
      console.error('Error extending session:', error);
    }
  } else {
    // Development: Update in file
    const sessions = readSessionsFile();
    if (sessions[token]) {
      sessions[token].expiresAt = newExpiresAt;
      sessions[token].lastActivity = Date.now();
      writeSessionsFile(sessions);
    }
  }
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
export async function getSessionFromRequest(req: NextApiRequest): Promise<Session | null> {
  const token = getSessionToken(req);
  if (!token) {
    return null;
  }
  return await getSession(token);
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(res: NextApiResponse, token: string): void {
  const cookie = serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction(),
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
    secure: isProduction(),
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
export async function requireAuth(req: NextApiRequest, res: NextApiResponse): Promise<Session | null> {
  const session = await getSessionFromRequest(req);
  
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
export async function requireAdmin(req: NextApiRequest, res: NextApiResponse): Promise<Session | null> {
  const session = await requireAuth(req, res);
  
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
 * Cleanup expired sessions (for maintenance tasks)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  if (isProduction()) {
    try {
      const db = await getDb();
      await db.cleanupExpiredSessions();
      console.log('✅ Cleaned up expired sessions from database');
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  } else {
    const sessions = readSessionsFile();
    const now = Date.now();
    const activeSessions: Record<string, Session> = {};
    
    for (const [token, session] of Object.entries(sessions)) {
      if (session && session.expiresAt > now) {
        activeSessions[token] = session;
      }
    }
    
    writeSessionsFile(activeSessions);
    console.log('✅ Cleaned up expired sessions from file');
  }
}
