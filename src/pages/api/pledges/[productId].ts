import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

export type Pledge = {
  id: number;
  user: string;
  time: string;
  productId: string | number;
};

const PLEDGES_DIR = path.resolve("public/data/pledges");

function ensureDir() {
  if (!fs.existsSync(PLEDGES_DIR)) fs.mkdirSync(PLEDGES_DIR, { recursive: true });
}

function getPledgeFile(productId: string) {
  return path.join(PLEDGES_DIR, `pledges-${productId}.json`);
}

function readPledges(productId: string): Pledge[] {
  const file = getPledgeFile(productId);
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writePledges(productId: string, pledges: Pledge[]) {
  const file = getPledgeFile(productId);
  fs.writeFileSync(file, JSON.stringify(pledges, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query;
  if (!productId || typeof productId !== "string") {
    return res.status(400).json({ error: "Missing productId" });
  }
  ensureDir();

  if (req.method === "GET") {
    try {
      // Also support legacy pledges in products.json for backward compatibility
      const pledges = readPledges(productId);
      // If empty, try to infer from products.json (for demo)
      if (pledges.length === 0) {
        const productsPath = path.resolve("public/data/products.json");
        if (fs.existsSync(productsPath)) {
          const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
          const prod = products.find((p: any) =>
            (p.slug && p.slug === productId) ||
            (p.id && String(p.id) === productId)
          );
          if (prod && prod.pledges && prod.pledges > 0) {
            // Generate anonymous pledges for demo
            const fakePledges = Array.from({ length: prod.pledges }).map((_, i) => ({
              id: Date.now() + i,
              user: "Anonymous",
              time: new Date(Date.now() - i * 60000).toISOString(),
              productId,
            }));
            writePledges(productId, fakePledges);
            return res.status(200).json(fakePledges);
          }
        }
      }
      res.status(200).json(readPledges(productId));
    } catch (err) {
      res.status(500).json({ error: "Failed to load pledges" });
    }
  } else if (req.method === "POST") {
    try {
      const { user } = req.body;
      const pledges = readPledges(productId);
      const pledge: Pledge = {
        id: Date.now(),
        user: user || "Anonymous",
        time: new Date().toISOString(),
        productId,
      };
      pledges.push(pledge);
      writePledges(productId, pledges);
      res.status(201).json({ success: true, pledge });
    } catch (err) {
      res.status(500).json({ error: "Failed to save pledge" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
