import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const { reason } = req.query;

      let reports;
      if (reason) {
        reports = await db.getReportsByReason(reason as string);
      } else {
        reports = await db.getAllReports();
      }
      return res.status(200).json(reports);
    } catch (err) {
      console.error('Error reading reports:', err);
      return res.status(500).json({ error: "Failed to read reports" });
    }
  } else if (req.method === "POST") {
    try {
      const report = req.body;

      const newReport = await db.createReport({
        reporterId: report.reporterId,
        reportedUserId: report.reportedUserId,
        reportedContentType: report.reportedContentType,
        reportedContentId: report.reportedContentId,
        reason: report.reason,
        description: report.description
      });
      return res.status(201).json({ success: true, report: newReport });
    } catch (err) {
      console.error('Error saving report:', err);
      res.status(500).json({ error: "Failed to save report" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
