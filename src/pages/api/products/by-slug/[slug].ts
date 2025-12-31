import { NextApiRequest, NextApiResponse } from 'next';
import { productStorage } from '@/utils/productStorageV2';

interface Product {
  id: number;
  name: string;
  slug?: string;
  image?: string;
  images?: string[];
  description?: string;
  fullDescription?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  votes?: number;
  stage?: string;
  stageEnteredAt?: string;
  features?: string[];
  specifications?: { [key: string]: string };
  supplier?: {
    name: string;
    rating: number;
    verified?: boolean;
    location?: string;
  };
  pledges?: number;
  pledgeGoal?: number;
  pricingTiers?: PricingTier[];
  reviews?: ProductReview[];
  video?: string;
  gallery?: string[];
  tags?: string[];
  compatibility?: string[];
  warranty?: string;
  shipping?: {
    free: boolean;
    estimatedDays: number;
    regions: string[];
  };
  socialMetrics?: {
    likes: number;
    shares: number;
    comments: number;
  };
}

interface PricingTier {
  quantity: number;
  price: number;
  discount?: number;
  label?: string;
}

interface ProductReview {
  id: number;
  userId: string;
  userName: string;
  userTier: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
}

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
  if (req.method === 'GET') {
    try {
      const { slug } = req.query;

      if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ error: 'Product slug is required' });
      }

      // Get product by slug from productStorage
      const product = await productStorage.getProductBySlug(slug as string);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Enhance product with additional data
      const enhancedProduct = {
        ...product,
        slug: product.slug || generateSlug(product.name),
        // Add default values for missing fields
        images: product.images || (product.image ? [product.image] : ['/images/placeholder.png']),
        votes: product.votes || 0,
        features: product.features || [
          'High-quality materials',
          'Community-voted product',
          'Satisfaction guaranteed'
        ],
        specifications: product.specifications || {
          'Brand': 'MIGISTUS Selection',
          'Availability': 'Community Drop',
          'Quality': 'Premium'
        },
        supplier: product.supplier || {
          name: 'MIGISTUS Partners',
          rating: 4.8
        }
      };

      // Get vote count from productStorage
      try {
        const voteCount = await productStorage.getProductVoteCount(product.id);
        enhancedProduct.votes = voteCount;
      } catch (error) {
        console.log('Could not load votes data:', error);
      }

      return res.status(200).json({ product: enhancedProduct });

    } catch (error) {
      console.error('Error fetching product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { slug } = req.query;

      if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ error: 'Product slug is required' });
      }

      // Get product to delete
      const product = await productStorage.getProductBySlug(slug);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Delete the product
      await productStorage.deleteProduct(product.id);

      return res.status(200).json({ success: true, deletedProduct: product });

    } catch (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
