import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'public', 'data', 'product-lifecycle-config.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load config' });
    }
  } else if (req.method === 'POST') {
    try {
      const { votingToComingSoonThreshold, comingSoonDuration, communityDropsDuration, autoPromotionEnabled } = req.body;
      const config = {
        votingToComingSoonThreshold,
        comingSoonDuration,
        communityDropsDuration,
        autoPromotionEnabled,
        lastUpdated: new Date().toISOString(),
        createdBy: 'admin',
      };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      res.status(200).json({ success: true, config });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save config' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
