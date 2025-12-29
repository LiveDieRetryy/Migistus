import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/auth';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get all navigation menus or by location
      const { location } = req.query;

      if (location && typeof location === 'string') {
        const menu = await cmsStorage.getNavigationMenuByLocation(location);
        return res.status(200).json({ menu });
      } else {
        const menus = await cmsStorage.getNavigationMenus();
        return res.status(200).json({ menus });
      }

    } else if (req.method === 'POST') {
      // Create navigation menu (requires authentication)
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, location, items } = req.body;

      // Validation
      if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
        return res.status(400).json({ error: 'Name must be 1-100 characters' });
      }

      if (!location || typeof location !== 'string' || !['header', 'footer', 'sidebar', 'mobile', 'custom'].includes(location)) {
        return res.status(400).json({ error: 'Invalid location' });
      }

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Items must be an array' });
      }

      const menu = await cmsStorage.createNavigationMenu({
        name,
        location,
        items
      });

      return res.status(201).json({ menu });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Navigation API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
