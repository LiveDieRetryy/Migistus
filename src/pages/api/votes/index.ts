import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const filePath = path.resolve("public/data/votes.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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
