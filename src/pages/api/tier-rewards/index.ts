import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { db, isProduction } from "@/lib/db";

const FILE_PATH = path.resolve("public/data/tier-rewards.json");

const DEFAULT_DATA = {
  Initiate: {
    perks: ["Access to drops", "1x voting power"],
    votingMultiplier: 1,
    chatCooldown: 30,
    discount: 0,
  },
  Guild: {
    perks: ["All Initiate perks", "2x voting power", "Priority support"],
    votingMultiplier: 2,
    chatCooldown: 10,
    discount: 2,
  },
  MIGISTUS: {
    perks: ["All Guild perks", "4x voting power", "Exclusive deals", "Early access"],
    votingMultiplier: 4,
    chatCooldown: 3,
    discount: 5,
  },
};

function ensureFile() {
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const useProduction = isProduction();

  try {
    if (req.method === "GET") {
      if (useProduction) {
        // Use database in production
        const rewards = await db.getTierRewards();
        
        // If no rewards exist, initialize defaults
        if (Object.keys(rewards).length === 0) {
          const defaultRewards = await db.initializeDefaultTierRewards();
          return res.status(200).json(defaultRewards);
        }
        
        return res.status(200).json(rewards);
      } else {
        // Use file system in development
        ensureFile();
        const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
        return res.status(200).json(data);
      }
    } else if (req.method === "POST" || req.method === "PUT") {
      const rewards = req.body;

      if (useProduction) {
        // Use database in production
        const updatedRewards = await db.updateTierRewards(rewards);
        return res.status(200).json({ success: true, rewards: updatedRewards });
      } else {
        // Use file system in development
        fs.writeFileSync(FILE_PATH, JSON.stringify(rewards, null, 2));
        return res.status(200).json({ success: true });
      }
    } else {
      res.setHeader("Allow", ["GET", "POST", "PUT"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error("Tier rewards API error:", err);
    res.status(500).json({ error: "Failed to handle tier rewards" });
  }
}
