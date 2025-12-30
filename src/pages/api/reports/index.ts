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

  if (req.method === "GET") {
    try {
      const { reason } = req.query;

      if (useProduction) {
        // Use database in production
        let reports;
        if (reason) {
          reports = await db.getReportsByReason(reason as string);
        } else {
          reports = await db.getAllReports();
        }
        return res.status(200).json(reports);
      } else {
        // Use file system in development
        ensureFile();
        const reports = JSON.parse(fs.readFileSync(REPORTS_PATH, "utf-8"));
        if (reason) {
          return res.status(200).json(reports.filter((r: any) => r.reason === reason));
        } else {
          // Sort by reason for monitor page
          return res.status(200).json(
            reports.sort((a: any, b: any) => (a.reason > b.reason ? 1 : -1))
          );
        }
      }
    } catch (err) {
      console.error('Error reading reports:', err);
      return res.status(500).json({ error: "Failed to read reports" });
    }
  } else if (req.method === "POST") {
    try {
      const report = req.body;

      if (useProduction) {
        // Use database in production
        const newReport = await db.createReport({
          reporterId: report.reporterId,
          reportedUserId: report.reportedUserId,
          reportedContentType: report.reportedContentType,
          reportedContentId: report.reportedContentId,
          reason: report.reason,
          description: report.description
        });
        return res.status(201).json({ success: true, report: newReport });
      } else {
        // Use file system in development
        ensureFile();
        const reports = JSON.parse(fs.readFileSync(REPORTS_PATH, "utf-8"));
        const newReport = { ...report, id: Date.now() };
        reports.push(newReport);
        fs.writeFileSync(REPORTS_PATH, JSON.stringify(reports, null, 2));
        return res.status(201).json({ success: true, report: newReport });
      }
    } catch (err) {
      console.error('Error saving report:', err);
      res.status(500).json({ error: "Failed to save report" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
