import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.resolve(process.cwd(), "src/configs/voting.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const file = fs.readFileSync(CONFIG_PATH, "utf-8");
    const config = JSON.parse(file);

    config.votesCast = (config.votesCast ?? 0) + 1;

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    res.status(200).json({ success: true, votesCast: config.votesCast });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ error: "Failed to update vote count" });
  }
}
