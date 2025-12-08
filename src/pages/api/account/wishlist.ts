import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/session';

const wishlistPath = path.join(process.cwd(), 'public', 'data', 'wishlist.json');

function ensureWishlistFile() {
  if (!fs.existsSync(wishlistPath)) {
    fs.writeFileSync(wishlistPath, JSON.stringify({ wishlist: [] }, null, 2));
  }
}

function getWishlist() {
  ensureWishlistFile();
  const data = fs.readFileSync(wishlistPath, 'utf-8');
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : (parsed.wishlist || []);
}

function saveWishlist(wishlist: any[]) {
  fs.writeFileSync(wishlistPath, JSON.stringify({ wishlist }, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication
  const session = requireAuth(req, res);
  if (!session) {
    return; // requireAuth already sent the 401 response
  }

  try {
    let allWishlistItems = getWishlist();

    if (req.method === 'GET') {
      // Return only the authenticated user's wishlist
      const userWishlist = allWishlistItems.filter((item: any) => item.userId === session.userId);
      
      return res.status(200).json({
        success: true,
        data: userWishlist,
        total: userWishlist.length
      });
      
    } else if (req.method === 'POST') {
      // Add item to wishlist
      const newItem = {
        id: Date.now(),
        ...req.body,
        userId: session.userId, // Force userId to authenticated user
        username: session.username,
        addedAt: new Date().toISOString()
      };
      
      allWishlistItems.push(newItem);
      saveWishlist(allWishlistItems);
      
      return res.status(201).json({
        success: true,
        data: newItem,
        message: 'Added to wishlist'
      });
      
    } else if (req.method === 'DELETE') {
      const { itemId } = req.query;
      const itemIdNum = parseInt(itemId as string);
      
      // Find the item and verify it belongs to the authenticated user
      const itemIndex = allWishlistItems.findIndex((item: any) => item.id === itemIdNum);
      if (itemIndex === -1) {
        return res.status(404).json({ 
          success: false,
          error: 'Wishlist item not found' 
        });
      }
      
      if (allWishlistItems[itemIndex].userId !== session.userId) {
        return res.status(403).json({ 
          success: false,
          error: 'You can only remove your own wishlist items',
          code: 'FORBIDDEN'
        });
      }
      
      allWishlistItems = allWishlistItems.filter((item: any) => item.id !== itemIdNum);
      saveWishlist(allWishlistItems);
      
      return res.status(200).json({ 
        success: true,
        message: 'Removed from wishlist'
      });
      
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Wishlist API error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}
