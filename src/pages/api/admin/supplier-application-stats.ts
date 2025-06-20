import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface SupplierApplication {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  productCategories: string;
  businessDescription: string;
  website: string;
  yearsInBusiness: string;
  expectedVolume: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const dataPath = path.join(process.cwd(), 'public', 'data', 'supplier-applications.json');
      
      if (!fs.existsSync(dataPath)) {
        return res.status(200).json({ 
          pendingCount: 0,
          totalCount: 0,
          applications: [] 
        });
      }

      const fileContent = fs.readFileSync(dataPath, 'utf8');
      const applications: SupplierApplication[] = JSON.parse(fileContent);
      
      const pendingApplications = applications.filter(app => app.status === 'pending');
      
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
