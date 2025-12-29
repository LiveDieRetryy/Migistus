import { NextApiRequest, NextApiResponse } from 'next';
import { productStorage } from '@/utils/productStorageV2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  const productId = parseInt(id);

  try {
    if (req.method === 'GET') {
      const product = await productStorage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.status(200).json(product);
    }

    if (req.method === 'PUT') {
      const updatedProduct = await productStorage.updateProduct(productId, req.body);
      
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.status(200).json(updatedProduct);
    }

    if (req.method === 'DELETE') {
      await productStorage.deleteProduct(productId);
      return res.status(200).json({ message: 'Product deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Product API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
