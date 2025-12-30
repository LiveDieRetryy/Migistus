import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { db, isProduction } from "@/lib/db";

const REPORTS_PATH = path.resolve("public/data/reports.json");

function ensureFile() {
  if (!fs.existsSync(REPORTS_PATH)) fs.writeFileSync(REPORTS_PATH, "[]");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const useProduction = isProduction();
  const { id } = req.query;
  const reportId = Number(id);

  if (isNaN(reportId)) {
    return res.status(400).json({ error: "Invalid report ID" });
  }

  if (req.method === "GET") {
    try {
      if (useProduction) {
        // Use database in production
        const report = await db.getReportById(reportId);
        if (report) {
          return res.status(200).json(report);
        } else {
          return res.status(404).json({ error: "Report not found" });
        }
      } else {
        // Use file system in development
        ensureFile();
        const reports = JSON.parse(fs.readFileSync(REPORTS_PATH, "utf-8"));
        const report = reports.find((r: any) => r.id === reportId);
        
        if (report) {
          return res.status(200).json(report);
        } else {
          return res.status(404).json({ error: "Report not found" });
        }
      }
    } catch (err) {
      console.error('Error reading report:', err);
      res.status(500).json({ error: "Failed to read report" });
    }
  } else if (req.method === "PATCH") {
    try {
      if (useProduction) {
        // Use database in production
        const report = await db.updateReport(reportId, req.body);
        
        if (report) {
          return res.status(200).json({ success: true, report });
        } else {
          return res.status(404).json({ error: "Report not found" });
        }
      } else {
        // Use file system in development
        ensureFile();
        const reports = JSON.parse(fs.readFileSync(REPORTS_PATH, "utf-8"));
        const reportIndex = reports.findIndex((r: any) => r.id === reportId);
        
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
        return res.status(200).json({ success: true, report: reports[reportIndex] });
      }
    } catch (err) {
      console.error('Error updating report:', err);
      res.status(500).json({ error: "Failed to update report" });
    }
  } else if (req.method === "DELETE") {
    try {
      if (useProduction) {
        // Use database in production
        await db.deleteReport(reportId);
        return res.status(200).json({ success: true });
      } else {
        // Use file system in development
        ensureFile();
        const reports = JSON.parse(fs.readFileSync(REPORTS_PATH, "utf-8"));
        const filteredReports = reports.filter((r: any) => r.id !== reportId);
        
        if (filteredReports.length === reports.length) {
          return res.status(404).json({ error: "Report not found" });
        }

        fs.writeFileSync(REPORTS_PATH, JSON.stringify(filteredReports, null, 2));
        return res.status(200).json({ success: true });
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      res.status(500).json({ error: "Failed to delete report" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
