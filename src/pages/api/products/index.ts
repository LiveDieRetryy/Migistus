// pages/api/products/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { productStorage } from '@/utils/productStorageV2';
import { processLifecycleTransitions, DEFAULT_LIFECYCLE_CONFIG } from "@/utils/productLifecycle";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { stage, category, featured } = req.query;
      
      const filters: any = {};
      if (stage) filters.stage = stage as string;
      if (category) filters.category = category as string;
      if (featured !== undefined) filters.featured = featured === 'true';

      const products = await productStorage.getProducts(filters);
      
      console.log('API: Returning products:', products.length);
      console.log('API: Pending review products:', 0);
      
      const stages = {
        voting: products.filter((p: any) => p.stage === 'voting').length,
        comingSoon: products.filter((p: any) => p.stage === 'coming-soon').length,
        communityDrops: products.filter((p: any) => p.stage === 'community-drops').length,
        recentlyCompleted: products.filter((p: any) => p.stage === 'recently-completed').length
      };
      console.log('API: Stage breakdown:', stages);
      
      // Return in the format the frontend expects
      return res.status(200).json({ products, totalProducts: products.length });
    }

    if (req.method === 'POST') {
      const newProduct = await productStorage.createProduct(req.body);
      return res.status(201).json({ success: true, product: newProduct });
    }

    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;
      if (!id) return res.status(400).json({ error: 'Product ID required' });
      
      const updated = await productStorage.updateProduct(id, updateData);
      return res.status(200).json({ success: true, product: updated });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing ID to delete' });
      
      await productStorage.deleteProduct(parseInt(id as string));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Products API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
