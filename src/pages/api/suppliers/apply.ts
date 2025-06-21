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

    // Create new application
    const newApplication: SupplierApplication = {
      id: Date.now().toString(),
      ...applicationData,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    // Read existing applications
    const applicationsPath = path.join(process.cwd(), 'public', 'data', 'supplier-applications.json');
    let applications: SupplierApplication[] = [];
    
    try {
      if (fs.existsSync(applicationsPath)) {
        const fileContent = fs.readFileSync(applicationsPath, 'utf8');
        applications = JSON.parse(fileContent);
      }
    } catch (error) {
      console.warn('Could not read existing applications, starting fresh');
    }

    // Check for duplicate email
    const existingApplication = applications.find(app => app.email === applicationData.email);
    if (existingApplication) {
      return res.status(409).json({ 
        error: 'An application with this email already exists',
        existingStatus: existingApplication.status 
      });
    }

    // Add new application
    applications.push(newApplication);

    // Save applications
    try {
      fs.writeFileSync(applicationsPath, JSON.stringify(applications, null, 2));
    } catch (error) {
      console.error('Error saving application:', error);
      return res.status(500).json({ error: 'Failed to save application' });
    }

    // Record analytics event
    try {
      const analyticsPath = path.join(process.cwd(), 'public', 'data', 'live-tracking.json');
      let events = [];
      
      if (fs.existsSync(analyticsPath)) {
        const fileContent = fs.readFileSync(analyticsPath, 'utf8');
        events = JSON.parse(fileContent);
      }

      events.push({
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'supplier_application',
        timestamp: new Date().toISOString(),
        userId: `guest_${Date.now()}`,
        metadata: {
          companyName: applicationData.companyName,
          category: applicationData.category,
          email: applicationData.email
        }
      });

      fs.writeFileSync(analyticsPath, JSON.stringify(events, null, 2));
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
