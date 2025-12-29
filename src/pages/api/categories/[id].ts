import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/auth';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    // Can be ID or slug
    let category;
    if (/^\d+$/.test(id as string)) {
      category = await cmsStorage.getCategory(parseInt(id as string));
    } else {
      category = await cmsStorage.getCategoryBySlug(id as string);
    }

    if (req.method === 'GET') {
      // Get category details
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      return res.status(200).json({ category });

    } else if (req.method === 'PATCH') {
      // Update category
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const { name, slug, description } = req.body;

      const updates: any = {};

      if (name !== undefined) {
        if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
          return res.status(400).json({ error: 'Name must be 1-100 characters' });
        }
        updates.name = name;
      }

      if (slug !== undefined) {
        if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
          return res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
        }

        // Check slug uniqueness
        if (slug !== category.slug) {
          const existing = await cmsStorage.getCategoryBySlug(slug);
          if (existing) {
            return res.status(400).json({ error: 'Slug already exists' });
          }
        }

        updates.slug = slug;
      }

      if (description !== undefined) updates.description = description;

      const updatedCategory = await cmsStorage.updateCategory(category.id, updates);

      return res.status(200).json({ category: updatedCategory });

    } else if (req.method === 'DELETE') {
      // Delete category
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      await cmsStorage.deleteCategory(category.id);

      return res.status(200).json({ success: true });

    } else {
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Category detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
