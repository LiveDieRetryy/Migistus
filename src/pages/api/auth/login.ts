import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";

const USERS_PATH = path.resolve("public/data/users.json");

function readUsers() {
  if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "[]");
  return JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const users = readUsers();
  // Allow login by username or email
  const user = users.find((u: any) => u.email === email || u.username === email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  // For demo: no JWT/session, just return success
  res.status(200).json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
}
