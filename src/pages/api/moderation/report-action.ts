import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionToken, getSession } from '@/lib/session';

interface ChatReport {
  id: number;
  reporter_id: number;
  reporter_name: string;
  reported_user_id: number;
  reported_user_name: string;
  message_id: number;
  message_content: string;
  product_id: number;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  action?: string;
}

const getUserFromSession = async (req: NextApiRequest): Promise<{ userId: number; isAdmin: boolean } | null> => {
  try {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) return null;
    
    const session = await getSession(sessionToken);
    if (!session) return null;
    
    // Check if user is admin
    const user = await db.getUserById(session.userId);
    const isAdmin = user?.role === 'admin' || user?.role === 'staff';
    
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
      const user = await getUserFromSession(req);

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

      // Update report in database
      const report = await db.updateReport(reportId, {
        status: action === 'resolve' ? 'resolved' : 'dismissed',
        reviewedBy: user.userId,
        actionTaken: actionNote || action
      });

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Log the moderation action
      await db.createModerationLog({
        type: 'report_action',
        action,
        reportId,
        moderatorId: user.userId,
        reportedUserId: report.reported_user_id
      });

      return res.status(200).json({
        success: true,
        message: `Report ${action === 'resolve' ? 'resolved' : 'dismissed'} successfully`,
        report
      });
    } catch (error) {
      console.error('Error processing report action:', error);
      return res.status(500).json({ error: 'Failed to process report action' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
