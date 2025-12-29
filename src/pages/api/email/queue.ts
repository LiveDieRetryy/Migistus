import type { NextApiRequest, NextApiResponse } from 'next';
import { notificationStorage } from '@/utils/notificationStorage';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Authenticate user
    const session = await getSessionFromRequest(req);
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      // POST /api/email/queue - Queue an email for sending
      const {
        toEmail,
        fromEmail,
        subject,
        body,
        htmlBody,
        priority = 0,
        scheduledFor
      } = req.body;

      // Validate required fields
      if (!toEmail || !fromEmail || !subject || !body) {
        return res.status(400).json({
          error: 'Missing required fields: toEmail, fromEmail, subject, body'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(toEmail) || !emailRegex.test(fromEmail)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }

      // Validate priority
      if (typeof priority !== 'number' || priority < 0 || priority > 10) {
        return res.status(400).json({
          error: 'Priority must be a number between 0 and 10'
        });
      }

      // Parse scheduled date if provided
      let scheduledDate: Date | undefined;
      if (scheduledFor) {
        scheduledDate = new Date(scheduledFor);
        if (isNaN(scheduledDate.getTime())) {
          return res.status(400).json({
            error: 'Invalid scheduledFor date format'
          });
        }
      }

      const emailItem = await notificationStorage.queueEmail({
        recipientEmail: toEmail,
        recipientName: '',
        subject,
        htmlContent: htmlBody || body,
        textContent: body,
        priority: priority.toString(),
        scheduledFor: scheduledDate?.toISOString()
      });

      return res.status(201).json({
        success: true,
        emailId: emailItem.id,
        message: 'Email queued successfully'
      });
    }

    if (req.method === 'GET') {
      // GET /api/email/queue - Get queue status (admin only)
      if (session.tier !== 'Master') { // Check if admin - adjust tier as needed
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const { limit = '50', status = 'pending' } = req.query;
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          error: 'Invalid limit: must be between 1 and 100'
        });
      }

      const validStatuses = ['pending', 'sending', 'sent', 'failed', 'cancelled'];
      const emailStatus = typeof status === 'string' ? status : 'pending';
      if (!validStatuses.includes(emailStatus)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const emails = await notificationStorage.getQueuedEmails(emailStatus, limitNum);

      return res.status(200).json({
        emails,
        total: emails.length,
        limit: limitNum
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Email queue API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
