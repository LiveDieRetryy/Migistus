import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const filePath = path.resolve("public/data/votes.json");

function ensureFile() {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]");
}

// When processing a vote, multiply by user's tier
const tierMultipliers = { Initiate: 1, Guild: 2, MIGISTUS: 4 };

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
      const user = /* lookup user by id */;
      const multiplier = tierMultipliers[user.tier] || 1;
      const effectiveVotes = 1 * multiplier;
      vote.value *= effectiveVotes; // Adjust the vote value based on tier
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
