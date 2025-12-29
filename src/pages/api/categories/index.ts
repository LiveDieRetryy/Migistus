import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/auth';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get categories
      const { parentId } = req.query;

      let categories;
      if (parentId) {
        categories = await cmsStorage.getCategories(parseInt(parentId as string));
      } else {
        categories = await cmsStorage.getCategories();
      }

      return res.status(200).json({ categories });

    } else if (req.method === 'POST') {
      // Create category (requires authentication)
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, slug, description, parentId } = req.body;

      // Validation
      if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
        return res.status(400).json({ error: 'Name must be 1-100 characters' });
      }

      if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
      }

      // Check slug uniqueness
      const existing = await cmsStorage.getCategoryBySlug(slug);
      if (existing) {
        return res.status(400).json({ error: 'Slug already exists' });
      }

      const category = await cmsStorage.createCategory({
        name,
        slug,
        description: description || null,
        parentId: parentId ? parseInt(parentId) : null
      });

      return res.status(201).json({ category });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Categories API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
