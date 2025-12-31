import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

interface Product {
  id: number;
  name: string;
  votes: number;
  stage?: string;
  stage_entered_at?: string;
  promoted_at?: string;
  completed_at?: string;
}

interface LifecycleConfig {
  voting_to_coming_soon_threshold: number;
  coming_soon_duration: number;
  community_drops_duration: number;
  auto_promotion_enabled: boolean;
}

const processProductLifecycle = async (products: any[], config: any) => {
  const now = new Date();
  const promotions: Array<{ productId: number; fromStage: string; toStage: string; reason: string }> = [];

  for (const product of products) {
    const currentStage = product.stage || "voting";
    const stageEnteredAt = product.stage_entered_at ? new Date(product.stage_entered_at) : now;
    const daysSinceStageEntered = Math.floor((now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24));

    switch (currentStage) {
      case "voting":
        // Check if product has enough votes to move to coming-soon
        if (product.votes >= config.voting_to_coming_soon_threshold) {
          await db.updateProductStage(product.id, "coming-soon", now.toISOString());
          promotions.push({
            productId: product.id,
            fromStage: "voting",
            toStage: "coming-soon",
            reason: `Reached ${config.voting_to_coming_soon_threshold} votes threshold`
          });
        }
        break;

      case "coming-soon":
        // Check if product should move to community-drops after duration
        if (daysSinceStageEntered >= config.coming_soon_duration) {
          await db.updateProductStage(product.id, "community-drops", now.toISOString());
          promotions.push({
            productId: product.id,
            fromStage: "coming-soon",
            toStage: "community-drops",
            reason: `Completed ${config.coming_soon_duration} days in coming-soon stage`
          });
        }
        break;

      case "community-drops":
        // Check if product should move to completed after duration
        if (daysSinceStageEntered >= config.community_drops_duration) {
          await db.updateProductStage(product.id, "completed", now.toISOString());
          promotions.push({
            productId: product.id,
            fromStage: "community-drops",
            toStage: "completed",
            reason: `Completed ${config.community_drops_duration} days in community-drops stage`
          });
        }
        break;
    }
  }

  return promotions;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const config = await db.getProductLifecycleConfig();

      if (!config.auto_promotion_enabled) {
        return res.status(200).json({ 
          message: "Auto-promotion is disabled",
          promotions: [],
          processedCount: 0
        });
      }

      const products = await db.getProductsForLifecycleProcessing();
      const promotions = await processProductLifecycle(products, config);

      // Log promotions for tracking
      if (promotions.length > 0) {
        console.log("Product lifecycle promotions:", promotions);
      }

      res.status(200).json({
        message: "Product lifecycle processed successfully",
        promotions,
        processedCount: products.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error processing product lifecycle:", error);
      res.status(500).json({ error: "Failed to process product lifecycle" });
    }
  }

  else if (req.method === "GET") {
    // Get status of all products and their stages
    try {
      const config = await db.getProductLifecycleConfig();
      const stageStats = await db.getProductStageStats();
      
      const totalProducts = Object.values(stageStats).reduce((sum: number, count) => sum + (count as number), 0);

      res.status(200).json({
        config: {
          votingToComingSoonThreshold: config.voting_to_coming_soon_threshold,
          comingSoonDuration: config.coming_soon_duration,
          communityDropsDuration: config.community_drops_duration,
          autoPromotionEnabled: config.auto_promotion_enabled
        },
        stageStats,
        totalProducts,
        autoPromotionEnabled: config.auto_promotion_enabled
      });

    } catch (error) {
      console.error("Error getting lifecycle status:", error);
      res.status(500).json({ error: "Failed to get lifecycle status" });
    }
  }

  else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
