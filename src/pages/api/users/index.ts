import { readFileSync } from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "users.json");
    const jsonData = readFileSync(filePath, "utf-8");
    const data = JSON.parse(jsonData);

    res.status(200).json({ totalUsers: Array.isArray(data) ? data.length : 0 });
  } catch (error) {
    console.error("Failed to read users:", error);
    res.status(500).json({ totalUsers: 0 });
  }
}
