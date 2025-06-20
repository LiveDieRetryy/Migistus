import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const profilesPath = path.join(process.cwd(), 'public', 'data', 'profiles.json');

function ensureProfilesFile() {
  if (!fs.existsSync(profilesPath)) {
    fs.writeFileSync(profilesPath, '{}');
  }
}

function getProfiles() {
  ensureProfilesFile();
  const data = fs.readFileSync(profilesPath, 'utf-8');
  return JSON.parse(data);
}

function saveProfiles(profiles: any) {
  fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    const profiles = getProfiles();

    if (req.method === 'GET') {
      if (userId) {
        const profile = profiles[userId as string];
        res.status(200).json(profile || null);
      } else {
        res.status(400).json({ error: 'Missing userId' });
      }
    } else if (req.method === 'PUT') {
      if (userId) {
        const updatedProfile = req.body;
        profiles[userId as string] = {
          ...profiles[userId as string],
          ...updatedProfile,
          updatedAt: new Date().toISOString()
        };
        saveProfiles(profiles);
        res.status(200).json({ success: true, profile: profiles[userId as string] });
      } else {
        res.status(400).json({ error: 'Missing userId' });
      }
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Profile API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
