import { readFileSync, existsSync, writeFileSync } from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "users.json");
    if (!existsSync(filePath)) writeFileSync(filePath, "[]");
    const jsonData = readFileSync(filePath, "utf-8");
    let data = JSON.parse(jsonData);

    // Return full user list for GET
    if (req.method === "GET") {
      res.status(200).json({
        totalUsers: Array.isArray(data) ? data.length : 0,
        users: Array.isArray(data) ? data : []
      });
      return;
    }

    // Accept full user sync from frontend
    if (req.method === "POST") {
      // Accept either {users: [...]} or a full array or a single user
      let users: any[] = [];
      if (Array.isArray(req.body)) {
        users = req.body;
      } else if (Array.isArray(req.body.users)) {
        users = req.body.users;
      } else if (typeof req.body === "object" && req.body.id) {
        users = [req.body];
      }
      if (users.length > 0) {
        // Merge: add new users if not already present (by id or email)
        let merged = Array.isArray(data) ? [...data] : [];
        users.forEach((newUser) => {
          const exists = merged.some(
            (u: any) =>
              String(u.id) === String(newUser.id) ||
              (u.email && newUser.email && u.email.toLowerCase() === newUser.email.toLowerCase())
          );
          if (!exists) {
            merged.push({
              ...newUser,
              wallet: typeof newUser.wallet === "number" ? newUser.wallet : 0,
              guildCoins: typeof newUser.guildCoins === "number" ? newUser.guildCoins : 0,
            });
          }
        });
        writeFileSync(filePath, JSON.stringify(merged, null, 2));
        res.status(200).json({ success: true, totalUsers: merged.length });
        return;
      }
      res.status(400).json({ error: "No users provided" });
      return;
    }

    // Update a single user by id
    if (req.method === "PUT") {
      const { id } = req.query;
      const update = req.body;
      if (!id) return res.status(400).json({ error: "Missing user id" });
      if (!Array.isArray(data)) data = [];
      const idx = data.findIndex((u: any) => String(u.id) === String(id));
      if (idx !== -1) {
        data[idx] = {
          ...data[idx],
          ...update,
          wallet: typeof update.wallet === "number" ? update.wallet : data[idx].wallet ?? 0,
          guildCoins: typeof update.guildCoins === "number" ? update.guildCoins : data[idx].guildCoins ?? 0,
        };
        writeFileSync(filePath, JSON.stringify(data, null, 2));
        res.status(200).json({ success: true, user: data[idx] });
      } else {
        res.status(404).json({ error: "User not found" });
      }
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Failed to read users:", error);
    res.status(500).json({ totalUsers: 0, users: [] });
  }
}
