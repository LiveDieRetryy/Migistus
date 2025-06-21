import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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
      const applicationsPath = path.join(process.cwd(), 'public', 'data', 'supplier-applications.json');
      
      if (!fs.existsSync(applicationsPath)) {
        return res.status(200).json([]);
      }

      const fileContent = fs.readFileSync(applicationsPath, 'utf8');
      const applications: SupplierApplication[] = JSON.parse(fileContent);
      
      // Sort by submission date (newest first)
      applications.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

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

      const applicationsPath = path.join(process.cwd(), 'public', 'data', 'supplier-applications.json');
      
      if (!fs.existsSync(applicationsPath)) {
        return res.status(404).json({ error: 'No applications found' });
      }

      const fileContent = fs.readFileSync(applicationsPath, 'utf8');
      const applications: SupplierApplication[] = JSON.parse(fileContent);
      
      const applicationIndex = applications.findIndex(app => app.id === applicationId);
      
      if (applicationIndex === -1) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Update application
      applications[applicationIndex] = {
        ...applications[applicationIndex],
        status,
        reviewedAt: new Date().toISOString(),
        reviewNotes: reviewNotes || ''
      };

      // Save updated applications
      fs.writeFileSync(applicationsPath, JSON.stringify(applications, null, 2));

      // If approved, could potentially create a new supplier record here
      if (status === 'approved') {
        // TODO: Create supplier account and send welcome email
        console.log(`Supplier application approved: ${applications[applicationIndex].companyName}`);
      }

      res.status(200).json({ 
        success: true, 
        application: applications[applicationIndex] 
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
