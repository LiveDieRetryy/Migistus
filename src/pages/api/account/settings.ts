import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/session';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication
  const session = await requireAuth(req, res);
  if (!session) {
    return; // requireAuth already sent the 401 response
  }

  try {
    if (req.method === 'GET') {
      let userSettings = await db.getUserSettings(session.userId);
      
      if (!userSettings) {
        userSettings = {
          notifications: true,
          email_notifications: true,
          email_updates: true,
          privacy: 'public',
          theme: 'dark'
        };
      }
      
      return res.status(200).json({
        success: true,
        data: userSettings
      });
    } else if (req.method === 'PUT') {
      const updatedSettings = req.body;
      
      const settings = await db.updateUserSettings(session.userId, {
        showOnlineStatus: updatedSettings.showOnlineStatus,
        allowMessages: updatedSettings.allowMessages,
        emailNotifications: updatedSettings.emailUpdates || updatedSettings.emailNotifications,
        marketingEmails: updatedSettings.marketingEmails,
        preferences: updatedSettings.preferences
      });
      
      return res.status(200).json({
        success: true,
        data: settings,
        message: 'Settings updated successfully'
      });
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}
