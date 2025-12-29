import type { NextApiRequest, NextApiResponse } from 'next';
import { notificationStorage } from '@/utils/notificationStorage';
import { getSessionFromRequest } from '@/lib/session';
import { sendEmail } from '@/lib/email';

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
    if (!toEmail || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields: toEmail, subject, body'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    if (sendImmediately) {
      // Send email immediately using nodemailer
      const success = await sendEmail({
        to: toEmail,
        subject,
        text: body,
        html: htmlBody || body,
        from: fromEmail,
      });

      if (success) {
        return res.status(200).json({
          success: true,
          message: 'Email sent successfully'
        });
      } else {
        // If immediate send fails, queue it as fallback
        const emailItem = await notificationStorage.queueEmail({
          recipientEmail: toEmail,
          recipientName: '',
          subject,
          htmlContent: htmlBody || body,
          textContent: body,
          priority: '10',
          scheduledFor: new Date().toISOString()
        });

        return res.status(202).json({
          success: true,
          emailId: emailItem.id,
          message: 'Email queued for retry (initial send failed)'
        });
      }
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
