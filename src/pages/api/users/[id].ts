import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const USERS_PATH = path.resolve("public/data/users.json");

function readUsers() {
  if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "[]");
  return JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
}

function writeUsers(users: any[]) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing user id" });

  if (req.method === "PUT") {
    const { tier, banned, mutedUntil } = req.body;
    const users = readUsers();
    const idx = users.findIndex((u: any) => String(u.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: "User not found" });

    // Update tier if provided
    if (tier) users[idx].tier = tier;
    // Update banned status if provided
    if (typeof banned === "boolean") users[idx].banned = banned;
    // Update mutedUntil if provided
    if (mutedUntil !== undefined) users[idx].mutedUntil = mutedUntil;

    writeUsers(users);
    return res.status(200).json({ success: true, user: users[idx] });
  }

  res.setHeader("Allow", ["PUT"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
