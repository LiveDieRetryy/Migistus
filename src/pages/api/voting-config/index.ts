// pages/api/voting-config/index.ts
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { db, isProduction } from "@/lib/db";

const filePath = path.resolve("public/data/voting.json");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const useProduction = isProduction();

  try {
    if (req.method === "GET") {
      if (useProduction) {
        // Use database in production
        const config = await db.getVotingConfig();
        
        // If no config exists, initialize defaults
        if (Object.keys(config.tierLimits).length === 0) {
          const defaultConfig = await db.initializeDefaultVotingConfig();
          return res.status(200).json(defaultConfig);
        }
        
        return res.status(200).json(config);
      } else {
        // Use file system in development
        const json = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(json);
        return res.status(200).json(data);
      }
    } else if (req.method === "PUT" || req.method === "POST") {
      const updates = req.body;

      if (useProduction) {
        // Use database in production
        const updatedConfig = await db.updateVotingConfig(updates);
        return res.status(200).json({ success: true, config: updatedConfig });
      } else {
        // Use file system in development
        const json = fs.readFileSync(filePath, "utf-8");
        let data = JSON.parse(json);
        
        // Deep merge for tierLimits and tierMultipliers
        data = {
          ...data,
          ...updates,
          tierLimits: { ...(data.tierLimits || {}), ...(updates.tierLimits || {}) },
          tierMultipliers: { ...(data.tierMultipliers || {}), ...(updates.tierMultipliers || {}) }
        };
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return res.status(200).json({ success: true });
      }
    } else {
      res.setHeader("Allow", ["GET", "PUT", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error("Voting config API error:", err);
    res.status(500).json({ error: "Failed to handle voting config" });
  }
}
