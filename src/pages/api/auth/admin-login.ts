import type { NextApiRequest, NextApiResponse } from "next";

// Hardcoded admin credentials for now
const ADMIN_USER = "Admin";
const ADMIN_PASS = "Admin";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.status(200).json({ success: true });
  }
  return res.status(401).json({ error: "Invalid admin credentials" });
}
