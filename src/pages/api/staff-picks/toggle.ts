import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { productId, action } = req.body;
    
    if (!productId || !action) {
      return res.status(400).json({ error: 'Missing productId or action' });
    }

    const numProductId = Number(productId);
    
    if (action === 'add') {
      // Check if already exists
      const existing = await db.getStaffPick(numProductId);
      if (existing) {
        return res.status(400).json({ error: 'Product is already a staff pick' });
      }
      
      // Add new staff pick
      const dropEndDate = new Date();
      dropEndDate.setDate(dropEndDate.getDate() + 30); // 30 days from now
      
      const newStaffPick = await db.createStaffPick({
        productId: numProductId,
        featuredUntil: dropEndDate.toISOString(),
        reason: 'Added via admin panel'
      });
      
      return res.status(200).json({ success: true, message: 'Staff pick added successfully', data: newStaffPick });
    } else if (action === 'remove') {
      // Remove staff pick by setting featured_until to past date
      const existing = await db.getStaffPick(numProductId);
      if (!existing) {
        return res.status(404).json({ error: 'Staff pick not found' });
      }
      
      await db.updateStaffPick(numProductId, {
        featuredUntil: new Date(0).toISOString() // Set to epoch (effectively removes it)
      });
      
      return res.status(200).json({ success: true, message: 'Staff pick removed successfully' });
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "add" or "remove"' });
    }
  } catch (error) {
    console.error('Error toggling staff pick:', error);
    res.status(500).json({ error: 'Failed to toggle staff pick' });
  }
}
