import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const applicationData = req.body;
    
    // Validate required fields
    const requiredFields = ['companyName', 'contactName', 'email', 'category', 'description', 'motivation'];
    const missingFields = requiredFields.filter(field => !applicationData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicationData.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check for duplicate email (query existing applications)
    const existingApps = await db.getSupplierApplications();
    const existingApplication = existingApps.find((app: any) => app.email === applicationData.email);
    
    if (existingApplication) {
      return res.status(409).json({ 
        error: 'An application with this email already exists',
        existingStatus: existingApplication.status 
      });
    }

    // Create new application (userId can be 0 for guest applications)
    const newApplication = await db.createSupplierApplication(0, {
      companyName: applicationData.companyName,
      email: applicationData.email,
      phone: applicationData.phone || null,
      website: applicationData.website || null,
      description: applicationData.description,
      productCategories: applicationData.category ? [applicationData.category] : []
    });

    // Record analytics event
    try {
      await db.createAnalyticsEvent({
        eventType: 'supplier_application',
        userId: undefined,
        metadata: {
          companyName: applicationData.companyName,
          category: applicationData.category,
          email: applicationData.email
        }
      });
    } catch (error) {
      console.warn('Could not record analytics event:', error);
    }

    res.status(201).json({ 
      success: true, 
      applicationId: newApplication.id,
      message: 'Application submitted successfully' 
    });

  } catch (error) {
    console.error('Error processing application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
