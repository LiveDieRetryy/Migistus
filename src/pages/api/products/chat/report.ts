import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getSessionToken, getSession } from '@/lib/session';

const reportsPath = path.join(process.cwd(), 'public', 'data', 'chat-reports.json');
const chatPath = path.join(process.cwd(), 'public', 'data', 'product-chat.json');
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

const ensureFile = (filePath: string, defaultContent: any) => {
  if (!fs.existsSync(filePath)) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
  }
};

const getReports = (): ChatReport[] => {
  try {
    ensureFile(reportsPath, []);
    return JSON.parse(fs.readFileSync(reportsPath, 'utf8'));
  } catch (error) {
    console.error('Error reading reports:', error);
    return [];
  }
};

const saveReports = (reports: ChatReport[]) => {
  fs.writeFileSync(reportsPath, JSON.stringify(reports, null, 2));
};

const getUserFromSession = async (req: NextApiRequest): Promise<{ userId: number; userName: string } | null> => {
  try {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) return null;
    
    const session = await getSession(sessionToken);
    if (!session) return null;
    
    return {
      userId: session.userId,
      userName: session.username
    };
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
};

const getUserMessageHistory = (userId: number, productId: number, limit: number = 20): any[] => {
  try {
    if (!fs.existsSync(chatPath)) return [];
    
    const allMessages = JSON.parse(fs.readFileSync(chatPath, 'utf8'));
    return allMessages
      .filter((msg: any) => msg.userId === userId && msg.productId === productId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error reading message history:', error);
    return [];
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POST - Submit a report
  if (req.method === 'POST') {
    try {
      const reporter = await getUserFromSession(req);

      if (!reporter) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { messageId, reportedUserId, reportedUserName, productId, reason, description } = req.body;

      if (!messageId || !reportedUserId || !productId || !reason) {
        return res.status(400).json({ 
          error: 'Missing required fields: messageId, reportedUserId, productId, reason' 
        });
      }

      // Valid report reasons
      const validReasons = [
        'spam',
        'harassment',
        'hate_speech',
        'inappropriate_content',
        'scam',
        'impersonation',
        'other'
      ];

      if (!validReasons.includes(reason)) {
        return res.status(400).json({ 
          error: 'Invalid reason. Valid reasons: ' + validReasons.join(', ') 
        });
      }

      // Get the reported message
      let reportedMessage = null;
      if (fs.existsSync(chatPath)) {
        const allMessages = JSON.parse(fs.readFileSync(chatPath, 'utf8'));
        reportedMessage = allMessages.find((msg: any) => msg.id === messageId);
      }

      if (!reportedMessage) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Get message history of the reported user for context
      const messageHistory = getUserMessageHistory(reportedUserId, productId, 20);

      const reports = getReports();

      // Check if user already reported this message
      const existingReport = reports.find(
        r => r.reporterId === reporter.userId && r.messageId === messageId
      );

      if (existingReport) {
        return res.status(400).json({ 
          error: 'You have already reported this message',
          reportId: existingReport.id
        });
      }

      const newReport: ChatReport = {
        id: reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1,
        reporterId: reporter.userId,
        reporterName: reporter.userName,
        reportedUserId,
        reportedUserName: reportedUserName || reportedMessage.userName,
        messageId,
        messageContent: reportedMessage.message,
        productId,
        reason,
        description: description || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        reportedUserMessageHistory: messageHistory
      };

      reports.push(newReport);
      saveReports(reports);

      // Log to moderation system
      const moderationPath = path.join(process.cwd(), 'public', 'data', 'moderation.json');
      if (fs.existsSync(moderationPath)) {
        const logs = JSON.parse(fs.readFileSync(moderationPath, 'utf8'));
        logs.push({
          type: 'user_report',
          reporterId: reporter.userId,
          reportedUserId,
          messageId,
          reason,
          timestamp: new Date().toISOString()
        });
        fs.writeFileSync(moderationPath, JSON.stringify(logs.slice(-1000), null, 2));
      }

      return res.status(201).json({
        success: true,
        message: 'Report submitted successfully. Our team will review it shortly.',
        reportId: newReport.id
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      return res.status(500).json({ error: 'Failed to submit report' });
    }
  }

  // GET - Get all reports (admin only)
  if (req.method === 'GET') {
    try {
      const user = await getUserFromSession(req);

      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is admin/staff
      let isAdmin = false;
      if (fs.existsSync(usersPath)) {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        const userRecord = users.find((u: any) => u.id === user.userId);
        isAdmin = userRecord?.role === 'admin' || userRecord?.role === 'staff';
      }

      const reports = getReports();

      if (isAdmin) {
        // Return all reports for admin
        const { status, reportedUserId } = req.query;
        let filteredReports = reports;

        if (status) {
          filteredReports = filteredReports.filter(r => r.status === status);
        }

        if (reportedUserId) {
          filteredReports = filteredReports.filter(r => r.reportedUserId === parseInt(reportedUserId as string));
        }

        return res.status(200).json({
          reports: filteredReports.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          total: filteredReports.length
        });
      } else {
        // Return only user's own reports
        const userReports = reports.filter(r => r.reporterId === user.userId);
        return res.status(200).json({
          reports: userReports.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          total: userReports.length
        });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
