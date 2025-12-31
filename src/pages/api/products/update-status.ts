import type { NextApiRequest, NextApiResponse } from 'next';
import { productStorage } from '@/utils/productStorageV2';

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

    const updatedProduct = await productStorage.updateProduct(parseInt(productId), {
      status,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ error: 'Failed to update product status' });
  }
}
