import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Activity tracking has been migrated to database-based tracking
  // This endpoint is deprecated and returns empty data for backwards compatibility
  
  if (req.method === "GET") {
    return res.status(200).json([]);
  }

  if (req.method === "POST") {
    // Accept POST requests but don't store anything
    return res.status(201).json({ success: true, activity: req.body });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
