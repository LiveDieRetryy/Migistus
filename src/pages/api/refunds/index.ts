// pages/api/refunds/index.ts
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { db, isProduction } from "@/lib/db";

const filePath = path.resolve("public/data/refunds.json");

function ensureFile() {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const useProduction = isProduction();

  try {
    if (req.method === "GET") {
      if (useProduction) {
        // Use database in production
        const refunds = await db.getAllRefunds();
        return res.status(200).json(refunds);
      } else {
        // Use file system in development
        ensureFile();
        const json = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(json);
        return res.status(200).json(data);
      }
    } else if (req.method === "POST") {
      // Create new refund request
      const { orderId, userId, amount, reason, description } = req.body;
      
      if (!userId || !amount || !reason) {
        return res.status(400).json({ error: "Missing required fields: userId, amount, reason" });
      }

      if (useProduction) {
        // Use database in production
        const refund = await db.createRefund({
          orderId,
          userId,
          amount,
          reason,
          description
        });
        return res.status(201).json({ success: true, refund });
      } else {
        // Use file system in development
        ensureFile();
        const json = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(json);
        
        const newRefund = {
          id: data.length > 0 ? Math.max(...data.map((r: any) => r.id || 0)) + 1 : 1,
          orderId,
          userId,
          amount,
          reason,
          description,
          status: 'pending',
          requestedAt: new Date().toISOString()
        };
        
        data.push(newRefund);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return res.status(201).json({ success: true, refund: newRefund });
      }
    } else if (req.method === "PUT") {
      // Bulk update (for backward compatibility)
      const { id, status } = req.body;
      
      if (!id || !status) {
        return res.status(400).json({ error: "Missing id or status" });
      }

      if (useProduction) {
        // Use database in production
        const refund = await db.updateRefund(id, { status });
        return res.status(200).json({ success: true, refund });
      } else {
        // Use file system in development
        ensureFile();
        const json = fs.readFileSync(filePath, "utf-8");
        let data = JSON.parse(json);
        
        data = data.map((r: any) =>
          r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
        );
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return res.status(200).json({ success: true });
      }
    } else {
      res.setHeader("Allow", ["GET", "POST", "PUT"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error('Error in refunds API:', err);
    res.status(500).json({ error: "Failed to handle refunds" });
  }
}
