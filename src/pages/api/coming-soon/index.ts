import type { NextApiRequest, NextApiResponse } from 'next';
import { productStorage } from '@/utils/productStorageV2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get all coming-soon products
      const items = await productStorage.getProducts({ stage: 'coming-soon' });
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      const stats = {
        totalItems: items.length,
        subscribedUsers: items.reduce((sum: number, item: any) => sum + (item.subscribers || 0), 0),
        announcedToday: items.filter((item: any) => 
          item.status === 'announced' && 
          new Date(item.announcedAt || item.createdAt) >= todayStart
        ).length,
        upcomingThisWeek: items.filter((item: any) => 
          item.releaseDate &&
          new Date(item.releaseDate) <= weekEnd &&
          new Date(item.releaseDate) >= now
        ).length
      };
      
      return res.status(200).json({ items, stats });
    }

    if (req.method === 'POST') {
      const { title, description, category, releaseDate, imageUrl } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const newItem = await productStorage.createProduct({
        name: title,
        slug,
        description,
        category: category || 'general',
        stage: 'coming-soon',
        image: imageUrl
      });

      return res.status(201).json(newItem);
    }

    if (req.method === 'PUT') {
      const { id, status, title, description } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Missing item ID' });
      }

      const updatedItem = await productStorage.updateProduct(parseInt(id), {
        ...(status && { status }),
        ...(title && { name: title }),
        ...(description && { description })
      });

      return res.status(200).json(updatedItem);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Missing item ID' });
      }

      await productStorage.deleteProduct(parseInt(id as string));

      return res.status(200).json({ message: 'Coming soon item deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Coming soon API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
