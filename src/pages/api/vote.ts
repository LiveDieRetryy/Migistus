import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get current config
    const config = await db.getVotingConfig();
    const currentCount = parseInt(config.votesCast || 0);
    const newCount = currentCount + 1;
    
    // Update votesCast in settings
    await db.updateVotingSetting('votesCast', newCount);
    
    res.status(200).json({ success: true, votesCast: newCount });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ error: "Failed to update vote count" });
  }
}
