import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const suppliers = await db.getAllSuppliers();
      
      // Return suppliers without passwords for security
      const safeSuppliers = suppliers.map((supplier: any) => ({
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        supplierCode: supplier.supplier_code,
        companyName: supplier.company_name,
        status: supplier.status,
        joinedDate: supplier.created_at,
        contactPerson: supplier.contact_person,
        phone: supplier.phone,
        address: supplier.address,
        productCategories: supplier.product_categories || [],
        totalProducts: supplier.total_products || 0,
        totalSales: supplier.total_sales || 0,
        rating: supplier.rating || 0
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
