import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const staffPicksPath = path.join(process.cwd(), 'public', 'data', 'staff-picks.json');
const productsPath = path.join(process.cwd(), 'public', 'data', 'products.json');

interface StaffPick {
  id: number;
  productId: number;
  pickDate: string;
  dropStartDate: string;
  dropEndDate: string;
  limitedQuantity?: number;
  staffNote?: string;
  priority: number;
  isActive: boolean;
  createdBy: string;
  revenue?: number; // Track revenue from this staff pick
  supplierPaid?: boolean; // Track if supplier paid for featured placement
  supplierFee?: number; // Fee paid by supplier
}

const ensureFile = (filePath: string, defaultContent: string) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContent);
  }
};

const getStaffPicks = (): StaffPick[] => {
  ensureFile(staffPicksPath, '[]');
  const data = fs.readFileSync(staffPicksPath, 'utf8');
  return JSON.parse(data);
};

const saveStaffPicks = (picks: StaffPick[]) => {
  fs.writeFileSync(staffPicksPath, JSON.stringify(picks, null, 2));
};

const getProducts = () => {
  const data = fs.readFileSync(productsPath, 'utf8');
  return JSON.parse(data).products || [];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET - Retrieve staff picks
  if (req.method === 'GET') {
    try {
      const staffPicks = getStaffPicks();
      
      // Optionally filter by active status
      const { active } = req.query;
      if (active === 'true') {
        const activePicks = staffPicks.filter(pick => pick.isActive);
        return res.status(200).json(activePicks);
      }
      
      return res.status(200).json(staffPicks);
    } catch (error) {
      console.error('Error fetching staff picks:', error);
      return res.status(500).json({ error: 'Failed to fetch staff picks' });
    }
  }

  // POST - Create new staff pick
  if (req.method === 'POST') {
    try {
      const { 
        productId, 
        dropStartDate, 
        dropEndDate, 
        limitedQuantity, 
        staffNote, 
        priority, 
        createdBy,
        supplierPaid,
        supplierFee
      } = req.body;

      if (!productId || !dropStartDate || !dropEndDate || !createdBy) {
        return res.status(400).json({ 
          error: 'productId, dropStartDate, dropEndDate, and createdBy are required' 
        });
      }

      // Validate product exists
      const products = getProducts();
      const product = products.find((p: any) => p.id === productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const staffPicks = getStaffPicks();
      
      // Deactivate any existing staff pick for this product
      staffPicks.forEach(pick => {
        if (pick.productId === productId && pick.isActive) {
          pick.isActive = false;
        }
      });

      // Create new staff pick
      const newStaffPick: StaffPick = {
        id: staffPicks.length > 0 ? Math.max(...staffPicks.map(p => p.id)) + 1 : 1,
        productId,
        pickDate: new Date().toISOString(),
        dropStartDate,
        dropEndDate,
        limitedQuantity: limitedQuantity ? parseInt(limitedQuantity) : undefined,
        staffNote: staffNote || '',
        priority: priority || 1,
        isActive: true,
        createdBy,
        revenue: 0,
        supplierPaid: supplierPaid || false,
        supplierFee: supplierFee || 0
      };

      staffPicks.push(newStaffPick);
      saveStaffPicks(staffPicks);

      return res.status(201).json({ 
        success: true, 
        staffPick: newStaffPick 
      });
    } catch (error) {
      console.error('Error creating staff pick:', error);
      return res.status(500).json({ error: 'Failed to create staff pick' });
    }
  }

  // PATCH - Update staff pick (for revenue tracking, status changes, etc.)
  if (req.method === 'PATCH') {
    try {
      const { id, revenue, supplierPaid, supplierFee, isActive } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Staff pick id is required' });
      }

      const staffPicks = getStaffPicks();
      const pickIndex = staffPicks.findIndex(p => p.id === id);

      if (pickIndex === -1) {
        return res.status(404).json({ error: 'Staff pick not found' });
      }

      // Update fields
      if (revenue !== undefined) staffPicks[pickIndex].revenue = revenue;
      if (supplierPaid !== undefined) staffPicks[pickIndex].supplierPaid = supplierPaid;
      if (supplierFee !== undefined) staffPicks[pickIndex].supplierFee = supplierFee;
      if (isActive !== undefined) staffPicks[pickIndex].isActive = isActive;

      saveStaffPicks(staffPicks);

      return res.status(200).json({ 
        success: true, 
        staffPick: staffPicks[pickIndex] 
      });
    } catch (error) {
      console.error('Error updating staff pick:', error);
      return res.status(500).json({ error: 'Failed to update staff pick' });
    }
  }

  // DELETE - Remove/deactivate staff pick
  if (req.method === 'DELETE') {
    try {
      const { productId } = req.query;

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const staffPicks = getStaffPicks();
      const pickIndex = staffPicks.findIndex(
        p => p.productId === parseInt(productId as string) && p.isActive
      );

      if (pickIndex === -1) {
        return res.status(404).json({ error: 'Active staff pick not found for this product' });
      }

      // Deactivate instead of deleting (for historical tracking)
      staffPicks[pickIndex].isActive = false;
      saveStaffPicks(staffPicks);

      return res.status(200).json({ 
        success: true, 
        message: 'Staff pick deactivated successfully' 
      });
    } catch (error) {
      console.error('Error deleting staff pick:', error);
      return res.status(500).json({ error: 'Failed to delete staff pick' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
