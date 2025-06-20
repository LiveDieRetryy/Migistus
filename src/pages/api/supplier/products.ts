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
      const { supplierId } = req.query;

      if (!supplierId) {
        return res.status(400).json({ error: 'Supplier ID is required' });
      }

      // Load supplier products
      const productsPath = path.join(process.cwd(), 'public', 'data', 'supplier-products.json');
      let products: SupplierProduct[] = [];

      if (fs.existsSync(productsPath)) {
        const productsData = fs.readFileSync(productsPath, 'utf8');
        products = JSON.parse(productsData);
      }

      // Filter products by supplier
      const supplierProducts = products.filter(product => product.supplierId === supplierId);

      return res.status(200).json({ products: supplierProducts });

    } catch (error) {
      console.error('Error fetching supplier products:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        name,
        description,
        category,
        price,
        imageUrl,
        supplierId,
        supplierName
      } = req.body;

      // Validate required fields
      if (!name || !description || !category || !price || !supplierId || !supplierName) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      // Create new product
      const newProduct: SupplierProduct = {
        id: Date.now().toString(),
        name,
        description,
        category,
        price: parseFloat(price),
        images: imageUrl ? [imageUrl] : [],
        supplierName,
        supplierId,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      // Load existing products
      const productsPath = path.join(process.cwd(), 'public', 'data', 'supplier-products.json');
      let products: SupplierProduct[] = [];

      if (fs.existsSync(productsPath)) {
        const productsData = fs.readFileSync(productsPath, 'utf8');
        products = JSON.parse(productsData);
      }

      // Add new product
      products.push(newProduct);

      // Ensure directory exists
      const dataDir = path.join(process.cwd(), 'public', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Save updated products
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

      return res.status(200).json(newProduct);

    } catch (error) {
      console.error('Error creating supplier product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { productId, status, votingStats } = req.body;

      if (!productId || !status) {
        return res.status(400).json({ error: 'Product ID and status are required' });
      }

      // Load products
      const productsPath = path.join(process.cwd(), 'public', 'data', 'supplier-products.json');
      if (!fs.existsSync(productsPath)) {
        return res.status(404).json({ error: 'Products file not found' });
      }

      const productsData = fs.readFileSync(productsPath, 'utf8');
      let products: SupplierProduct[] = JSON.parse(productsData);

      // Find and update product
      const productIndex = products.findIndex(p => p.id === productId);
      if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }

      products[productIndex].status = status;
      
      if (status === 'approved') {
        products[productIndex].approvedAt = new Date().toISOString();
      } else if (status === 'voting') {
        products[productIndex].votingStartedAt = new Date().toISOString();
        if (votingStats) {
          products[productIndex].votingStats = votingStats;
        }
      }

      if (votingStats && status === 'voting') {
        products[productIndex].votingStats = votingStats;
      }

      // Save updated products
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

      return res.status(200).json(products[productIndex]);

    } catch (error) {
      console.error('Error updating supplier product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
