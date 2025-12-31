import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { supplierId } = req.query;

      if (!supplierId) {
        return res.status(400).json({ error: 'Supplier ID is required' });
      }

      // Get all products and filter by supplier (if supplier field exists)
      const allProducts = await db.getProducts();
      const supplierProducts = allProducts.filter((p: any) => 
        p.supplier_id == supplierId || p.supplierId == supplierId
      );

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

      // Create new product in database
      const newProduct = await db.createProduct({
        name,
        description,
        category,
        goal: parseFloat(price),
        image: imageUrl || '',
        supplier_id: parseInt(supplierId),
        supplierName,
        status: 'pending',
        stage: 'pending',
        created_at: new Date().toISOString()
      });

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

      // Get product from database
      const product = await db.getProduct(parseInt(productId));
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Update product status
      const updates: any = { status };
      
      if (status === 'approved') {
        updates.approvedAt = new Date().toISOString();
      } else if (status === 'voting') {
        updates.votingStartedAt = new Date().toISOString();
        if (votingStats) {
          updates.votingStats = votingStats;
        }
      }

      if (votingStats && status === 'voting') {
        updates.votingStats = votingStats;
      }

      const updatedProduct = await db.updateProduct(parseInt(productId), updates);

      return res.status(200).json(updatedProduct);

    } catch (error) {
      console.error('Error updating supplier product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
