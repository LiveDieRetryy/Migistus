import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const refundId = Number(id);

  if (isNaN(refundId)) {
    return res.status(400).json({ error: "Invalid refund ID" });
  }

  if (req.method === "GET") {
    try {
      const refund = await db.getRefundById(refundId);
      if (refund) {
        return res.status(200).json(refund);
      } else {
        return res.status(404).json({ error: "Refund not found" });
      }
    } catch (err) {
      console.error('Error reading refund:', err);
      res.status(500).json({ error: "Failed to read refund" });
    }
  } else if (req.method === "PATCH") {
    try {
      const refund = await db.updateRefund(refundId, req.body);
      
      if (refund) {
        return res.status(200).json({ success: true, refund });
      } else {
        return res.status(404).json({ error: "Refund not found" });
      }
    } catch (err) {
      console.error('Error updating refund:', err);
      res.status(500).json({ error: "Failed to update refund" });
    }
  } else if (req.method === "DELETE") {
    try {
      await db.deleteRefund(refundId);
      return res.status(200).json({ success: true, message: "Refund deleted successfully" });
    } catch (err) {
      console.error('Error deleting refund:', err);
      res.status(500).json({ error: "Failed to delete refund" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

