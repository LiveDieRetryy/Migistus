import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

// stats.json for dashboard count
const STATS_PATH = path.resolve(process.cwd(), "src/data/products.json");

// full list of products
const LIVE_PRODUCTS_PATH = path.resolve(process.cwd(), "src/data/live-products.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const data = fs.readFileSync(LIVE_PRODUCTS_PATH, "utf-8");
      res.status(200).json(JSON.parse(data));
    } catch (err) {
      console.error("GET product list error:", err);
      res.status(500).json({ error: "Failed to load product list" });
    }
  }

  else if (req.method === "POST") {
    try {
      const newProduct = req.body;

      const current = JSON.parse(fs.readFileSync(LIVE_PRODUCTS_PATH, "utf-8"));
      current.push(newProduct);
      fs.writeFileSync(LIVE_PRODUCTS_PATH, JSON.stringify(current, null, 2));

      const stats = JSON.parse(fs.readFileSync(STATS_PATH, "utf-8"));
      stats.totalProducts = (stats.totalProducts ?? 0) + 1;
      fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));

      res.status(200).json({ success: true, product: newProduct });
    } catch (err) {
      console.error("POST product creation error:", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  }

  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
