import type { NextApiRequest, NextApiResponse } from 'next';
import { notificationStorage } from '@/utils/notificationStorage';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user (admin only for direct send)
    const session = await getSessionFromRequest(req);
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (session.tier !== 'Master') { // Check if admin
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const {
      toEmail,
      fromEmail,
      subject,
      body,
      htmlBody,
      sendImmediately = false
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

    if (sendImmediately) {
      // TODO: Implement immediate email sending with nodemailer or similar
      // For now, queue with high priority
      const emailItem = await notificationStorage.queueEmail({
        recipientEmail: toEmail,
        recipientName: '',
        subject,
        htmlContent: htmlBody || body,
        textContent: body,
        priority: '10', // Highest priority
        scheduledFor: new Date().toISOString() // Send now
      });

      return res.status(200).json({
        success: true,
        emailId: emailItem.id,
        message: 'Email queued with highest priority for immediate sending'
      });
    } else {
      // Queue for background processing
      const emailItem = await notificationStorage.queueEmail({
        recipientEmail: toEmail,
        recipientName: '',
        subject,
        htmlContent: htmlBody || body,
        textContent: body,
        priority: '5'
      });

      return res.status(201).json({
        success: true,
        emailId: emailItem.id,
        message: 'Email queued successfully'
      });
    }
  } catch (error) {
    console.error('Email send API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
