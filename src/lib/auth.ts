/**
 * Authentication utilities
 * Re-exports session management functions for backward compatibility
 */

export { 
  getSessionFromRequest,
  requireAuth,
  requireAdmin,
  createSession,
  getSession,
  deleteSession,
  updateSessionActivity,
  setSessionCookie,
  clearSessionCookie,
  extendSession
} from './session';

export type { Session } from './session';
