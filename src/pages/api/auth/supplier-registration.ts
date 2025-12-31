import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

      // Check if email already has an application
      const existingApplications = await db.getSupplierApplications();
      const existingApplication = existingApplications.find((app: any) => 
        app.email.toLowerCase() === email.toLowerCase()
      );

      if (existingApplication) {
        return res.status(409).json({ 
          error: 'An application with this email already exists' 
        });
      }

      // Create new application in database
      const newApplication = await db.createSupplierApplication(0, {
        companyName: companyName,
        email: email.toLowerCase(),
        phone,
        website: website || '',
        description: businessDescription,
        productCategories: [productCategories],
        certifications: []
      });

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
      const applications = await db.getSupplierApplications();
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
