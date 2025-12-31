import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/session';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication - this validates the session
  const session = await requireAuth(req, res);
  if (!session) {
    return; // requireAuth already sent the 401 response
  }

  try {
    if (req.method === 'GET') {
      // Get user's pledges from database
      const userPledges = await db.getUserPledges(session.userId);
      return res.status(200).json({
        success: true,
        data: userPledges,
        total: userPledges.length
      });
    } else if (req.method === 'POST') {
      const { productId, tierId, quantity, amount } = req.body;
      
      if (!productId || (!tierId && !amount)) {
        return res.status(400).json({
          success: false,
          error: 'Product ID and either tier ID or amount are required'
        });
      }
      
      // Create pledge in database
      const newPledge = await db.createPledge({
        productId: parseInt(productId),
        userId: session.userId,
        tierId: tierId ? parseInt(tierId) : 1, // Default tier if not specified
        quantity: quantity ? parseInt(quantity) : 1 // Default quantity
      });
      
      return res.status(201).json({
        success: true,
        data: newPledge,
        message: 'Pledge created successfully'
      });
    } else if (req.method === 'DELETE') {
      const { productId } = req.query;
      
      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
      }
      
      const productIdNum = parseInt(productId as string);
      
      // Delete pledge from database
      await db.deletePledge(productIdNum, session.userId);
      
      return res.status(200).json({  
        success: true,
        message: 'Pledge deleted successfully'
      });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Pledges API error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}
