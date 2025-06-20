import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const STAFF_PICKS_PATH = path.resolve('public/data/staff-picks.json');

function readStaffPicksData() {
  try {
    if (!fs.existsSync(STAFF_PICKS_PATH)) {
      fs.writeFileSync(STAFF_PICKS_PATH, '[]');
      return [];
    }
    
    const fileContent = fs.readFileSync(STAFF_PICKS_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading staff picks file:', error);
    return [];
  }
}

function writeStaffPicksData(staffPicks: any[]) {
  try {
    const dir = path.dirname(STAFF_PICKS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STAFF_PICKS_PATH, JSON.stringify(staffPicks, null, 2));
  } catch (error) {
    console.error('Error writing staff picks file:', error);
    throw new Error('Failed to save staff picks data');
  }
}

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

    const staffPicks = readStaffPicksData();
    
    if (action === 'add') {
      // Check if already exists
      const exists = staffPicks.some((pick: any) => String(pick.productId) === String(productId));
      if (exists) {
        return res.status(400).json({ error: 'Product is already a staff pick' });
      }
      
      // Add new staff pick
      const newStaffPick = {
        id: `staff_pick_${Date.now()}`,
        productId: Number(productId),
        pickDate: new Date().toISOString(),
        dropStartDate: new Date().toISOString(),
        dropEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        priority: staffPicks.length + 1,
        createdBy: 'admin',
        isActive: true,
        staffNote: 'Added via admin panel'
      };
      
      staffPicks.push(newStaffPick);
    } else if (action === 'remove') {
      // Remove staff pick
      const filteredPicks = staffPicks.filter((pick: any) => 
        String(pick.productId) !== String(productId)
      );
      
      if (filteredPicks.length === staffPicks.length) {
        return res.status(404).json({ error: 'Staff pick not found' });
      }
      
      writeStaffPicksData(filteredPicks);
      return res.status(200).json({ success: true, message: 'Staff pick removed successfully' });
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "add" or "remove"' });
    }
    
    writeStaffPicksData(staffPicks);
    
    res.status(200).json({ success: true, message: `Staff pick ${action}ed successfully` });
  } catch (error) {
    console.error('Error toggling staff pick:', error);
    res.status(500).json({ error: 'Failed to toggle staff pick' });
  }
}
