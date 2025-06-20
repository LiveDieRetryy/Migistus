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
  if (req.method === 'POST') {
    try {
      const {
        companyName,
        contactPerson,
        email,
        phone,
        address,
        productCategories,
        businessDescription,
        website,
        yearsInBusiness,
        expectedVolume
      } = req.body;

      // Validate required fields
      if (!companyName || !contactPerson || !email || !phone || !address || 
          !productCategories || !businessDescription || !yearsInBusiness || !expectedVolume) {
        return res.status(400).json({ error: 'All required fields must be filled' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Load existing applications
      const applicationsPath = path.join(process.cwd(), 'public', 'data', 'supplier-applications.json');
      let applications: SupplierApplication[] = [];

      if (fs.existsSync(applicationsPath)) {
        const applicationsData = fs.readFileSync(applicationsPath, 'utf8');
        applications = JSON.parse(applicationsData);
      }

      // Check if email already exists
      const existingApplication = applications.find(app => 
        app.email.toLowerCase() === email.toLowerCase()
      );

      if (existingApplication) {
        return res.status(409).json({ 
          error: 'An application with this email already exists' 
        });
      }

      // Create new application
      const newApplication: SupplierApplication = {
        id: Date.now().toString(),
        companyName,
        contactPerson,
        email,
        phone,
        address,
        productCategories,
        businessDescription,
        website: website || '',
        yearsInBusiness,
        expectedVolume,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      // Add to applications array
      applications.push(newApplication);

      // Ensure directory exists
      const dataDir = path.join(process.cwd(), 'public', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Save updated applications
      fs.writeFileSync(applicationsPath, JSON.stringify(applications, null, 2));

      return res.status(200).json({ 
        message: 'Application submitted successfully',
        applicationId: newApplication.id
      });

    } catch (error) {
      console.error('Supplier registration error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // GET endpoint for admin to view applications
    try {
      const applicationsPath = path.join(process.cwd(), 'public', 'data', 'supplier-applications.json');
      
      if (!fs.existsSync(applicationsPath)) {
        return res.status(200).json({ applications: [] });
      }

      const applicationsData = fs.readFileSync(applicationsPath, 'utf8');
      const applications = JSON.parse(applicationsData);

      return res.status(200).json({ applications });
    } catch (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
