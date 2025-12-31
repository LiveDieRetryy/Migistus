import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/session';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 Wishlist API called:', req.method);
  
  // Require authentication
  const session = await requireAuth(req, res);
  if (!session) {
    console.log('❌ No session found');
    return; // requireAuth already sent the 401 response
  }
  
  console.log('✅ Session found:', { userId: session.userId, username: session.username });

  try {
    if (req.method === 'GET') {
      // Get user's wishlist from database
      const userWishlist = await db.getWishlist(session.userId);
      console.log('✅ GET - Returning', userWishlist.length, 'items for user', session.userId);
      
      return res.status(200).json({
        success: true,
        data: userWishlist,
        total: userWishlist.length
      });
      
    } else if (req.method === 'POST') {
      console.log('📝 POST - Adding item to wishlist');
      console.log('Request body:', req.body);
      
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
      }
      
      // Add item to wishlist in database
      const newItem = await db.addToWishlist(session.userId, productId);
      
      console.log('✅ Item added successfully');
      
      return res.status(201).json({
        success: true,
        data: newItem,
        message: 'Added to wishlist'
      });
      
    } else if (req.method === 'DELETE') {
      const { itemId } = req.query;
      const productId = parseInt(itemId as string);
      
      console.log('🗑️ DELETE - Removing item', productId);
      
      // Remove item from wishlist
      await db.removeFromWishlist(session.userId, productId);
      
      console.log('✅ Item removed successfully');
      
      return res.status(200).json({ 
        success: true,
        message: 'Removed from wishlist'
      });
      
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('💥 Wishlist API error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

