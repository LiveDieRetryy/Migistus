import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

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

// Send welcome email with credentials
async function sendSupplierWelcomeEmail(
  email: string,
  companyName: string,
  supplierCode: string,
  temporaryPassword: string
): Promise<boolean> {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to MIGISTUS Supplier Portal!</h2>
        
        <p>Dear ${companyName} Team,</p>
        
        <p>Congratulations! Your application to become a MIGISTUS supplier has been <strong>approved</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Your Login Credentials</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          <p><strong>Supplier Code:</strong> ${supplierCode}</p>
        </div>
        
        <p style="color: #d32f2f;"><strong>⚠️ Important:</strong> Please change your password after your first login for security.</p>
        
        <p>Access your supplier portal at: <a href="https://migistus.com/supplier-login">https://migistus.com/supplier-login</a></p>
        
        <h3>What you can do in your supplier portal:</h3>
        <ul>
          <li>✅ Add products to the voting system</li>
          <li>✅ Monitor product performance</li>
          <li>✅ View voting results and community feedback</li>
          <li>✅ Track sales and analytics</li>
          <li>✅ Manage your supplier profile</li>
        </ul>
        
        <p>If you have any questions or need assistance, please contact our support team.</p>
        
        <p>Best regards,<br>
        The MIGISTUS Team<br>
        <a href="mailto:suppliers@migistus.com">suppliers@migistus.com</a></p>
      </div>
    `;

    const result = await sendEmail({
      to: email,
      subject: 'Welcome to MIGISTUS Supplier Portal - Account Approved',
      text: `Welcome to MIGISTUS Supplier Portal!

Your application has been approved. Login credentials:
- Email: ${email}
- Temporary Password: ${temporaryPassword}
- Supplier Code: ${supplierCode}

Access your portal at: https://migistus.com/supplier-login
IMPORTANT: Change your password after first login.

Best regards, The MIGISTUS Team`,
      html: emailContent
    });

    return result;
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

      const appId = parseInt(applicationId);
      const application = await db.getSupplierApplication(appId);

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (action === 'approve') {
        // Generate temporary password and supplier code
        const temporaryPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase();
        const supplierCode = generateSupplierCode(application.company_name);

        // 1. Create user account with 'Supplier' tier
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
        const newUser = await db.createUser({
          username: application.company_name.toLowerCase().replace(/\\s+/g, '_'),
          email: application.email,
          password: hashedPassword,
          tier: 'Supplier',
          firstName: application.contact_person.split(' ')[0] || application.contact_person,
          lastName: application.contact_person.split(' ').slice(1).join(' ') || ''
        });

        if (!newUser) {
          return res.status(500).json({ error: 'Failed to create user account' });
        }

        // 2. Update application status to approved
        await db.updateSupplierApplication(appId, newUser.id, {
          status: 'approved',
          reviewNotes: 'Application approved and account created'
        });

        // 3. Create supplier profile
        await db.createSupplierProfile(newUser.id, {
          companyName: application.company_name,
          slug: application.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          email: application.email,
          phone: application.phone,
          website: application.website || undefined,
          description: application.business_description || undefined,
          productCategories: application.product_categories ? application.product_categories.split(',').map((c: string) => c.trim()) : []
        });

        // 4. Send welcome email with credentials
        const emailSent = await sendSupplierWelcomeEmail(
          application.email,
          application.company_name,
          supplierCode,
          temporaryPassword
        );

        if (!emailSent) {
          console.warn('Email sending failed, but supplier account was created');
        }

        return res.status(200).json({
          success: true,
          message: 'Application approved and supplier account created',
          supplier: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            supplierCode,
            emailSent
          }
        });

      } else {
        // Reject application
        await db.updateSupplierApplication(appId, 0, {
          status: 'rejected',
          reviewNotes: 'Application rejected by admin'
        });

        return res.status(200).json({
          success: true,
          message: 'Application rejected'
        });
      }

    } catch (error) {
      console.error('Application processing error:', error);
      return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
