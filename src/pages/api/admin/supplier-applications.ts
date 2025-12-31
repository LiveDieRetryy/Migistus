import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

interface SupplierApplication {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  category: string;
  description: string;
  experience: string;
  motivation: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get all supplier applications
    try {
      const applications = await db.getSupplierApplications();
      
      // Sort by submission date (newest first)
      applications.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      res.status(200).json(applications);
    } catch (error) {
      console.error('Error reading applications:', error);
      res.status(500).json({ error: 'Failed to read applications' });
    }
  } 
  else if (req.method === 'PUT') {
    // Update application status
    try {
      const { applicationId, status, reviewNotes } = req.body;
      
      if (!applicationId || !status) {
        return res.status(400).json({ error: 'Application ID and status are required' });
      }

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const application = await db.getSupplierApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Update application
      const updatedApplication = await db.updateSupplierApplication(applicationId, 1, {
        status,
        reviewNotes: reviewNotes || ''
      });

      // If approved, could potentially create a new supplier record here
      if (status === 'approved') {
        // TODO: Create supplier account and send welcome email
        console.log(`Supplier application approved: ${application.company_name}`);
      }

      res.status(200).json({ 
        success: true, 
        application: updatedApplication 
      });
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ error: 'Failed to update application' });
    }
  } 
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
