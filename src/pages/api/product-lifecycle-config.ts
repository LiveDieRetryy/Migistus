import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const config = await db.getProductLifecycleConfig();
      
      // Map snake_case to camelCase for frontend
      const formattedConfig = {
        votingToComingSoonThreshold: config.voting_to_coming_soon_threshold,
        comingSoonDuration: config.coming_soon_duration,
        communityDropsDuration: config.community_drops_duration,
        autoPromotionEnabled: config.auto_promotion_enabled,
        lastUpdated: config.last_updated,
        updatedBy: config.updated_by
      };
      
      res.status(200).json(formattedConfig);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load config' });
    }
  } else if (req.method === 'POST') {
    try {
      const { votingToComingSoonThreshold, comingSoonDuration, communityDropsDuration, autoPromotionEnabled } = req.body;
      
      const config = await db.updateProductLifecycleConfig({
        votingToComingSoonThreshold,
        comingSoonDuration,
        communityDropsDuration,
        autoPromotionEnabled,
        updatedBy: 'admin'
      });
      
      res.status(200).json({ success: true, config });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save config' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
