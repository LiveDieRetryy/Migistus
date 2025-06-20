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

interface Supplier {
  id: string;
  name: string;
  email: string;
  password: string;
  supplierCode: string;
  companyName: string;
  status: 'active' | 'pending' | 'suspended';
  joinedDate: string;
  contactPerson: string;
  phone: string;
  address: string;
  productCategories: string[];
  totalProducts: number;
  totalSales: number;
  rating: number;
}

// Generate unique supplier code
function generateSupplierCode(companyName: string): string {
  const prefix = 'SUP-';
  const companyCode = companyName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${companyCode}${randomNum}`;
}

// Simulate sending email (in production, use a real email service like SendGrid, Nodemailer, etc.)
async function sendSupplierCredentials(email: string, companyName: string, supplierCode: string): Promise<boolean> {
  try {
    // In production, this would use a real email service
    console.log(`
===============================================
EMAIL SENT TO: ${email}
===============================================
Subject: Welcome to MIGISTUS Supplier Portal

Dear ${companyName} Team,

Congratulations! Your application to become a MIGISTUS supplier has been approved.

Your supplier portal credentials:
- Email: ${email}
- Supplier Code: ${supplierCode}

You can now access your supplier dashboard at:
https://migistus.com/supplier-login

What you can do in your supplier portal:
✅ Add products to the voting system
✅ Monitor product performance
✅ View voting results and community feedback
✅ Track sales and analytics

Important Security Notes:
- Keep your supplier code confidential - it serves as your login password
- Only use your registered email and supplier code to access the portal
- Contact support if you experience any issues

Welcome to the MIGISTUS supplier network!

Best regards,
The MIGISTUS Team
suppliers@migistus.com
===============================================
    `);
    
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { applicationId, action } = req.body;

      if (!applicationId || !action) {
        return res.status(400).json({ error: 'Application ID and action are required' });
      }

      if (action !== 'approve' && action !== 'reject') {
        return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
      }

      // Load applications
      const applicationsPath = path.join(process.cwd(), 'public', 'data', 'supplier-applications.json');
      if (!fs.existsSync(applicationsPath)) {
        return res.status(404).json({ error: 'Applications file not found' });
      }

      const applicationsData = fs.readFileSync(applicationsPath, 'utf8');
      let applications: SupplierApplication[] = JSON.parse(applicationsData);

      // Find the application
      const applicationIndex = applications.findIndex(app => app.id === applicationId);
      if (applicationIndex === -1) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const application = applications[applicationIndex];

      // Update application status
      applications[applicationIndex].status = action === 'approve' ? 'approved' : 'rejected';

      // Save updated applications
      fs.writeFileSync(applicationsPath, JSON.stringify(applications, null, 2));      if (action === 'approve') {
        // Create supplier account
        const supplierCode = generateSupplierCode(application.companyName);

        const newSupplier: Supplier = {
          id: Date.now().toString(),
          name: application.companyName,
          email: application.email,
          password: '', // Password not used - supplier code serves as authentication
          supplierCode: supplierCode,
          companyName: application.companyName,
          status: 'active',
          joinedDate: new Date().toISOString(),
          contactPerson: application.contactPerson,
          phone: application.phone,
          address: application.address,
          productCategories: application.productCategories.split(',').map(cat => cat.trim()),
          totalProducts: 0,
          totalSales: 0,
          rating: 5.0
        };

        // Load existing suppliers
        const suppliersPath = path.join(process.cwd(), 'public', 'data', 'suppliers.json');
        let suppliers: Supplier[] = [];

        if (fs.existsSync(suppliersPath)) {
          const suppliersData = fs.readFileSync(suppliersPath, 'utf8');
          suppliers = JSON.parse(suppliersData);
        }

        // Add new supplier
        suppliers.push(newSupplier);

        // Save updated suppliers
        fs.writeFileSync(suppliersPath, JSON.stringify(suppliers, null, 2));        // Send email with credentials
        const emailSent = await sendSupplierCredentials(
          application.email,
          application.companyName,
          supplierCode
        );

        if (!emailSent) {
          console.warn('Email sending failed, but supplier account was created');
        }

        return res.status(200).json({
          message: 'Application approved and supplier account created',
          supplier: {
            id: newSupplier.id,
            email: newSupplier.email,
            supplierCode: newSupplier.supplierCode,
            emailSent: emailSent
          }
        });
      } else {
        // Just reject the application
        return res.status(200).json({
          message: 'Application rejected'
        });
      }

    } catch (error) {
      console.error('Application processing error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
