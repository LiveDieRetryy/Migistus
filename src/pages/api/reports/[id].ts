import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const REPORTS_PATH = path.resolve("public/data/reports.json");

function ensureFile() {
  if (!fs.existsSync(REPORTS_PATH)) fs.writeFileSync(REPORTS_PATH, "[]");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  ensureFile();
  
  const { id } = req.query;

  if (req.method === "GET") {
    // Get a single report by ID
    try {
      const reports = JSON.parse(fs.readFileSync(REPORTS_PATH, "utf-8"));
      const report = reports.find((r: any) => r.id === id || r.id === Number(id));
      
      if (report) {
        res.status(200).json(report);
      } else {
        res.status(404).json({ error: "Report not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to read report" });
    }
  } else if (req.method === "PATCH") {
    // Update a report (status, notes, etc.)
    try {
      const reports = JSON.parse(fs.readFileSync(REPORTS_PATH, "utf-8"));
      const reportIndex = reports.findIndex((r: any) => r.id === id || r.id === Number(id));
      
      if (reportIndex === -1) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Update the report with new data
      reports[reportIndex] = {
        ...reports[reportIndex],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(REPORTS_PATH, JSON.stringify(reports, null, 2));
      res.status(200).json({ success: true, report: reports[reportIndex] });
    } catch (err) {
      res.status(500).json({ error: "Failed to update report" });
    }
  } else if (req.method === "DELETE") {
    // Delete a report
    try {
      const reports = JSON.parse(fs.readFileSync(REPORTS_PATH, "utf-8"));
      const filteredReports = reports.filter((r: any) => r.id !== id && r.id !== Number(id));
      
      if (filteredReports.length === reports.length) {
        return res.status(404).json({ error: "Report not found" });
      }

      fs.writeFileSync(REPORTS_PATH, JSON.stringify(filteredReports, null, 2));
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete report" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
