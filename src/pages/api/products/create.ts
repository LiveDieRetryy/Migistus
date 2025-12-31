import type { NextApiRequest, NextApiResponse } from 'next';
import { productStorage } from '@/utils/productStorageV2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const productData = req.body;
    
    // Validate required fields
    if (!productData.name || !productData.description) {
      return res.status(400).json({ error: 'Missing required fields: name and description' });
    }

    // Create slug from name
    const slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const newProduct = await productStorage.createProduct({
      ...productData,
      slug,
      votes: 0,
      pledges: productData.pledgeCount || 0,
      goal: productData.targetAmount || 100,
      timeframe: '30 days',
      link: `https://migistus.com/products/${slug}`,
      pricingTiers: [],
      featured: false
    });
    
    // Clear cache headers to ensure fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(201).json({ 
      success: true, 
      product: newProduct,
      cacheInvalidate: true // Signal to frontend to invalidate cache
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
}
