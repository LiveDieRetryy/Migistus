import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const MODERATION_PATH = path.resolve("public/data/moderation.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      if (!fs.existsSync(MODERATION_PATH)) {
        fs.writeFileSync(MODERATION_PATH, JSON.stringify({
          profanityList: [],
          filterSettings: {}
        }, null, 2));
      }
      const moderation = JSON.parse(fs.readFileSync(MODERATION_PATH, "utf-8"));
      res.status(200).json(moderation);
    } catch (err) {
      res.status(500).json({ error: "Failed to load moderation settings" });
    }
  } else if (req.method === "POST") {
    try {
      const { profanityList, filterSettings } = req.body;
      const moderation = {
        profanityList: Array.isArray(profanityList) ? profanityList : [],
        filterSettings: typeof filterSettings === "object" ? filterSettings : {},
      };
      fs.writeFileSync(MODERATION_PATH, JSON.stringify(moderation, null, 2));
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save moderation settings" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
