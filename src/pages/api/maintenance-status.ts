import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const SETTINGS_PATH = path.resolve('public/data/admin-settings.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if settings file exists
    if (!fs.existsSync(SETTINGS_PATH)) {
      return res.status(200).json({ maintenanceMode: false });
    }

    const fileContent = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    const settings = JSON.parse(fileContent);

    res.status(200).json({ 
      maintenanceMode: settings.site?.maintenanceMode || false 
    });
  } catch (error) {
    console.error('Error reading maintenance status:', error);
    // If there's an error reading the file, assume maintenance is off
    res.status(200).json({ maintenanceMode: false });
  }
}
