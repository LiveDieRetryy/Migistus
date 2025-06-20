import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const productsPath = path.join(process.cwd(), "public", "data", "products.json");
const lifecycleConfigPath = path.join(process.cwd(), "public", "data", "product-lifecycle-config.json");

interface Product {
  id: number;
  name: string;
  votes: number;
  stage?: string;
  stageEnteredAt?: string;
  promotedAt?: string;
  [key: string]: any;
}

interface LifecycleConfig {
  votingToComingSoonThreshold: number;
  comingSoonDuration: number;
  communityDropsDuration: number;
  autoPromotionEnabled: boolean;
}

const getProducts = (): Product[] => {
  try {
    return JSON.parse(fs.readFileSync(productsPath, "utf8"));
  } catch (error) {
    console.error("Error reading products:", error);
    return [];
  }
};

const saveProducts = (products: Product[]) => {
  try {
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error("Error saving products:", error);
    throw error;
  }
};

const getLifecycleConfig = (): LifecycleConfig => {
  try {
    return JSON.parse(fs.readFileSync(lifecycleConfigPath, "utf8"));
  } catch (error) {
    console.error("Error reading lifecycle config:", error);
    // Return default config if file doesn't exist
    return {
      votingToComingSoonThreshold: 50,
      comingSoonDuration: 7,
      communityDropsDuration: 14,
      autoPromotionEnabled: true
    };
  }
};

const processProductLifecycle = (products: Product[], config: LifecycleConfig) => {
  const now = new Date();
  const updatedProducts: Product[] = [];
  const promotions: Array<{ productId: number; fromStage: string; toStage: string; reason: string }> = [];

  for (const product of products) {
    const updatedProduct = { ...product };
    
    // Initialize stage if not set
    if (!updatedProduct.stage) {
      updatedProduct.stage = "voting";
      updatedProduct.stageEnteredAt = now.toISOString();
    }

    const stageEnteredAt = new Date(updatedProduct.stageEnteredAt || now);
    const daysSinceStageEntered = Math.floor((now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24));

    switch (updatedProduct.stage) {
      case "voting":
        // Check if product has enough votes to move to coming-soon
        if (updatedProduct.votes >= config.votingToComingSoonThreshold) {
          updatedProduct.stage = "coming-soon";
          updatedProduct.stageEnteredAt = now.toISOString();
          updatedProduct.promotedAt = now.toISOString();
          promotions.push({
            productId: updatedProduct.id,
            fromStage: "voting",
            toStage: "coming-soon",
            reason: `Reached ${config.votingToComingSoonThreshold} votes threshold`
          });
        }
        break;

      case "coming-soon":
        // Check if product should move to community-drops after duration
        if (daysSinceStageEntered >= config.comingSoonDuration) {
          updatedProduct.stage = "community-drops";
          updatedProduct.stageEnteredAt = now.toISOString();
          updatedProduct.promotedAt = now.toISOString();
          promotions.push({
            productId: updatedProduct.id,
            fromStage: "coming-soon",
            toStage: "community-drops",
            reason: `Completed ${config.comingSoonDuration} days in coming-soon stage`
          });
        }
        break;

      case "community-drops":
        // Check if product should move to completed after duration
        if (daysSinceStageEntered >= config.communityDropsDuration) {
          updatedProduct.stage = "completed";
          updatedProduct.stageEnteredAt = now.toISOString();
          updatedProduct.promotedAt = now.toISOString();
          updatedProduct.completedAt = now.toISOString();
          promotions.push({
            productId: updatedProduct.id,
            fromStage: "community-drops",
            toStage: "completed",
            reason: `Completed ${config.communityDropsDuration} days in community-drops stage`
          });
        }
        break;

      case "completed":
        // Products stay in completed stage
        break;

      default:
        // Handle unknown stages by setting to voting
        updatedProduct.stage = "voting";
        updatedProduct.stageEnteredAt = now.toISOString();
        break;
    }

    updatedProducts.push(updatedProduct);
  }

  return { updatedProducts, promotions };
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const products = getProducts();
      const config = getLifecycleConfig();

      if (!config.autoPromotionEnabled) {
        return res.status(200).json({ 
          message: "Auto-promotion is disabled",
          promotions: [],
          processedCount: 0
        });
      }

      const { updatedProducts, promotions } = processProductLifecycle(products, config);

      // Save updated products
      saveProducts(updatedProducts);

      // Log promotions for tracking
      if (promotions.length > 0) {
        console.log("Product lifecycle promotions:", promotions);
      }

      res.status(200).json({
        message: "Product lifecycle processed successfully",
        promotions,
        processedCount: updatedProducts.length,
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
      const products = getProducts();
      const config = getLifecycleConfig();
      
      const stageStats = {
        voting: products.filter(p => p.stage === "voting" || !p.stage).length,
        "coming-soon": products.filter(p => p.stage === "coming-soon").length,
        "community-drops": products.filter(p => p.stage === "community-drops").length,
        completed: products.filter(p => p.stage === "completed").length
      };

      res.status(200).json({
        config,
        stageStats,
        totalProducts: products.length,
        autoPromotionEnabled: config.autoPromotionEnabled
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
