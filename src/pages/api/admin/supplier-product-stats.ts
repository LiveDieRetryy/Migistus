import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface SupplierProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  supplierName: string;
  supplierId: string;
  status: 'pending' | 'approved' | 'rejected' | 'voting';
  votingStats?: {
    upvotes: number;
    downvotes: number;
    totalVotes: number;
  };
  submittedAt: string;
  approvedAt?: string;
  votingStartedAt?: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const dataPath = path.join(process.cwd(), 'public', 'data', 'supplier-products.json');
      
      if (!fs.existsSync(dataPath)) {
        return res.status(200).json({ 
          pendingCount: 0,
          totalCount: 0,
          products: [] 
        });
      }

      const fileContent = fs.readFileSync(dataPath, 'utf8');
      const products: SupplierProduct[] = JSON.parse(fileContent);
      
      const pendingProducts = products.filter(product => product.status === 'pending');
      
      return res.status(200).json({
        pendingCount: pendingProducts.length,
        totalCount: products.length,
        products: pendingProducts
      });
    } catch (error) {
      console.error('Error fetching supplier product stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
