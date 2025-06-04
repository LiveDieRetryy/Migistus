import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const filePath = path.resolve("public/data/votes.json");

function ensureFile() {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]");
}

const tierMultipliers = { Initiate: 1, Guild: 2, MIGISTUS: 4 } as const;
type Tier = keyof typeof tierMultipliers;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  ensureFile();
  if (req.method === "GET") {
    try {
      const votes = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      res.status(200).json(votes);
    } catch (err) {
      res.status(500).json({ error: "Failed to load votes" });
    }
  } else if (req.method === "POST") {
    try {
      const vote = req.body;
      const votes = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      // Use tier from request body if provided, else default to Initiate
      const tier: Tier = ["Initiate", "Guild", "MIGISTUS"].includes(vote.tier) ? vote.tier : "Initiate";
      const multiplier = tierMultipliers[tier];
      vote.value = (vote.value || 1) * multiplier; // Adjust the vote value based on tier
      votes.push(vote);
      fs.writeFileSync(filePath, JSON.stringify(votes, null, 2));
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save vote" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
