import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Simple auth check - in production, use proper authentication
  const authToken = req.headers.authorization;
  if (authToken !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Call the product lifecycle processing endpoint
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/product-lifecycle/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Lifecycle processing failed with status: ${response.status}`);
    }

    const data = await response.json();

    console.log(`Scheduled lifecycle processing completed:`, {
      timestamp: new Date().toISOString(),
      processedCount: data.processedCount,
      promotions: data.promotions.length,
      promotionDetails: data.promotions
    });

    res.status(200).json({
      success: true,
      message: "Scheduled lifecycle processing completed",
      processedCount: data.processedCount,
      promotions: data.promotions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Scheduled lifecycle processing error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process scheduled lifecycle update",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
