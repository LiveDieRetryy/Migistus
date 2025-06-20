import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const lifecycleConfigPath = path.join(process.cwd(), "public", "data", "product-lifecycle-config.json");

// Initialize config file if it doesn't exist
const initializeConfigFile = () => {
  if (!fs.existsSync(lifecycleConfigPath)) {
    const defaultConfig = {
      votingToComingSoonThreshold: 50, // votes needed to move from voting to coming soon
      comingSoonDuration: 7, // days to stay in coming soon
      communityDropsDuration: 14, // days to stay in community drops
      autoPromotionEnabled: true,
      lastUpdated: new Date().toISOString(),
      createdBy: "system"
    };
    fs.writeFileSync(lifecycleConfigPath, JSON.stringify(defaultConfig, null, 2));
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  initializeConfigFile();

  if (req.method === "GET") {
    try {
      const config = JSON.parse(fs.readFileSync(lifecycleConfigPath, "utf8"));
      res.status(200).json(config);
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

      const config = {
        votingToComingSoonThreshold: parseInt(votingToComingSoonThreshold),
        comingSoonDuration: parseInt(comingSoonDuration),
        communityDropsDuration: parseInt(communityDropsDuration),
        autoPromotionEnabled: Boolean(autoPromotionEnabled),
        lastUpdated: new Date().toISOString(),
        updatedBy: updatedBy || "admin"
      };

      fs.writeFileSync(lifecycleConfigPath, JSON.stringify(config, null, 2));

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
