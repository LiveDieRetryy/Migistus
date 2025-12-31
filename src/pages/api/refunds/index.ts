// pages/api/refunds/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const refunds = await db.getAllRefunds();
      return res.status(200).json(refunds);
    } else if (req.method === "POST") {
      // Create new refund request
      const { orderId, userId, amount, reason, description } = req.body;
      
      if (!userId || !amount || !reason) {
        return res.status(400).json({ error: "Missing required fields: userId, amount, reason" });
      }

      const refund = await db.createRefund({
        orderId,
        userId,
        amount,
        reason,
        description
      });
      return res.status(201).json({ success: true, refund });
    } else if (req.method === "PUT") {
      // Update refund status
      const { id, status } = req.body;
      
      if (!id || !status) {
        return res.status(400).json({ error: "Missing id or status" });
      }

      const refund = await db.updateRefund(id, { status });
      return res.status(200).json({ success: true, refund });
    } else {
      res.setHeader("Allow", ["GET", "POST", "PUT"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error('Error handling refund request:', err);
    res.status(500).json({ error: "Failed to process refund request" });
  }
}

