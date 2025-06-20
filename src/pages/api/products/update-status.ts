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
    const { productId, status } = req.body;
    
    if (!productId || !status) {
      return res.status(400).json({ error: 'Missing productId or status' });
    }

    const products = readProductsData();
    const productIndex = products.findIndex((product: any) => 
      String(product.id) === String(productId)
    );
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products[productIndex].status = status;
    products[productIndex].updatedAt = new Date().toISOString();
    
    writeProductsData(products);
    
    res.status(200).json({ success: true, product: products[productIndex] });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ error: 'Failed to update product status' });
  }
}
