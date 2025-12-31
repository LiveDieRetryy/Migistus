import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const reportId = Number(id);

  if (isNaN(reportId)) {
    return res.status(400).json({ error: "Invalid report ID" });
  }

  if (req.method === "GET") {
    try {
      const report = await db.getReportById(reportId);
      if (report) {
        return res.status(200).json(report);
      } else {
        return res.status(404).json({ error: "Report not found" });
      }
    } catch (err) {
      console.error('Error reading report:', err);
      res.status(500).json({ error: "Failed to read report" });
    }
  } else if (req.method === "PATCH") {
    try {
      const report = await db.updateReport(reportId, req.body);
      
      if (report) {
        return res.status(200).json({ success: true, report });
      } else {
        return res.status(404).json({ error: "Report not found" });
      }
    } catch (err) {
      console.error('Error updating report:', err);
      res.status(500).json({ error: "Failed to update report" });
    }
  } else if (req.method === "DELETE") {
    try {
      await db.deleteReport(reportId);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error deleting report:', err);
      res.status(500).json({ error: "Failed to delete report" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
