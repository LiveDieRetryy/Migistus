import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const REFUNDS_PATH = path.resolve(process.cwd(), "src/data/refunds.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const data = fs.readFileSync(REFUNDS_PATH, "utf-8");
      res.status(200).json(JSON.parse(data));
    } catch (err) {
      console.error("GET refund stats error:", err);
      res.status(500).json({ error: "Failed to load refund stats" });
    }
  }

  else if (req.method === "POST") {
    try {
      const data = JSON.parse(fs.readFileSync(REFUNDS_PATH, "utf-8"));
      data.pendingRefunds = (data.pendingRefunds ?? 0) + 1;
      fs.writeFileSync(REFUNDS_PATH, JSON.stringify(data, null, 2));
      res.status(200).json({ success: true, pendingRefunds: data.pendingRefunds });
    } catch (err) {
      console.error("POST refund creation error:", err);
      res.status(500).json({ error: "Failed to create refund" });
    }
  }

  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
