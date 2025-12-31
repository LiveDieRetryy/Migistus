import type { NextApiRequest, NextApiResponse } from "next";
import { productStorage } from '@/utils/productStorageV2';

export type Pledge = {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query;
  if (!productId || typeof productId !== "string") {
    return res.status(400).json({ error: "Missing productId" });
  }

  const productIdNum = parseInt(productId);
  if (isNaN(productIdNum)) {
    return res.status(400).json({ error: "Invalid productId" });
  }

  if (req.method === "GET") {
    try {
      const pledges = await productStorage.getProductPledges(productIdNum);
      const pledgeCount = await productStorage.getProductPledgeCount(productIdNum);
      
      return res.status(200).json({
        pledges: pledges.map((p: any) => ({
          id: p.id,
          user: p.user_id,
          time: p.timestamp || p.created_at,
          productId: p.product_id,
          quantity: p.quantity || 1
        })),
        count: pledges.length,
        total: pledgeCount
      });
    } catch (err) {
      console.error('Failed to load pledges:', err);
      return res.status(500).json({ error: "Failed to load pledges" });
    }
  } else if (req.method === "POST") {
    try {
      const { user, userId, quantity } = req.body;
      
      if (!userId && !user) {
        return res.status(400).json({ error: "userId is required" });
      }

      const pledge = await productStorage.createPledge({
        productId: productIdNum,
        userId: userId || parseInt(user),
        quantity: quantity || 1
      });
      
      return res.status(201).json({ 
        success: true, 
        pledge: {
          id: pledge.id,
          user: pledge.user_id,
          time: (pledge as any).timestamp || (pledge as any).created_at,
          productId: pledge.product_id,
          quantity: pledge.quantity
        }
      });
    } catch (err) {
      console.error('Failed to save pledge:', err);
      return res.status(500).json({ error: "Failed to save pledge" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
