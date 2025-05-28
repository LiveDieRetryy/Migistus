// pages/api/products/[id].ts
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const DATA_PATH = path.resolve(process.cwd(), "public/data/products.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === "DELETE") {
    try {
      const products = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
      const filtered = products.filter((p: any) => String(p.id) !== String(id));
      fs.writeFileSync(DATA_PATH, JSON.stringify(filtered, null, 2));
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
