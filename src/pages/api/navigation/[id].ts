import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/auth';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const menuId = parseInt(id as string);

    if (isNaN(menuId)) {
      return res.status(400).json({ error: 'Invalid menu ID' });
    }

    if (req.method === 'GET') {
      // Get navigation menu details
      const menu = await cmsStorage.getNavigationMenu(menuId);

      if (!menu) {
        return res.status(404).json({ error: 'Navigation menu not found' });
      }

      return res.status(200).json({ menu });

    } else if (req.method === 'PATCH') {
      // Update navigation menu
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const menu = await cmsStorage.getNavigationMenu(menuId);

      if (!menu) {
        return res.status(404).json({ error: 'Navigation menu not found' });
      }

      const { name, items, isActive } = req.body;

      const updates: any = {};

      if (name !== undefined) {
        if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
          return res.status(400).json({ error: 'Name must be 1-100 characters' });
        }
        updates.name = name;
      }

      if (items !== undefined) {
        if (!Array.isArray(items)) {
          return res.status(400).json({ error: 'Items must be an array' });
        }
        updates.items = items;
      }

      if (isActive !== undefined) updates.isActive = isActive;

      const updatedMenu = await cmsStorage.updateNavigationMenu(menuId, updates);

      return res.status(200).json({ menu: updatedMenu });

    } else if (req.method === 'DELETE') {
      // Delete navigation menu
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const menu = await cmsStorage.getNavigationMenu(menuId);

      if (!menu) {
        return res.status(404).json({ error: 'Navigation menu not found' });
      }

      await cmsStorage.deleteNavigationMenu(menuId);

      return res.status(200).json({ success: true });

    } else {
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Navigation detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
