import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { status, limit } = req.query;
      
      // Only admins can view applications
      const session = await getSessionFromRequest(req);
      if (!session || session.tier !== 'Admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const applications = await db.getSupplierApplications(
        status as string,
        parseInt(limit as string) || 50
      );

      return res.status(200).json({ applications });
    } catch (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }
  }

  if (req.method === 'POST') {
    const session = await getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { companyName, email, phone, website, description, productCategories, certifications } = req.body;

      if (!companyName || !email) {
        return res.status(400).json({ error: 'Company name and email are required' });
      }

      const application = await db.createSupplierApplication(session.userId, {
        companyName,
        email,
        phone,
        website,
        description,
        productCategories,
        certifications
      });

      return res.status(201).json({ application });
    } catch (error) {
      console.error('Error creating application:', error);
      return res.status(500).json({ error: 'Failed to create application' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
