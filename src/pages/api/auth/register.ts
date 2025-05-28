import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";

const USERS_PATH = path.resolve("public/data/users.json");

function readUsers() {
  if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "[]");
  return JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
}

function writeUsers(users: any[]) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const users = readUsers();
  if (users.some((u: any) => u.email === email)) {
    return res.status(400).json({ error: "Email already registered" });
  }
  const hash = await bcrypt.hash(password, 10);
  users.push({ id: Date.now(), username, email, password: hash });
  writeUsers(users);
  res.status(201).json({ success: true });
}
