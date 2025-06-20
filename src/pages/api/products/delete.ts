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
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Missing productId' });
    }

    const products = readProductsData();
    const originalLength = products.length;
    
    const filteredProducts = products.filter((product: any) => 
      String(product.id) !== String(productId)
    );
    
    if (filteredProducts.length === originalLength) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    writeProductsData(filteredProducts);
    
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}
