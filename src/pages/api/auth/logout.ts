import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionToken, deleteSession, clearSessionCookie } from "@/lib/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Get and delete the session
  const token = getSessionToken(req);
  if (token) {
    await deleteSession(token);
  }

  // Clear the session cookie
  clearSessionCookie(res);

  return res.status(200).json({ 
    success: true,
    message: "Logged out successfully" 
  });
}
