import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { z } from "zod";

// Define the schema for the config file
const configSchema = z.object({
  votingEnabled: z.boolean(),
  topWinners: z.number().int().min(1),
  doubleVoteWeek: z.boolean(),
  tripleVoteWeek: z.boolean(),
  tierLimits: z.object({
    Initiate: z.number().int(),
    Guild: z.number().int(),
    MIGISTUS: z.number().int(),
  }),
  tierMultipliers: z.object({
    Initiate: z.number().int(),
    Guild: z.number().int(),
    MIGISTUS: z.number().int(),
  }),
});

const CONFIG_PATH = path.resolve(process.cwd(), "src/configs/voting.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const data = fs.readFileSync(CONFIG_PATH, "utf-8");
      res.status(200).json(JSON.parse(data));
    } catch (err) {
      console.error("GET error:", err);
      res.status(500).json({ error: "Failed to read config" });
    }
  }

  else if (req.method === "POST") {
    try {
      const result = configSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid config format",
          details: result.error.errors,
        });
      }

      fs.writeFileSync(CONFIG_PATH, JSON.stringify(result.data, null, 2));
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("POST error:", err);
      res.status(500).json({ error: "Failed to save config" });
    }
  }

  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
