import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { email, supplierCode } = req.body;

      if (!email || !supplierCode) {
        return res.status(400).json({ error: 'Email and supplier code are required' });
      }

      // Find supplier by email and supplier code
      const supplier = await db.getSupplierByEmailAndCode(email.toLowerCase(), supplierCode);

      if (!supplier) {
        return res.status(401).json({ error: 'Invalid email or supplier code' });
      }

      // Check if supplier is active
      if (supplier.is_active !== true) {
        return res.status(403).json({ error: 'Supplier account is not active. Please contact support.' });
      }

      // Return supplier data
      return res.status(200).json({ 
        message: 'Login successful', 
        supplier: {
          id: supplier.id,
          userId: supplier.user_id,
          email: supplier.email,
          supplierCode: supplier.supplier_code,
          companyName: supplier.company_name,
          status: supplier.status,
          contactPerson: supplier.contact_person,
          phone: supplier.phone,
          address: supplier.address,
          productCategories: supplier.product_categories
        } 
      });

    } catch (error) {
      console.error('Supplier login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
