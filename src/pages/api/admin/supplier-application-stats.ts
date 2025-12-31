import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const applications = await db.getSupplierApplications();
      
      const pendingApplications = applications.filter((app: any) => app.status === 'pending');
      
      return res.status(200).json({
        pendingCount: pendingApplications.length,
        totalCount: applications.length,
        applications: pendingApplications
      });
    } catch (error) {
      console.error('Error fetching supplier application stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
