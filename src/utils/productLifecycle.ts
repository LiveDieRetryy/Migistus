// Product lifecycle management utilities

export type ProductStage = "voting" | "coming-soon" | "community-drops" | "completed";

export interface ProductWithStage {
  id: number;
  name: string;
  votes: number;
  stage?: ProductStage;
  stageEnteredAt?: string;
  promotedAt?: string;
  completedAt?: string;
  [key: string]: any;
}

export interface LifecycleConfig {
  votingToComingSoonThreshold: number;
  comingSoonDuration: number;
  communityDropsDuration: number;
  autoPromotionEnabled: boolean;
}

export const STAGE_LABELS: Record<ProductStage, string> = {
  "voting": "In Voting",
  "coming-soon": "Coming Soon",
  "community-drops": "Community Drops",
  "completed": "Completed"
};

export const STAGE_COLORS: Record<ProductStage, string> = {
  "voting": "bg-blue-100 text-blue-800",
  "coming-soon": "bg-yellow-100 text-yellow-800", 
  "community-drops": "bg-green-100 text-green-800",
  "completed": "bg-gray-100 text-gray-800"
};

export const getStageInfo = (stage: ProductStage | undefined) => {
  const safeStage = stage || "voting";
  return {
    label: STAGE_LABELS[safeStage],
    colorClass: STAGE_COLORS[safeStage],
    stage: safeStage
  };
};

export const getDaysInStage = (stageEnteredAt?: string): number => {
  if (!stageEnteredAt) return 0;
  const enteredDate = new Date(stageEnteredAt);
  const now = new Date();
  return Math.floor((now.getTime() - enteredDate.getTime()) / (1000 * 60 * 60 * 24));
};

export const getTimeUntilNextStage = (
  product: ProductWithStage, 
  config: LifecycleConfig
): { daysRemaining: number; nextStage: ProductStage | null; description: string } => {
  const currentStage = product.stage || "voting";
  const daysInStage = getDaysInStage(product.stageEnteredAt);

  switch (currentStage) {
    case "voting":
      const votesNeeded = config.votingToComingSoonThreshold - (product.votes || 0);
      if (votesNeeded <= 0) {
        return {
          daysRemaining: 0,
          nextStage: "coming-soon",
          description: "Ready to move to Coming Soon"
        };
      }
      return {
        daysRemaining: -1, // No time limit, depends on votes
        nextStage: "coming-soon",
        description: `${votesNeeded} more votes needed`
      };

    case "coming-soon":
      const daysRemaining = config.comingSoonDuration - daysInStage;
      return {
        daysRemaining: Math.max(0, daysRemaining),
        nextStage: "community-drops",
        description: daysRemaining > 0 
          ? `${daysRemaining} days until Community Drops`
          : "Ready to move to Community Drops"
      };

    case "community-drops":
      const dropDaysRemaining = config.communityDropsDuration - daysInStage;
      return {
        daysRemaining: Math.max(0, dropDaysRemaining),
        nextStage: "completed",
        description: dropDaysRemaining > 0 
          ? `${dropDaysRemaining} days remaining in drop`
          : "Drop completed"
      };

    case "completed":
      return {
        daysRemaining: 0,
        nextStage: null,
        description: "Product lifecycle completed"
      };

    default:
      return {
        daysRemaining: 0,
        nextStage: null,
        description: "Unknown stage"
      };
  }
};

export const canManuallyPromote = (product: ProductWithStage, config: LifecycleConfig): boolean => {
  const currentStage = product.stage || "voting";
  
  switch (currentStage) {
    case "voting":
      return (product.votes || 0) >= config.votingToComingSoonThreshold;
    case "coming-soon":
    case "community-drops":
      return true; // Admin can manually promote from these stages
    case "completed":
      return false; // Cannot promote from completed
    default:
      return false;
  }
};

export const getNextStage = (currentStage: ProductStage | undefined): ProductStage | null => {
  switch (currentStage || "voting") {
    case "voting":
      return "coming-soon";
    case "coming-soon":
      return "community-drops";
    case "community-drops":
      return "completed";
    case "completed":
      return null;
    default:
      return null;
  }
};

export const filterProductsByStage = (products: ProductWithStage[], stage: ProductStage): ProductWithStage[] => {
  return products.filter(product => (product.stage || "voting") === stage);
};

export const sortProductsByStageProgress = (products: ProductWithStage[], config: LifecycleConfig): ProductWithStage[] => {
  return products.sort((a, b) => {
    const aStage = a.stage || "voting";
    const bStage = b.stage || "voting";
    
    // First sort by stage priority
    const stagePriority: Record<ProductStage, number> = {
      "community-drops": 1,
      "coming-soon": 2,
      "voting": 3,
      "completed": 4
    };
    
    const aPriority = stagePriority[aStage];
    const bPriority = stagePriority[bStage];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same stage, sort by progress within stage
    if (aStage === "voting" && bStage === "voting") {
      return (b.votes || 0) - (a.votes || 0); // Higher votes first
    }
    
    if (aStage === "coming-soon" && bStage === "coming-soon") {
      const aDays = getDaysInStage(a.stageEnteredAt);
      const bDays = getDaysInStage(b.stageEnteredAt);
      return bDays - aDays; // Longer in stage first
    }
    
    if (aStage === "community-drops" && bStage === "community-drops") {
      const aDays = getDaysInStage(a.stageEnteredAt);
      const bDays = getDaysInStage(b.stageEnteredAt);
      return aDays - bDays; // Newer drops first
    }
    
    return 0;
  });
};
