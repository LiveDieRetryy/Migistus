import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/auth';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { pageId } = req.query;
    const pageIdNum = parseInt(pageId as string);

    if (isNaN(pageIdNum)) {
      return res.status(400).json({ error: 'Invalid page ID' });
    }

    if (req.method === 'GET') {
      // Get SEO settings for page
      const seo = await cmsStorage.getSEO(pageIdNum);
      return res.status(200).json({ seo });

    } else if (req.method === 'PUT') {
      // Update SEO settings
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify page exists and user has permission
      const page = await cmsStorage.getPage(pageIdNum);

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (page.authorId !== session.userId && session.tier !== 'master' && session.tier !== 'migistus') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { metaTitle, metaDescription, metaKeywords, ogImage, canonicalUrl } = req.body;

      const updates: any = {};

      if (metaTitle !== undefined) {
        if (metaTitle && (typeof metaTitle !== 'string' || metaTitle.length > 60)) {
          return res.status(400).json({ error: 'Meta title must be 60 characters or less' });
        }
        updates.metaTitle = metaTitle;
      }

      if (metaDescription !== undefined) {
        if (metaDescription && (typeof metaDescription !== 'string' || metaDescription.length > 160)) {
          return res.status(400).json({ error: 'Meta description must be 160 characters or less' });
        }
        updates.metaDescription = metaDescription;
      }

      if (metaKeywords !== undefined) updates.metaKeywords = metaKeywords;
      if (ogImage !== undefined) updates.ogImage = ogImage;
      if (canonicalUrl !== undefined) updates.canonicalUrl = canonicalUrl;

      // Check if SEO settings exist
      const existing = await cmsStorage.getSEO(pageIdNum);

      let seo;
      if (existing) {
        seo = await cmsStorage.updateSEO(pageIdNum, updates);
      } else {
        seo = await cmsStorage.createSEO({ pageId: pageIdNum, ...updates });
      }

      return res.status(200).json({ seo });

    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('SEO API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
