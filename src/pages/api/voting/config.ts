import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const config = await db.getVotingConfig();
      
      // If no config exists, initialize defaults
      if (!config) {
        const defaultConfig = await db.initializeDefaultVotingConfig();
        return res.status(200).json(defaultConfig);
      }
      
      return res.status(200).json(config);
    } catch (error) {
      console.error('Error reading voting config:', error);
      return res.status(500).json({ error: 'Failed to load voting configuration' });
    }
  }

  if (req.method === 'POST') {
    try {
      const newConfig = req.body;
      const updatedConfig = await db.updateVotingConfig(newConfig);
      return res.status(200).json({ success: true, config: updatedConfig });
    } catch (error) {
      console.error('Error updating voting config:', error);
      return res.status(500).json({ error: 'Failed to update voting configuration' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
