// pages/api/products/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { productStorage } from '@/utils/productStorageV2';
import { processLifecycleTransitions, DEFAULT_LIFECYCLE_CONFIG } from "@/utils/productLifecycle";
import { appCache as cache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { stage, category, featured } = req.query;
      
      // Create cache key based on query params
      const cacheKey = `products:${stage || 'all'}:${category || 'all'}:${featured || 'all'}`;
      
      // Try to get from cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('API: Returning cached products');
        return res.status(200).json(cached);
      }
      
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
      
      const response = { products, totalProducts: products.length };
      
      // Cache for 60 seconds
      cache.set(cacheKey, response, 60 * 1000);
      
      return res.status(200).json(response);
    }

    if (req.method === 'POST') {
      const newProduct = await productStorage.createProduct(req.body);
      // Invalidate all product list caches
      cache.invalidatePattern('products:.*');
      return res.status(201).json({ success: true, product: newProduct });
    }

    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;
      if (!id) return res.status(400).json({ error: 'Product ID required' });
      
      const updated = await productStorage.updateProduct(id, updateData);
      // Invalidate all product list caches
      cache.invalidatePattern('products:.*');
      return res.status(200).json({ success: true, product: updated });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing ID to delete' });
      
      await productStorage.deleteProduct(parseInt(id as string));
      // Invalidate all product list caches
      cache.invalidatePattern('products:.*');
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Products API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
