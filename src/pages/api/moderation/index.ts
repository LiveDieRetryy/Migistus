import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const moderation = await db.getModerationSettings();
      res.status(200).json(moderation);
    } catch (err) {
      res.status(500).json({ error: "Failed to load moderation settings" });
    }
  } else if (req.method === "POST") {
    try {
      const { profanityList, filterSettings } = req.body;
      
      await db.updateModerationSettings({
        profanityList: Array.isArray(profanityList) ? profanityList : [],
        filterSettings: typeof filterSettings === "object" ? filterSettings : {},
      });
      
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save moderation settings" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
