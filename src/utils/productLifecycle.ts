// Product lifecycle management utilities

export type ProductStage = "voting" | "coming-soon" | "community-drops" | "recently-completed";

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
  votingDuration: number;              // 7 days in voting
  votingEndDay: number;                // 5 = Friday (voting ends on Friday)
  comingSoonDuration: number;          // 7 days in coming soon
  communityDropsDuration: number;      // 7 days live
  dropStartDay: number;                // 5 = Friday (0 = Sunday)
  autoPromotionEnabled: boolean;
}

// Default lifecycle configuration
export const DEFAULT_LIFECYCLE_CONFIG: LifecycleConfig = {
  votingDuration: 7,
  votingEndDay: 5,                   // Friday - voting ends on Friday
  comingSoonDuration: 7,
  communityDropsDuration: 7,
  dropStartDay: 5,                   // Friday - drops launch on Friday
  autoPromotionEnabled: true
};

export const STAGE_LABELS: Record<ProductStage, string> = {
  "voting": "In Voting",
  "coming-soon": "Coming Soon",
  "community-drops": "Community Drops",
  "recently-completed": "Recently Completed"
};

export const STAGE_COLORS: Record<ProductStage, string> = {
  "voting": "bg-blue-100 text-blue-800",
  "coming-soon": "bg-yellow-100 text-yellow-800", 
  "community-drops": "bg-green-100 text-green-800",
  "recently-completed": "bg-gray-100 text-gray-800"
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
      // Voting ends on Friday - no vote threshold, top products advance
      const daysUntilVotingEnds = getNextFriday(new Date());
      const msUntilFriday = daysUntilVotingEnds.getTime() - new Date().getTime();
      const daysToFriday = Math.ceil(msUntilFriday / (1000 * 60 * 60 * 24));
      
      return {
        daysRemaining: daysToFriday,
        nextStage: "coming-soon",
        description: daysToFriday === 0 
          ? "Votes counted today!" 
          : `Votes counted in ${daysToFriday} day${daysToFriday !== 1 ? 's' : ''}`
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
        nextStage: "recently-completed",
        description: dropDaysRemaining > 0 
          ? `${dropDaysRemaining} days remaining in drop`
          : "Drop completed"
      };

    case "recently-completed":
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
      // Voting ends on Friday, top products advance regardless of vote count
      return true;
    case "coming-soon":
    case "community-drops":
      return true; // Admin can manually promote from these stages
    case "recently-completed":
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
      return "recently-completed";
    case "recently-completed":
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
      "recently-completed": 4
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

/**
 * Get the next Friday from a given date
 */
export const getNextFriday = (fromDate: Date = new Date()): Date => {
  const result = new Date(fromDate);
  const dayOfWeek = result.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  const actualDaysToAdd = daysUntilFriday === 0 ? 7 : daysUntilFriday; // If today is Friday, get next Friday
  result.setDate(result.getDate() + actualDaysToAdd);
  result.setHours(0, 0, 0, 0); // Set to midnight
  return result;
};

/**
 * Check if a product should automatically transition to the next stage
 */
export const shouldAutoTransition = (
  product: ProductWithStage,
  config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): boolean => {
  if (!config.autoPromotionEnabled) return false;
  
  const currentStage = product.stage || "voting";
  const daysInStage = getDaysInStage(product.stageEnteredAt);
  const now = new Date();

  switch (currentStage) {
    case "voting":
      // Transition after 7 days on Friday (no vote threshold)
      return daysInStage >= config.votingDuration && isFriday(now);
    
    case "coming-soon":
      // Transition after 7 days (to Friday drop)
      return daysInStage >= config.comingSoonDuration;
    
    case "community-drops":
      // Transition after 7 days in drops
      return daysInStage >= config.communityDropsDuration;
    
    case "recently-completed":
      // Never auto-transition from completed
      return false;
    
    default:
      return false;
  }
};

/**
 * Get the scheduled date when a product should transition to community drops
 * This ensures drops always start on Friday
 */
export const getScheduledDropDate = (
  comingSoonEnteredAt: string,
  config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): Date => {
  const enteredDate = new Date(comingSoonEnteredAt);
  const earliestDropDate = new Date(enteredDate);
  earliestDropDate.setDate(earliestDropDate.getDate() + config.comingSoonDuration);
  
  // Find the next Friday from the earliest drop date
  return getNextFriday(earliestDropDate);
};

/**
 * Check if today is Friday
 */
export const isFriday = (date: Date = new Date()): boolean => {
  return date.getDay() === 5;
};

/**
 * Automatically transition a product to its next stage
 */
export const transitionProductStage = (
  product: ProductWithStage,
  config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): ProductWithStage => {
  const currentStage = product.stage || "voting";
  const nextStage = getNextStage(currentStage);
  
  if (!nextStage) return product;

  const now = new Date().toISOString();
  
  // Special handling for coming-soon -> community-drops transition
  if (currentStage === "coming-soon" && nextStage === "community-drops") {
    // Only transition on Friday
    if (!isFriday()) {
      return product; // Wait until Friday
    }
  }

  return {
    ...product,
    stage: nextStage,
    stageEnteredAt: now,
    promotedAt: now,
    ...(nextStage === "recently-completed" && { completedAt: now })
  };
};

/**
 * Process all products and auto-transition where needed
 */
export const processLifecycleTransitions = (
  products: ProductWithStage[],
  config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): ProductWithStage[] => {
  return products.map(product => {
    if (shouldAutoTransition(product, config)) {
      return transitionProductStage(product, config);
    }
    return product;
  });
};

/**
 * Get products that are ready to transition but waiting for Friday
 */
export const getProductsWaitingForFriday = (
  products: ProductWithStage[],
  config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): ProductWithStage[] => {
  return products.filter(product => {
    const daysInStage = getDaysInStage(product.stageEnteredAt);
    return product.stage === "coming-soon" && 
           daysInStage >= config.comingSoonDuration &&
           !isFriday();
  });
};

/**
 * Get countdown to next Friday drop
 */
export const getDaysUntilNextFriday = (): number => {
  const now = new Date();
  const nextFriday = getNextFriday(now);
  return Math.ceil((nextFriday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Get detailed lifecycle status for a product
 */
export const getProductLifecycleStatus = (
  product: ProductWithStage,
  config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
) => {
  const currentStage = product.stage || "voting";
  const daysInStage = getDaysInStage(product.stageEnteredAt);
  const timeUntilNext = getTimeUntilNextStage(product, config);
  const readyToTransition = shouldAutoTransition(product, config);
  
  let statusMessage = "";
  let daysRemaining = 0;
  
  switch (currentStage) {
    case "voting":
      // Voting ends on Friday - top products advance
      const daysUntilVotingEnds = getNextFriday();
      const msUntilFriday = daysUntilVotingEnds.getTime() - new Date().getTime();
      const daysToVotingEnd = Math.ceil(msUntilFriday / (1000 * 60 * 60 * 24));
      daysRemaining = daysToVotingEnd;
      
      statusMessage = daysToVotingEnd === 0 
        ? "Votes counted today! Top products advance." 
        : `Votes counted in ${daysToVotingEnd} day${daysToVotingEnd !== 1 ? 's' : ''} (Friday)`;
      break;
      
    case "coming-soon":
      const comingSoonRemaining = Math.max(0, config.comingSoonDuration - daysInStage);
      daysRemaining = comingSoonRemaining;
      
      if (comingSoonRemaining > 0) {
        statusMessage = `Launching in ${comingSoonRemaining} days`;
      } else {
        const daysToFriday = getDaysUntilNextFriday();
        statusMessage = `Drops this ${daysToFriday === 0 ? 'Friday (today!)' : 'Friday'}`;
        daysRemaining = daysToFriday;
      }
      break;
      
    case "community-drops":
      const dropRemaining = Math.max(0, config.communityDropsDuration - daysInStage);
      daysRemaining = dropRemaining;
      statusMessage = dropRemaining > 0 
        ? `${dropRemaining} days left in drop` 
        : "Drop ending soon";
      break;
      
    case "recently-completed":
      statusMessage = "Completed";
      daysRemaining = 0;
      break;
  }
  
  return {
    currentStage,
    daysInStage,
    daysRemaining,
    statusMessage,
    readyToTransition,
    nextStage: timeUntilNext.nextStage,
    stageProgress: currentStage === "recently-completed" ? 100 : 
                   Math.min(100, Math.round((daysInStage / 7) * 100))
  };
};
