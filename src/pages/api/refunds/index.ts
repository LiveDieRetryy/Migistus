// pages/api/refunds/index.ts
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const filePath = path.resolve("public/data/refunds.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const json = fs.readFileSync(filePath, "utf-8");
    let data = JSON.parse(json);

    if (req.method === "GET") {
      res.status(200).json(data);
    } else if (req.method === "PUT" || req.method === "POST") {
      // Example: update refund status
      const { id, status } = req.body;
      if (id && status) {
        data = data.map((r: any) =>
          r.userId === id ? { ...r, status } : r
        );
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: "Missing id or status" });
      }
    } else {
      res.setHeader("Allow", ["GET", "PUT", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to handle refunds.json" });
  }
}
