import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/auth';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get all templates
      const templates = await cmsStorage.getTemplates();
      return res.status(200).json({ templates });

    } else if (req.method === 'POST') {
      // Create template (requires master tier)
      const session = await getSessionFromRequest(req);
      
      if (!session || (session.tier !== 'master' && session.tier !== 'migistus')) {
        return res.status(403).json({ error: 'Forbidden - Master tier required' });
      }

      const { name, description, structure } = req.body;

      // Validation
      if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
        return res.status(400).json({ error: 'Name must be 1-100 characters' });
      }

      if (!structure) {
        return res.status(400).json({ error: 'Template structure is required' });
      }

      const template = await cmsStorage.createTemplate({
        name,
        description: description || null,
        structure
      });

      return res.status(201).json({ template });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Templates API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
