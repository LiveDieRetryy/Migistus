import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { db, isProduction } from "@/lib/db";

const REFUNDS_PATH = path.resolve("public/data/refunds.json");

function ensureFile() {
  if (!fs.existsSync(REFUNDS_PATH)) fs.writeFileSync(REFUNDS_PATH, "[]");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const useProduction = isProduction();
  const { id } = req.query;
  const refundId = Number(id);

  if (isNaN(refundId)) {
    return res.status(400).json({ error: "Invalid refund ID" });
  }

  if (req.method === "GET") {
    try {
      if (useProduction) {
        // Use database in production
        const refund = await db.getRefundById(refundId);
        if (refund) {
          return res.status(200).json(refund);
        } else {
          return res.status(404).json({ error: "Refund not found" });
        }
      } else {
        // Use file system in development
        ensureFile();
        const refunds = JSON.parse(fs.readFileSync(REFUNDS_PATH, "utf-8"));
        const refund = refunds.find((r: any) => r.id === refundId);
        
        if (refund) {
          return res.status(200).json(refund);
        } else {
          return res.status(404).json({ error: "Refund not found" });
        }
      }
    } catch (err) {
      console.error('Error reading refund:', err);
      res.status(500).json({ error: "Failed to read refund" });
    }
  } else if (req.method === "PATCH") {
    try {
      if (useProduction) {
        // Use database in production
        const refund = await db.updateRefund(refundId, req.body);
        
        if (refund) {
          return res.status(200).json({ success: true, refund });
        } else {
          return res.status(404).json({ error: "Refund not found" });
        }
      } else {
        // Use file system in development
        ensureFile();
        const refunds = JSON.parse(fs.readFileSync(REFUNDS_PATH, "utf-8"));
        const refundIndex = refunds.findIndex((r: any) => r.id === refundId);
        
        if (refundIndex === -1) {
          return res.status(404).json({ error: "Refund not found" });
        }

        // Update the refund with new data
        refunds[refundIndex] = {
          ...refunds[refundIndex],
          ...req.body,
          updatedAt: new Date().toISOString(),
        };

        fs.writeFileSync(REFUNDS_PATH, JSON.stringify(refunds, null, 2));
        return res.status(200).json({ success: true, refund: refunds[refundIndex] });
      }
    } catch (err) {
      console.error('Error updating refund:', err);
      res.status(500).json({ error: "Failed to update refund" });
    }
  } else if (req.method === "DELETE") {
    try {
      if (useProduction) {
        // Use database in production
        await db.deleteRefund(refundId);
        return res.status(200).json({ success: true });
      } else {
        // Use file system in development
        ensureFile();
        const refunds = JSON.parse(fs.readFileSync(REFUNDS_PATH, "utf-8"));
        const filteredRefunds = refunds.filter((r: any) => r.id !== refundId);
        
        if (filteredRefunds.length === refunds.length) {
          return res.status(404).json({ error: "Refund not found" });
        }

        fs.writeFileSync(REFUNDS_PATH, JSON.stringify(filteredRefunds, null, 2));
        return res.status(200).json({ success: true });
      }
    } catch (err) {
      console.error('Error deleting refund:', err);
      res.status(500).json({ error: "Failed to delete refund" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
