import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    const allSettings = getSettings();

    if (req.method === 'GET') {
      if (userId) {
        const userSettings = allSettings[userId as string] || {
          notifications: true,
          emailUpdates: true,
          privacy: 'public',
          theme: 'dark'
        };
        res.status(200).json(userSettings);
      } else {
        res.status(400).json({ error: 'Missing userId' });
      }
    } else if (req.method === 'PUT') {
      if (userId) {
        const updatedSettings = req.body;
        allSettings[userId as string] = {
          ...allSettings[userId as string],
          ...updatedSettings,
          updatedAt: new Date().toISOString()
        };
        saveSettings(allSettings);
        res.status(200).json({ success: true, settings: allSettings[userId as string] });
      } else {
        res.status(400).json({ error: 'Missing userId' });
      }
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Settings API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
