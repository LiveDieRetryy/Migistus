import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/auth';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const templateId = parseInt(id as string);

    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    if (req.method === 'GET') {
      // Get template details
      const template = await cmsStorage.getTemplate(templateId);

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      return res.status(200).json({ template });

    } else if (req.method === 'PATCH') {
      // Update template (requires master tier)
      const session = await getSessionFromRequest(req);
      
      if (!session || (session.tier !== 'master' && session.tier !== 'migistus')) {
        return res.status(403).json({ error: 'Forbidden - Master tier required' });
      }

      const template = await cmsStorage.getTemplate(templateId);

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const { name, description, structure, isActive } = req.body;

      const updates: any = {};

      if (name !== undefined) {
        if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
          return res.status(400).json({ error: 'Name must be 1-100 characters' });
        }
        updates.name = name;
      }

      if (description !== undefined) updates.description = description;
      if (structure !== undefined) updates.structure = structure;
      if (isActive !== undefined) updates.isActive = isActive;

      const updatedTemplate = await cmsStorage.updateTemplate(templateId, updates);

      return res.status(200).json({ template: updatedTemplate });

    } else if (req.method === 'DELETE') {
      // Soft delete template (requires master tier)
      const session = await getSessionFromRequest(req);
      
      if (!session || (session.tier !== 'master' && session.tier !== 'migistus')) {
        return res.status(403).json({ error: 'Forbidden - Master tier required' });
      }

      const template = await cmsStorage.getTemplate(templateId);

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      await cmsStorage.deleteTemplate(templateId);

      return res.status(200).json({ success: true });

    } else {
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Template detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
