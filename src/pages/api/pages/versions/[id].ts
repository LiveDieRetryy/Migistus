import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/auth';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    const pageId = parseInt(id as string);

    if (isNaN(pageId)) {
      return res.status(400).json({ error: 'Invalid page ID' });
    }

    if (req.method === 'GET') {
      // Get page versions
      const { limit = '50' } = req.query;
      const limitNum = Math.min(Math.max(parseInt(limit as string) || 50, 1), 100);

      const versions = await cmsStorage.getPageVersions(pageId, limitNum);
      return res.status(200).json({ versions });

    } else if (req.method === 'POST') {
      // Restore a specific version
      const { versionId } = req.body;

      if (!versionId) {
        return res.status(400).json({ error: 'Version ID required' });
      }

      const page = await cmsStorage.getPage(pageId);

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      // Check permissions
      if (page.authorId !== session.userId && session.tier !== 'master' && session.tier !== 'migistus') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const restoredPage = await cmsStorage.restorePageVersion(pageId, parseInt(versionId));

      if (!restoredPage) {
        return res.status(404).json({ error: 'Version not found' });
      }

      // Create new version entry for the restore
      const versions = await cmsStorage.getPageVersions(pageId);
      const nextVersionNumber = versions[0] ? versions[0].versionNumber + 1 : 1;

      await cmsStorage.createPageVersion({
        pageId,
        content: restoredPage.content,
        authorId: session.userId,
        versionNumber: nextVersionNumber
      });

      return res.status(200).json({ page: restoredPage });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Page versions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
