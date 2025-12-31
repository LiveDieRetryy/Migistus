// pages/api/voting-config/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Get voting config from database
      const config = await db.getVotingConfig();
      
      // If no config exists, initialize defaults
      if (Object.keys(config.tierLimits).length === 0) {
        const defaultConfig = await db.initializeDefaultVotingConfig();
        return res.status(200).json(defaultConfig);
      }
      
      return res.status(200).json(config);
    } else if (req.method === "PUT" || req.method === "POST") {
      const updates = req.body;

      // Update voting config in database
      const updatedConfig = await db.updateVotingConfig(updates);
      return res.status(200).json({ success: true, config: updatedConfig });
    } else {
      res.setHeader("Allow", ["GET", "PUT", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error("Voting config API error:", err);
    res.status(500).json({ error: "Failed to handle voting config" });
  }
}
