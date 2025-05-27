import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const USERS_PATH = path.resolve(process.cwd(), "src/data/users.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const data = fs.readFileSync(USERS_PATH, "utf-8");
      res.status(200).json(JSON.parse(data));
    } catch (err) {
      console.error("GET user stats error:", err);
      res.status(500).json({ error: "Failed to load user stats" });
    }
  }

  else if (req.method === "POST") {
    try {
      const data = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
      data.totalUsers = (data.totalUsers ?? 0) + 1;
      fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2));
      res.status(200).json({ success: true, totalUsers: data.totalUsers });
    } catch (err) {
      console.error("POST user creation error:", err);
      res.status(500).json({ error: "Failed to create user" });
    }
  }

  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
