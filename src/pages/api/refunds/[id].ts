import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const REFUNDS_PATH = path.resolve("public/data/refunds.json");

function ensureFile() {
  if (!fs.existsSync(REFUNDS_PATH)) fs.writeFileSync(REFUNDS_PATH, "[]");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  ensureFile();
  
  const { id } = req.query;

  if (req.method === "GET") {
    // Get a single refund by ID
    try {
      const refunds = JSON.parse(fs.readFileSync(REFUNDS_PATH, "utf-8"));
      const refund = refunds.find((r: any) => r.id === id || r.id === Number(id));
      
      if (refund) {
        res.status(200).json(refund);
      } else {
        res.status(404).json({ error: "Refund not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to read refund" });
    }
  } else if (req.method === "PATCH") {
    // Update a refund (status, notes, etc.)
    try {
      const refunds = JSON.parse(fs.readFileSync(REFUNDS_PATH, "utf-8"));
      const refundIndex = refunds.findIndex((r: any) => r.id === id || r.id === Number(id));
      
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
      res.status(200).json({ success: true, refund: refunds[refundIndex] });
    } catch (err) {
      res.status(500).json({ error: "Failed to update refund" });
    }
  } else if (req.method === "DELETE") {
    // Delete a refund
    try {
      const refunds = JSON.parse(fs.readFileSync(REFUNDS_PATH, "utf-8"));
      const filteredRefunds = refunds.filter((r: any) => r.id !== id && r.id !== Number(id));
      
      if (filteredRefunds.length === refunds.length) {
        return res.status(404).json({ error: "Refund not found" });
      }

      fs.writeFileSync(REFUNDS_PATH, JSON.stringify(filteredRefunds, null, 2));
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete refund" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
