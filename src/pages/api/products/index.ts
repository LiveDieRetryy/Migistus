// pages/api/products/index.ts
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const filePath = path.resolve("public/data/products.json");

function readData() {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]");
  const json = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(json);
}

function writeData(data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = readData();

    if (req.method === "GET") {
      res.status(200).json({ products: data, totalProducts: data.length });

    } else if (req.method === "POST") {
      const newProduct = req.body;
      newProduct.pledges = typeof newProduct.pledges === "number" ? newProduct.pledges : 0;
      newProduct.pricingTiers = Array.isArray(newProduct.pricingTiers) ? newProduct.pricingTiers : [];
      // If editing, replace; else, add
      const idx = data.findIndex((p: any) => p.id === newProduct.id);
      let updated;
      if (idx !== -1) {
        updated = data.map((p: any) => p.id === newProduct.id ? newProduct : p);
      } else {
        updated = [...data, newProduct];
      }
      writeData(updated);
      res.status(201).json({ success: true, product: newProduct });

    } else if (req.method === "PUT") {
      const updatedProduct = req.body;
      updatedProduct.pledges = typeof updatedProduct.pledges === "number" ? updatedProduct.pledges : 0;
      updatedProduct.pricingTiers = Array.isArray(updatedProduct.pricingTiers) ? updatedProduct.pricingTiers : [];
      const updated = data.map((p: any) =>
        p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
      );
      writeData(updated);
      res.status(200).json({ success: true });

    } else if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Missing ID to delete" });

      const filtered = data.filter((p: any) => p.id.toString() !== id.toString());
      writeData(filtered);
      res.status(200).json({ success: true });

    } else {
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Failed to handle products.json" });
  }
}
