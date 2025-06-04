import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const REPORTS_PATH = path.resolve("public/data/reports.json");

function ensureFile() {
  if (!fs.existsSync(REPORTS_PATH)) fs.writeFileSync(REPORTS_PATH, "[]");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  ensureFile();
  if (req.method === "GET") {
    // Optionally support ?reason=offensive to filter
    const { reason } = req.query;
    const reports = JSON.parse(fs.readFileSync(REPORTS_PATH, "utf-8"));
    if (reason) {
      res.status(200).json(reports.filter((r: any) => r.reason === reason));
    } else {
      // Sort by reason for monitor page
      res.status(200).json(
        reports.sort((a: any, b: any) => (a.reason > b.reason ? 1 : -1))
      );
    }
  } else if (req.method === "POST") {
    try {
      const report = req.body;
      const reports = JSON.parse(fs.readFileSync(REPORTS_PATH, "utf-8"));
      reports.push({ ...report, id: Date.now() });
      fs.writeFileSync(REPORTS_PATH, JSON.stringify(reports, null, 2));
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save report" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
