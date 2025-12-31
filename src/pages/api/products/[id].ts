import { NextApiRequest, NextApiResponse } from 'next';
import { productStorage } from '@/utils/productStorageV2';

// Function to generate slug from product name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Find the product by ID or slug - try as number first, then slug
      let product;
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        product = await productStorage.getProduct(numericId);
      }
      if (!product) {
        product = await productStorage.getProductBySlug(id);
      }

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Ensure consistent data structure
      const normalizedProduct = {
      ...product,
      // Backward compatibility mappings
      imageUrl: product.image || product.imageUrl,
      pledgeCount: product.pledges || product.pledgeCount || 0,
      totalPledged: product.currentAmount || product.totalPledged || 0,
      votes: product.votes || 0,
      pledges: product.pledges || product.pledgeCount || 0,
      featured: product.featured || false,
      stage: product.stage || product.status,
      // Ensure thumbnail config exists
      thumbnailConfig: product.thumbnailConfig || {
        layout: 'standard',
        showPrice: true,
        showVotes: true,
        showPledges: true,
        showCategory: true,
        showStatus: true,
        showProgress: true,
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderRadius: 8,
        shadow: 'md',
        hoverEffect: 'scale',
        badgeStyle: 'corner',
        imageStyle: 'cover',
        titleFont: 'sans',
        titleSize: 'base',
        titleWeight: 'semibold',
        descriptionLines: 2,
        spacing: 'normal',
        alignment: 'left'
      }
    };

    // Add cache headers for real-time updates
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json(normalizedProduct);

  } else if (req.method === 'PUT') {
    // Update product
    const updatedProduct = req.body;
    const numericId = parseInt(id, 10);
    
    // Ensure slug is generated if name changed
    if (updatedProduct.name && !updatedProduct.slug) {
      updatedProduct.slug = generateSlug(updatedProduct.name);
    }

    // Ensure data consistency
    if (updatedProduct.pledges !== undefined) {
      updatedProduct.pledges = typeof updatedProduct.pledges === "number" ? updatedProduct.pledges : 0;
    }
    if (updatedProduct.pricingTiers !== undefined) {
      updatedProduct.pricingTiers = Array.isArray(updatedProduct.pricingTiers) ? updatedProduct.pricingTiers : [];
    }
    
    // Update the product
    const updated = await productStorage.updateProduct(numericId, updatedProduct);
    
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log(`Product ${id} updated successfully`);
    
    // Clear cache headers to ensure fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(200).json({ success: true, product: updated });

  } else if (req.method === 'DELETE') {
    // Delete product
    const numericId = parseInt(id, 10);
    
    await productStorage.deleteProduct(numericId);
    
    console.log(`Product ${id} deleted successfully`);
    res.status(200).json({ success: true });

  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
