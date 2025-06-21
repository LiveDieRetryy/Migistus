import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  status: 'coming-soon' | 'live' | 'completed' | 'draft';
  image: string;
  pledgeCount: number;
  totalPledged: number;
  targetAmount?: number;
  endDate?: string;
  features?: string[];
  specifications?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      id,
      name,
      description,
      category,
      price,
      originalPrice,
      discount,
      status,
      image,
      targetAmount,
      endDate,
      features,
      specifications
    } = req.body;

    // Validation
    if (!id || !name || !description) {
      return res.status(400).json({ error: 'Missing required fields: id, name, description' });
    }

    const productsPath = path.join(process.cwd(), 'public', 'data', 'products.json');
    
    let productsData: any = [];
    if (fs.existsSync(productsPath)) {
      const fileContent = fs.readFileSync(productsPath, 'utf8');
      productsData = JSON.parse(fileContent);
    }

    // Handle both array and object with products array formats
    let products: Product[] = [];
    if (Array.isArray(productsData)) {
      products = productsData;
    } else if (productsData.products && Array.isArray(productsData.products)) {
      products = productsData.products;
    }

    // Find the product to update
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update the product
    const updatedProduct: Product = {
      ...products[productIndex],
      name,
      description,
      category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      discount: discount ? Number(discount) : undefined,
      status,
      image,
      targetAmount: targetAmount ? Number(targetAmount) : undefined,
      endDate: endDate || undefined,
      features: features || [],
      specifications: specifications || {},
      updatedAt: new Date().toISOString()
    };

    products[productIndex] = updatedProduct;

    // Save back to file
    const dataToSave = Array.isArray(productsData) ? products : { ...productsData, products };
    fs.writeFileSync(productsPath, JSON.stringify(dataToSave, null, 2));

    res.status(200).json({ 
      success: true, 
      message: 'Product updated successfully',
      product: updatedProduct 
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
