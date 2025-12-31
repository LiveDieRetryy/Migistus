import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Comprehensive user data has been migrated to database-based queries
  // This endpoint is deprecated and returns 404 for backwards compatibility
  
  return res.status(404).json({ 
    error: "Comprehensive data endpoint is deprecated",
    message: "Use the main /api/users/[id] endpoint instead"
  });
}
