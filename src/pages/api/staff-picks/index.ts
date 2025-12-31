import { NextApiRequest, NextApiResponse } from "next";
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const staffPicks = await db.getAllStaffPicks();
      res.status(200).json(staffPicks);
    } catch (error) {
      console.error("Error reading staff picks:", error);
      res.status(500).json({ error: "Failed to load staff picks" });
    }
  }

  else if (req.method === "POST") {
    try {
      const { productId, dropEndDate, staffNote } = req.body;

      if (!productId || !dropEndDate) {
        return res.status(400).json({ error: "Missing required fields: productId and dropEndDate" });
      }

      const newStaffPick = await db.createStaffPick({
        productId: parseInt(productId),
        featuredUntil: dropEndDate,
        reason: staffNote || 'Added via admin panel'
      });

      res.status(201).json(newStaffPick);
    } catch (error) {
      console.error("Error creating staff pick:", error);
      res.status(500).json({ error: "Failed to create staff pick" });
    }
  }

  else if (req.method === "DELETE") {
    try {
      const { productId } = req.query;

      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }

      const numProductId = parseInt(productId as string);
      
      // Mark as not featured by setting featured_until to past
      await db.updateStaffPick(numProductId, {
        featuredUntil: new Date(0).toISOString()
      });

      res.status(200).json({ message: "Staff pick removed successfully" });
    } catch (error) {
      console.error("Error removing staff pick:", error);
      res.status(500).json({ error: "Failed to remove staff pick" });
    }
  }

  else if (req.method === "PUT") {
    try {
      const { productId, featuredUntil, reason } = req.body;

      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }

      const numProductId = parseInt(productId);
      
      await db.updateStaffPick(numProductId, {
        featuredUntil,
        reason
      });

      const updated = await db.getStaffPick(numProductId);
      res.status(200).json(updated);
    } catch (error) {
      console.error("Error updating staff pick:", error);
      res.status(500).json({ error: "Failed to update staff pick" });
    }
  }

  else {
    res.setHeader("Allow", ["GET", "POST", "DELETE", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
