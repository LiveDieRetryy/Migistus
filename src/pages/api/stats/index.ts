// pages/api/stats/index.ts
// Returns: { users, votes, refunds, totalProducts }

import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const users = JSON.parse(fs.readFileSync(path.resolve("public/data/users.json"), "utf-8"));
    const votes = JSON.parse(fs.readFileSync(path.resolve("public/data/voting.json"), "utf-8"));
    const refunds = JSON.parse(fs.readFileSync(path.resolve("public/data/refunds.json"), "utf-8"));
    const products = JSON.parse(fs.readFileSync(path.resolve("public/data/products.json"), "utf-8"));

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
