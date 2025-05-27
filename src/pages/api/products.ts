import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const DATA_PATH = path.resolve(process.cwd(), "src/data/live-products.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const data = fs.readFileSync(DATA_PATH, "utf-8");
      res.status(200).json(JSON.parse(data));
    } catch (err) {
      res.status(500).json({ error: "Failed to load products" });
    }
  } else if (req.method === "POST") {
    try {
      const newProduct = req.body;
      const products = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
      // If editing, replace; else, add
      const idx = products.findIndex((p: any) => p.id === newProduct.id);
      if (idx !== -1) {
        products[idx] = newProduct;
      } else {
        products.push(newProduct);
      }
      fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2));
      res.status(200).json({ success: true, product: newProduct });
    } catch (err) {
      res.status(500).json({ error: "Failed to save product" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
