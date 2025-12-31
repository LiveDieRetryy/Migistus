import { NextApiRequest, NextApiResponse } from 'next';
import { productStorage } from '@/utils/productStorageV2';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Update the product
    const updatedProduct = await productStorage.updateProduct(id, {
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
    });

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
