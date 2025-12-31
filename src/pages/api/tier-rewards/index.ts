import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const rewards = await db.getTierRewards();
      
      // If no rewards exist, initialize defaults
      if (Object.keys(rewards).length === 0) {
        const defaultRewards = await db.initializeDefaultTierRewards();
        return res.status(200).json(defaultRewards);
      }
      
      return res.status(200).json(rewards);
    } else if (req.method === "POST" || req.method === "PUT") {
      const rewards = req.body;
      const updatedRewards = await db.updateTierRewards(rewards);
      return res.status(200).json({ success: true, rewards: updatedRewards });
    } else {
      res.setHeader("Allow", ["GET", "POST", "PUT"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error("Tier rewards API error:", err);
    res.status(500).json({ error: "Failed to handle tier rewards" });
  }
}
