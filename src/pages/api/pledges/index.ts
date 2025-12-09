// pages/api/pledges/index.ts
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const filePath = path.resolve("public/data/pledges.json");

function readData() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ pledges: [] }, null, 2));
  }
  const json = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(json);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const data = readData();
      res.status(200).json(data);
    } else {
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Failed to handle pledges.json", pledges: [] });
  }
}
