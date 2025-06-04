import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  ensureFile();
  if (req.method === "GET") {
    const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
    res.status(200).json(data);
  } else if (req.method === "POST" || req.method === "PUT") {
    const rewards = req.body;
    fs.writeFileSync(FILE_PATH, JSON.stringify(rewards, null, 2));
    res.status(200).json({ success: true });
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
