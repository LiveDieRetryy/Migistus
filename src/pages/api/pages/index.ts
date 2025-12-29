import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    
    if (req.method === 'GET') {
      // Get pages with filtering
      const { status, categoryId, authorId, limit = '50', offset = '0' } = req.query;

      const limitNum = Math.min(Math.max(parseInt(limit as string) || 50, 1), 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const filters: any = { limit: limitNum, offset: offsetNum };

      if (status && typeof status === 'string') filters.status = status;
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (authorId) filters.authorId = parseInt(authorId as string);

      const pages = await cmsStorage.getPages(filters);
      return res.status(200).json({ pages });

    } else if (req.method === 'POST') {
      // Create new page (requires authentication)
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, slug, content, status, templateId, categoryId, publishedAt } = req.body;

      // Validation
      if (!title || typeof title !== 'string' || title.length < 1 || title.length > 255) {
        return res.status(400).json({ error: 'Title must be 1-255 characters' });
      }

      if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
      }

      // Check slug uniqueness
      const existing = await cmsStorage.getPageBySlug(slug);
      if (existing) {
        return res.status(400).json({ error: 'Slug already exists' });
      }

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      if (status && !['draft', 'published', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const page = await cmsStorage.createPage({
        title,
        slug,
        content,
        authorId: session.userId,
        status: status || 'draft',
        templateId: templateId ? parseInt(templateId) : undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        publishedAt: publishedAt || (status === 'published' ? new Date().toISOString() : undefined)
      });

      // Create initial version
      await cmsStorage.createPageVersion({
        pageId: page.id,
        content: page.content,
        authorId: session.userId,
        versionNumber: 1
      });

      return res.status(201).json({ page });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Pages API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
