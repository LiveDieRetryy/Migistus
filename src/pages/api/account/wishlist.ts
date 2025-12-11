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
  
  // Clean the data by trimming whitespace
  const cleanedData = data.trim();
  
  try {
    const parsed = JSON.parse(cleanedData);
    return Array.isArray(parsed) ? parsed : (parsed.wishlist || []);
  } catch (error) {
    console.error('Error parsing wishlist JSON:', error);
    console.log('Raw data:', JSON.stringify(data));
    console.log('Cleaned data:', JSON.stringify(cleanedData));
    // If parsing fails, return empty array and reset the file
    fs.writeFileSync(wishlistPath, JSON.stringify({ wishlist: [] }, null, 2));
    return [];
  }
}

function saveWishlist(wishlist: any[]) {
  fs.writeFileSync(wishlistPath, JSON.stringify({ wishlist }, null, 2));
}

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
    let allWishlistItems = getWishlist();
    console.log('📦 Current wishlist items count:', allWishlistItems.length);

    if (req.method === 'GET') {
      // Return only the authenticated user's wishlist
      const userWishlist = allWishlistItems.filter((item: any) => item.userId === session.userId);
      console.log('✅ GET - Returning', userWishlist.length, 'items for user', session.userId);
      
      return res.status(200).json({
        success: true,
        data: userWishlist,
        total: userWishlist.length
      });
      
    } else if (req.method === 'POST') {
      console.log('📝 POST - Adding item to wishlist');
      console.log('Request body:', req.body);
      
      // Add item to wishlist
      const newItem = {
        id: Date.now(),
        ...req.body,
        userId: session.userId, // Force userId to authenticated user
        username: session.username,
        addedAt: new Date().toISOString()
      };
      
      console.log('New item:', newItem);
      
      allWishlistItems.push(newItem);
      saveWishlist(allWishlistItems);
      
      console.log('✅ Item added successfully');
      
      return res.status(201).json({
        success: true,
        data: newItem,
        message: 'Added to wishlist'
      });
      
    } else if (req.method === 'DELETE') {
      const { itemId } = req.query;
      const itemIdNum = parseInt(itemId as string);
      
      console.log('🗑️ DELETE - Removing item', itemIdNum);
      
      // Find the item and verify it belongs to the authenticated user
      const itemIndex = allWishlistItems.findIndex((item: any) => item.id === itemIdNum);
      if (itemIndex === -1) {
        console.log('❌ Item not found');
        return res.status(404).json({ 
          success: false,
          error: 'Wishlist item not found' 
        });
      }
      
      if (allWishlistItems[itemIndex].userId !== session.userId) {
        console.log('❌ Permission denied');
        return res.status(403).json({ 
          success: false,
          error: 'You can only remove your own wishlist items',
          code: 'FORBIDDEN'
        });
      }
      
      allWishlistItems = allWishlistItems.filter((item: any) => item.id !== itemIdNum);
      saveWishlist(allWishlistItems);
      
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
