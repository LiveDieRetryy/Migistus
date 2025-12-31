// pages/api/stats/index.ts
// Returns: { users, votes, refunds, totalProducts }

import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get counts directly from database
    const allRefunds = await db.getAllRefunds();
    const votes = await db.getVotes();
    const users = await db.getAllUsers();
    const products = await db.getProducts();

    const pendingRefunds = allRefunds.filter((r: any) => r.status === "pending").length;

    res.status(200).json({
      userCount: users.length,
      votesCast: votes.length,
      pendingRefunds,
      totalProducts: products.length
    });
  } catch (err) {
    console.error("Stats API error:", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
}
