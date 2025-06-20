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
      // Load all supplier products for admin review
      const productsPath = path.join(process.cwd(), 'public', 'data', 'supplier-products.json');
      let products: SupplierProduct[] = [];

      if (fs.existsSync(productsPath)) {
        const productsData = fs.readFileSync(productsPath, 'utf8');
        products = JSON.parse(productsData);
      } else {
        // Create sample data if file doesn't exist
        const sampleProducts: SupplierProduct[] = [
          {
            id: '1',
            name: 'Wireless Gaming Headset Pro',
            description: 'Professional wireless gaming headset with 7.1 surround sound, noise cancellation, and 20-hour battery life. Perfect for competitive gaming and streaming.',
            category: 'Electronics',
            price: 149.99,
            images: ['https://example.com/headset.jpg'],
            supplierName: 'TechGear Solutions',
            supplierId: '1',
            status: 'pending',
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            name: 'Smart Home Security Camera',
            description: '4K wireless security camera with AI motion detection, night vision, and cloud storage. Easy setup and mobile app control.',
            category: 'Smart Home',
            price: 89.99,
            images: ['https://example.com/camera.jpg'],
            supplierName: 'TechGear Solutions',
            supplierId: '1',
            status: 'approved',
            submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            name: 'Ergonomic Office Chair',
            description: 'Premium ergonomic office chair with lumbar support, adjustable height, and breathable mesh back. Designed for all-day comfort.',
            category: 'Home & Garden',
            price: 299.99,
            images: ['https://example.com/chair.jpg'],
            supplierName: 'HomeStyle Furnishings',
            supplierId: '2',
            status: 'voting',
            votingStats: {
              upvotes: 87,
              downvotes: 12,
              totalVotes: 99
            },
            submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            votingStartedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];

        // Ensure directory exists
        const dataDir = path.join(process.cwd(), 'public', 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        // Save sample data
        fs.writeFileSync(productsPath, JSON.stringify(sampleProducts, null, 2));
        products = sampleProducts;
      }

      // Sort by submission date (newest first)
      products.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

      return res.status(200).json({ products });

    } catch (error) {
      console.error('Error fetching supplier products:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
