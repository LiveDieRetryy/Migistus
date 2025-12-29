import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const applicationId = parseInt(id as string);

  if (isNaN(applicationId)) {
    return res.status(400).json({ error: 'Invalid application ID' });
  }

  if (req.method === 'GET') {
    try {
      const application = await db.getSupplierApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      return res.status(200).json({ application });
    } catch (error) {
      console.error('Error fetching application:', error);
      return res.status(500).json({ error: 'Failed to fetch application' });
    }
  }

  if (req.method === 'PUT') {
    const session = await getSessionFromRequest(req);

    // Only admins can review applications
    if (!session || session.tier !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const { status, reviewNotes } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required (approved/rejected)' });
      }

      const application = await db.updateSupplierApplication(
        applicationId,
        session.userId!,
        { status, reviewNotes }
      );

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // If approved, create supplier profile
      if (status === 'approved') {
        const slug = application.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await db.createSupplierProfile(application.user_id, {
          companyName: application.company_name,
          slug,
          email: application.email,
          phone: application.phone,
          website: application.website,
          description: application.description,
          productCategories: application.product_categories,
          certifications: application.certifications
        });
      }

      return res.status(200).json({ application });
    } catch (error) {
      console.error('Error updating application:', error);
      return res.status(500).json({ error: 'Failed to update application' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
