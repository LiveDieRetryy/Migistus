import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { slug } = req.query;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Invalid slug' });
    }

    if (req.method === 'GET') {
      // Get page by slug
      const page = await cmsStorage.getPageBySlug(slug);

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      // If page is not published, require authentication
      if (page.status !== 'published') {
        const session = await getSessionFromRequest(req);
        if (!session) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Only author or master tier can view unpublished pages
        if (page.authorId !== session.userId && session.tier !== 'master' && session.tier !== 'migistus') {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }

      // Get SEO data
      const seo = await cmsStorage.getSEO(page.id);

      return res.status(200).json({ page, seo });

    } else if (req.method === 'PUT') {
      // Update page
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const page = await cmsStorage.getPageBySlug(slug);

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      // Check permissions
      if (page.authorId !== session.userId && session.tier !== 'master' && session.tier !== 'migistus') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { title, content, status, templateId, categoryId, publishedAt } = req.body;

      const updates: any = {};

      if (title !== undefined) {
        if (typeof title !== 'string' || title.length < 1 || title.length > 255) {
          return res.status(400).json({ error: 'Title must be 1-255 characters' });
        }
        updates.title = title;
      }

      if (content !== undefined) {
        updates.content = content;

        // Create new version if content changed
        const versions = await cmsStorage.getPageVersions(page.id);
        const latestVersion = versions[0];
        const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

        await cmsStorage.createPageVersion({
          pageId: page.id,
          content,
          authorId: session.userId,
          versionNumber: nextVersionNumber
        });
      }

      if (status !== undefined) {
        if (!['draft', 'published', 'archived'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        updates.status = status;

        // Set publishedAt when publishing
        if (status === 'published' && !page.publishedAt) {
          updates.publishedAt = new Date().toISOString();
        }
      }

      if (templateId !== undefined) updates.templateId = templateId ? parseInt(templateId) : null;
      if (categoryId !== undefined) updates.categoryId = categoryId ? parseInt(categoryId) : null;
      if (publishedAt !== undefined) updates.publishedAt = publishedAt;

      const updatedPage = await cmsStorage.updatePage(page.id, updates);

      return res.status(200).json({ page: updatedPage });

    } else if (req.method === 'DELETE') {
      // Delete page
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const page = await cmsStorage.getPageBySlug(slug);

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      // Check permissions
      if (page.authorId !== session.userId && session.tier !== 'master' && session.tier !== 'migistus') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await cmsStorage.deletePage(page.id);

      return res.status(200).json({ success: true });

    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Page slug API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
