import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSessionFromRequest(req);

  if (!session || !session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.userId;

  if (req.method === 'GET') {
    try {
      let settings = await db.getUserSettings(userId);
      
      // Create default settings if they don't exist
      if (!settings) {
        settings = await db.createUserSettings(userId);
      }

      return res.status(200).json({ settings });
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { showOnlineStatus, allowMessages, emailNotifications, marketingEmails, preferences } = req.body;

      const settings = await db.updateUserSettings(userId, {
        showOnlineStatus,
        allowMessages,
        emailNotifications,
        marketingEmails,
        preferences
      });

      return res.status(200).json({ settings });
    } catch (error) {
      console.error('Error updating settings:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
