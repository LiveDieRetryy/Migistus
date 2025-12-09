import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const PRODUCTS_PATH = path.resolve('public/data/products.json');

function readProductsData() {
  try {
    if (!fs.existsSync(PRODUCTS_PATH)) {
      fs.writeFileSync(PRODUCTS_PATH, '[]');
      return [];
    }
    
    const fileContent = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading products file:', error);
    return [];
  }
}

function writeProductsData(products: any[]) {
  try {
    const dir = path.dirname(PRODUCTS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error writing products file:', error);
    throw new Error('Failed to save products data');
  }
}

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

    const products = readProductsData();
    
    // Create slug from name
    const slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure unique ID
    const maxId = products.length > 0 ? Math.max(...products.map((p: any) => p.id || 0)) : 0;
    const newProduct = {
      ...productData,
      id: maxId + 1,
      slug,
      votes: 0,
      pledges: productData.pledgeCount || 0,
      goal: productData.targetAmount || 100,
      timeframe: '30 days',
      link: `https://migistus.com/products/${slug}`,
      pricingTiers: [],
      featured: false
    };

    products.push(newProduct);
    writeProductsData(products);
    
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
