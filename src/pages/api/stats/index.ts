// pages/api/stats/index.ts
// Returns: { users, votes, refunds, totalProducts }

import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

function safeRead(file: string) {
  try {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const users = safeRead(path.resolve("public/data/users.json"));
    const votes = safeRead(path.resolve("public/data/votes.json"));
    const refunds = safeRead(path.resolve("public/data/refunds.json"));
    const products = safeRead(path.resolve("public/data/products.json"));

    res.status(200).json({
      userCount: Array.isArray(users) ? users.length : 0,
      votesCast: Array.isArray(votes) ? votes.length : 0,
      pendingRefunds: Array.isArray(refunds) ? refunds.filter(r => r.status === "pending").length : 0,
      totalProducts: Array.isArray(products) ? products.length : 0
    });
  } catch (err) {
    console.error("Stats API error:", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
}

// (No changes needed if you already use public/data/*.json.)
