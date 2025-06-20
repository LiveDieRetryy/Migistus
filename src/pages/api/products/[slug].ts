import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { slug } = req.query;

      if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ error: 'Product slug is required' });
      }

      // Load products from various sources
      const productsPath = path.join(process.cwd(), 'public', 'data', 'products.json');
      const votingPath = path.join(process.cwd(), 'public', 'data', 'voting.json');
      const supplierProductsPath = path.join(process.cwd(), 'public', 'data', 'supplier-products.json');

      let allProducts: Product[] = [];

      // Load main products
      if (fs.existsSync(productsPath)) {
        const productsData = fs.readFileSync(productsPath, 'utf8');
        const products = JSON.parse(productsData);
        allProducts = allProducts.concat(products.products || products || []);
      }

      // Load voting products
      if (fs.existsSync(votingPath)) {
        const votingData = fs.readFileSync(votingPath, 'utf8');
        const votingProducts = JSON.parse(votingData);
        allProducts = allProducts.concat(votingProducts.products || votingProducts || []);
      }

      // Load supplier products
      if (fs.existsSync(supplierProductsPath)) {
        const supplierData = fs.readFileSync(supplierProductsPath, 'utf8');
        const supplierProducts = JSON.parse(supplierData);
        allProducts = allProducts.concat(supplierProducts || []);
      }

      // Find product by slug or generate slug and match
      let product = allProducts.find(p => {
        const productSlug = p.slug || generateSlug(p.name);
        return productSlug === slug;
      });

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

      // Get vote count from votes.json if available
      const votesPath = path.join(process.cwd(), 'public', 'data', 'votes.json');
      if (fs.existsSync(votesPath)) {
        try {
          const votesData = fs.readFileSync(votesPath, 'utf8');
          const votes = JSON.parse(votesData);
          const productVotes = votes.votes?.filter((vote: any) => vote.productId === product.id) || [];
          enhancedProduct.votes = productVotes.length;
        } catch (error) {
          console.log('Could not load votes data:', error);
        }
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

      const productsPath = path.join(process.cwd(), 'public', 'data', 'products.json');
      
      if (!fs.existsSync(productsPath)) {
        return res.status(404).json({ error: 'Products file not found' });
      }

      const productsData = fs.readFileSync(productsPath, 'utf8');
      const products = JSON.parse(productsData);
      const productsList = products.products || products || [];

      // Find the product by slug to get its ID
      const productToDelete = productsList.find((p: Product) => {
        const productSlug = p.slug || generateSlug(p.name);
        return productSlug === slug;
      });

      if (!productToDelete) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Filter out the product
      const filteredProducts = productsList.filter((p: Product) => {
        const productSlug = p.slug || generateSlug(p.name);
        return productSlug !== slug;
      });

      // Save the updated products list
      const updatedData = products.products ? { products: filteredProducts } : filteredProducts;
      fs.writeFileSync(productsPath, JSON.stringify(updatedData, null, 2));

      return res.status(200).json({ success: true, deletedProduct: productToDelete });

    } catch (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
