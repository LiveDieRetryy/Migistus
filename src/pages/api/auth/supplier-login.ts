import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { email, supplierCode } = req.body;

      if (!email || !supplierCode) {
        return res.status(400).json({ error: 'Email and supplier code are required' });
      }

      // Load suppliers data
      const suppliersPath = path.join(process.cwd(), 'public', 'data', 'suppliers.json');
      let suppliers: Supplier[] = [];

      if (fs.existsSync(suppliersPath)) {
        const suppliersData = fs.readFileSync(suppliersPath, 'utf8');
        suppliers = JSON.parse(suppliersData);
      } else {        // Create empty suppliers array if file doesn't exist
        suppliers = [];
        fs.writeFileSync(suppliersPath, JSON.stringify(suppliers, null, 2));}

      // Find supplier by email and supplier code
      const supplier = suppliers.find(s => 
        s.email.toLowerCase() === email.toLowerCase() && 
        s.supplierCode === supplierCode
      );

      if (!supplier) {
        return res.status(401).json({ error: 'Invalid email or supplier code' });
      }

      // Check if supplier is active
      if (supplier.status !== 'active') {
        return res.status(403).json({ error: 'Supplier account is not active. Please contact support.' });
      }

      // Return supplier data (excluding password for security)
      const { password: _, ...supplierData } = supplier;
      return res.status(200).json({ 
        message: 'Login successful', 
        supplier: supplierData 
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
