import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const config = await db.getProductLifecycleConfig();
      
      // Map snake_case to camelCase for frontend
      const formattedConfig = {
        votingToComingSoonThreshold: config.voting_to_coming_soon_threshold,
        comingSoonDuration: config.coming_soon_duration,
        communityDropsDuration: config.community_drops_duration,
        autoPromotionEnabled: config.auto_promotion_enabled,
        lastUpdated: config.last_updated,
        createdBy: config.updated_by || 'system'
      };
      
      res.status(200).json(formattedConfig);
    } catch (error) {
      console.error("Error reading lifecycle config:", error);
      res.status(500).json({ error: "Failed to load lifecycle configuration" });
    }
  }

  else if (req.method === "POST" || req.method === "PUT") {
    try {
      const { 
        votingToComingSoonThreshold, 
        comingSoonDuration, 
        communityDropsDuration, 
        autoPromotionEnabled,
        updatedBy 
      } = req.body;

      if (votingToComingSoonThreshold === undefined || 
          comingSoonDuration === undefined || 
          communityDropsDuration === undefined) {
        return res.status(400).json({ error: "Missing required configuration fields" });
      }

      const config = await db.updateProductLifecycleConfig({
        votingToComingSoonThreshold: parseInt(votingToComingSoonThreshold),
        comingSoonDuration: parseInt(comingSoonDuration),
        communityDropsDuration: parseInt(communityDropsDuration),
        autoPromotionEnabled: Boolean(autoPromotionEnabled),
        updatedBy: updatedBy || "admin"
      });

      res.status(200).json(config);
    } catch (error) {
      console.error("Error updating lifecycle config:", error);
      res.status(500).json({ error: "Failed to update lifecycle configuration" });
    }
  }

  else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
