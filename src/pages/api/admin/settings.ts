import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const settings = await db.getAdminSettings();
      
      // If no settings exist, initialize defaults
      if (Object.keys(settings.site).length === 0) {
        const defaultSettings = await db.initializeDefaultAdminSettings();
        return res.status(200).json(defaultSettings);
      }
      
      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error reading settings:', error);
      res.status(500).json({ error: 'Failed to read settings' });
    }
  } else if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const newSettings = req.body;
      
      // Validate required fields
      if (!newSettings.site?.siteName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const updatedSettings = await db.updateAdminSettings(newSettings);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Settings saved successfully',
        settings: updatedSettings 
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
