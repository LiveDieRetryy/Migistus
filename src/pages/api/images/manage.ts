import { NextApiRequest, NextApiResponse } from 'next';
import ImageRegistry from '@/utils/imageRegistry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const imageRegistry = ImageRegistry.getInstance();

  switch (req.method) {
    case 'GET':
      // Get image statistics and list unused images
      try {
        const stats = imageRegistry.getImageStats();
        const unusedImages = imageRegistry.getUnusedImages();
        
        res.status(200).json({
          success: true,
          stats,
          unusedImages: unusedImages.map(img => ({
            id: img.id,
            filename: img.filename,
            url: img.url,
            size: img.size,
            uploadedAt: img.uploadedAt,
            usedBy: img.usedBy
          }))
        });
      } catch (error) {
        console.error('Error getting image stats:', error);
        res.status(500).json({ error: 'Failed to get image statistics' });
      }
      break;

    case 'POST':
      // Link image to product or context
      try {
        const { imageUrl, productId, action } = req.body;
        
        if (!imageUrl || !productId) {
          return res.status(400).json({ error: 'imageUrl and productId are required' });
        }

        if (action === 'link') {
          imageRegistry.linkImageToProduct(imageUrl, productId);
          res.status(200).json({ success: true, message: 'Image linked to product' });
        } else if (action === 'unlink') {
          imageRegistry.unlinkImageFromProduct(imageUrl, productId);
          res.status(200).json({ success: true, message: 'Image unlinked from product' });
        } else {
          res.status(400).json({ error: 'Invalid action. Use "link" or "unlink"' });
        }
      } catch (error) {
        console.error('Error managing image link:', error);
        res.status(500).json({ error: 'Failed to manage image link' });
      }
      break;

    case 'DELETE':
      // Clean up unused images
      try {
        const cleanedCount = imageRegistry.cleanupUnusedImages();
        res.status(200).json({ 
          success: true, 
          message: `Cleaned up ${cleanedCount} unused images`,
          cleanedCount 
        });
      } catch (error) {
        console.error('Error cleaning up images:', error);
        res.status(500).json({ error: 'Failed to clean up images' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
