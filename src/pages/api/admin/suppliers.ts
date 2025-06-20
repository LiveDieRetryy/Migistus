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
  if (req.method === 'GET') {
    try {
      const suppliersPath = path.join(process.cwd(), 'public', 'data', 'suppliers.json');
      
      if (!fs.existsSync(suppliersPath)) {
        return res.status(200).json({ suppliers: [] });
      }

      const suppliersData = fs.readFileSync(suppliersPath, 'utf8');
      const suppliers: Supplier[] = JSON.parse(suppliersData);
      
      // Return suppliers without passwords for security
      const safeSuppliers = suppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        supplierCode: supplier.supplierCode,
        companyName: supplier.companyName,
        status: supplier.status,
        joinedDate: supplier.joinedDate,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        address: supplier.address,
        productCategories: supplier.productCategories,
        totalProducts: supplier.totalProducts,
        totalSales: supplier.totalSales,
        rating: supplier.rating
      }));

      return res.status(200).json({ suppliers: safeSuppliers });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
