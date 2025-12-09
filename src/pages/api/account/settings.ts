import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/session';

const settingsPath = path.join(process.cwd(), 'public', 'data', 'settings.json');

function ensureSettingsFile() {
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, '{}');
  }
}

function getSettings() {
  ensureSettingsFile();
  const data = fs.readFileSync(settingsPath, 'utf-8');
  return JSON.parse(data);
}

function saveSettings(settings: any) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication
  const session = await requireAuth(req, res);
  if (!session) {
    return; // requireAuth already sent the 401 response
  }

  try {
    const allSettings = getSettings();
    const userIdStr = session.userId.toString();

    if (req.method === 'GET') {
      const userSettings = allSettings[userIdStr] || {
        notifications: true,
        emailUpdates: true,
        privacy: 'public',
        theme: 'dark'
      };
      return res.status(200).json({
        success: true,
        data: userSettings
      });
    } else if (req.method === 'PUT') {
      const updatedSettings = req.body;
      allSettings[userIdStr] = {
        ...allSettings[userIdStr],
        ...updatedSettings,
        updatedAt: new Date().toISOString()
      };
      saveSettings(allSettings);
      return res.status(200).json({ 
        success: true, 
        data: allSettings[userIdStr],
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
