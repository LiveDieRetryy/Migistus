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
    const userId = session.userId;

    if (req.method === 'GET') {
      // GET /api/notifications/preferences - Get user's notification preferences
      const preferences = await notificationStorage.getNotificationPreferences(userId);
      return res.status(200).json(preferences);
    }

    if (req.method === 'PUT') {
      // PUT /api/notifications/preferences - Update notification preferences
      const {
        email_enabled,
        push_enabled,
        product_launches,
        product_votes,
        product_comments,
        new_followers,
        direct_messages,
        system_announcements,
        marketing_emails
      } = req.body;

      // Validate boolean values
      const booleanFields = [
        'email_enabled',
        'push_enabled',
        'product_launches',
        'product_votes',
        'product_comments',
        'new_followers',
        'direct_messages',
        'system_announcements',
        'marketing_emails'
      ];

      const updates: any = {};
      for (const field of booleanFields) {
        if (req.body[field] !== undefined) {
          if (typeof req.body[field] !== 'boolean') {
            return res.status(400).json({
              error: `Invalid value for ${field}: must be a boolean`
            });
          }
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'No valid preference fields provided'
        });
      }

      const preferences = await notificationStorage.updateNotificationPreferences(
        userId,
        updates
      );

      return res.status(200).json(preferences);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Notification preferences API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
