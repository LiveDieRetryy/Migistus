import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const reportsPath = path.join(process.cwd(), 'public', 'data', 'chat-reports.json');
const sessionsPath = path.join(process.cwd(), 'public', 'data', 'user-sessions.json');
const usersPath = path.join(process.cwd(), 'public', 'data', 'users.json');

interface ChatReport {
  id: number;
  reporterId: number;
  reporterName: string;
  reportedUserId: number;
  reportedUserName: string;
  messageId: number;
  messageContent: string;
  productId: number;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  action?: string;
  reportedUserMessageHistory?: any[];
}

const getReports = (): ChatReport[] => {
  try {
    if (!fs.existsSync(reportsPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(reportsPath, 'utf8'));
  } catch (error) {
    console.error('Error reading reports:', error);
    return [];
  }
};

const saveReports = (reports: ChatReport[]) => {
  fs.writeFileSync(reportsPath, JSON.stringify(reports, null, 2));
};

const getUserFromSession = (sessionId: string | undefined): { userId: number; isAdmin: boolean } | null => {
  if (!sessionId) return null;
  
  try {
    if (!fs.existsSync(sessionsPath)) return null;
    const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
    const session = Array.isArray(sessions) ? sessions.find((s: any) => s.sessionId === sessionId) : null;
    
    if (!session) return null;
    
    // Check if user is admin
    let isAdmin = false;
    if (fs.existsSync(usersPath)) {
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const user = users.find((u: any) => u.id === session.userId);
      isAdmin = user?.role === 'admin' || user?.role === 'staff';
    }
    
    return {
      userId: session.userId,
      isAdmin
    };
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const sessionId = req.cookies.sessionId;
      const user = getUserFromSession(sessionId);

      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { reportId, action, actionNote } = req.body;

      if (!reportId || !action) {
        return res.status(400).json({ error: 'Missing required fields: reportId, action' });
      }

      if (!['resolve', 'dismiss'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Must be "resolve" or "dismiss"' });
      }

      const reports = getReports();
      const reportIndex = reports.findIndex(r => r.id === reportId);

      if (reportIndex === -1) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Update report status
      reports[reportIndex] = {
        ...reports[reportIndex],
        status: action === 'resolve' ? 'resolved' : 'dismissed',
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.userId,
        action: actionNote || action
      };

      saveReports(reports);

      // Log the moderation action
      const moderationPath = path.join(process.cwd(), 'public', 'data', 'moderation.json');
      if (fs.existsSync(moderationPath)) {
        const logs = JSON.parse(fs.readFileSync(moderationPath, 'utf8'));
        logs.push({
          type: 'report_action',
          action,
          reportId,
          moderatorId: user.userId,
          reportedUserId: reports[reportIndex].reportedUserId,
          timestamp: new Date().toISOString()
        });
        fs.writeFileSync(moderationPath, JSON.stringify(logs.slice(-1000), null, 2));
      }

      return res.status(200).json({
        success: true,
        message: `Report ${action === 'resolve' ? 'resolved' : 'dismissed'} successfully`,
        report: reports[reportIndex]
      });
    } catch (error) {
      console.error('Error processing report action:', error);
      return res.status(500).json({ error: 'Failed to process report action' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
