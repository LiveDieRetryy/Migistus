import { readFileSync, existsSync, writeFileSync } from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "users.json");
    if (!existsSync(filePath)) writeFileSync(filePath, "[]");
    const jsonData = readFileSync(filePath, "utf-8");
    const data = JSON.parse(jsonData);

    // Return full user list for GET
    if (req.method === "GET") {
      res.status(200).json({
        totalUsers: Array.isArray(data) ? data.length : 0,
        users: Array.isArray(data) ? data : []
      });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Failed to read users:", error);
    res.status(500).json({ totalUsers: 0, users: [] });
  }
}
