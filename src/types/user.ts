export interface UserProfile {
  // Basic Information
  id: number;
  username: string;
  email: string;
  displayName?: string;
  bio: string;
  avatar: string | null;
  banner: string | null;
  location?: string;
  website?: string;
  birthDate?: string;
  pronouns?: string;
  
  // Membership & Status
  tier: 'Initiate' | 'Guild' | 'MIGISTUS' | 'Legendary' | 'Supreme';
  joinedDate: string;
  lastActiveDate: string;
  isVerified: boolean;
  isInfluencer: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  membershipExpiry?: string;
  
  // Financial Information
  walletBalance: number;
  guildCoins: number;
  lifetimeSpent: number;
  lifetimeSaved: number;
  creditScore: number;
  
  // Social Features
  followers: number;
  following: number;
  friends: number;
  reputation: number;
  trustScore: number;
  
  // Activity Statistics
  stats: UserStats;
  
  // Gamification
  level: number;
  experience: number;
  experienceToNext: number;
  achievements: Achievement[];
  badges: Badge[];
  titles: Title[];
  currentTitle?: string;
  streaks: Streak[];
  
  // Preferences & Settings
  preferences: UserPreferences;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  
  // Social Links
  socialLinks: SocialLink[];
  
  // Collections & Interests
  favoriteCategories: string[];
  wishlist: WishlistItem[];
  collections: Collection[];
  
  // Interaction History
  recentActivity: Activity[];
  pledgeHistory: PledgeRecord[];
  voteHistory: VoteRecord[];
  reviewHistory: ReviewRecord[];
  referralHistory: ReferralRecord[];
  
  // Advanced Analytics
  analytics: UserAnalytics;
  
  // Moderation & Safety
  warningCount: number;
  moderationHistory: ModerationRecord[];
  reportHistory: ReportRecord[];
  restrictionHistory: RestrictionRecord[];
}

export interface UserStats {
  totalPledges: number;
  totalVotes: number;
  dropsJoined: number;
  followers: number;
  following: number;
  profileViews: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  category: string;
  unlockedDate: string;
  progress?: number;
  maxProgress?: number;
  rewards?: Reward[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedDate: string;
  category: 'Activity' | 'Social' | 'Achievement' | 'Special' | 'Seasonal';
}

export interface Title {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  requirements: string;
  earnedDate: string;
  isRare: boolean;
}

export interface Streak {
  type: 'daily_login' | 'weekly_pledge' | 'monthly_vote' | 'review_streak';
  current: number;
  best: number;
  lastUpdated: string;
  rewards?: Reward[];
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  currency: string;
  timezone: string;
  displayName: 'username' | 'real_name' | 'both';
  showOnlineStatus: boolean;
  showActivity: boolean;
  allowMessages: 'everyone' | 'friends' | 'none';
  allowInvites: boolean;
  emailDigest: 'daily' | 'weekly' | 'monthly' | 'none';
  defaultPrivacy: 'public' | 'friends' | 'private';
  agreeToMarketing: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showRealName: boolean;
  showEmail: boolean;
  showLocation: boolean;
  showWallet: boolean;
  showStats: boolean;
  showActivity: boolean;
  showFollowers: boolean;
  showCollections: boolean;
  allowSearch: boolean;
  allowRecommendations: boolean;
}

export interface NotificationSettings {
  email: {
    newFollower: boolean;
    pledgeUpdates: boolean;
    dropReminders: boolean;
    achievements: boolean;
    messages: boolean;
    weeklyDigest: boolean;
  };
  push: {
    newFollower: boolean;
    pledgeUpdates: boolean;
    dropReminders: boolean;
    achievements: boolean;
    messages: boolean;
  };
  inApp: {
    newFollower: boolean;
    pledgeUpdates: boolean;
    dropReminders: boolean;
    achievements: boolean;
    messages: boolean;
    comments: boolean;
    mentions: boolean;
  };
}

export interface SocialLink {
  platform: string;
  username: string;
  url: string;
  verified: boolean;
}

export interface WishlistItem {
  id: string;
  productId: number;
  productName: string;
  productImage: string;
  addedDate: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  image?: string;
  items: CollectionItem[];
  isPublic: boolean;
  createdDate: string;
  updatedDate: string;
  tags: string[];
}

export interface CollectionItem {
  productId: number;
  productName: string;
  productImage: string;
  addedDate: string;
  notes?: string;
}

export interface Activity {
  id: string;
  type: 'pledge' | 'vote' | 'review' | 'follow' | 'achievement' | 'badge' | 'level_up' | 'purchase' | 'referral';
  description: string;
  timestamp: string;
  data?: any;
  visibility: 'public' | 'friends' | 'private';
}

export interface PledgeRecord {
  id: string;
  productId: number;
  productName: string;
  amount: number;
  status: 'active' | 'completed' | 'cancelled' | 'refunded';
  pledgeDate: string;
  completionDate?: string;
  tier: string;
  savings: number;
}

export interface VoteRecord {
  id: string;
  productId: number;
  productName: string;
  voteType: 'upvote' | 'downvote';
  weight: number;
  timestamp: string;
  category: string;
}

export interface ReviewRecord {
  id: string;
  productId: number;
  productName: string;
  rating: number;
  review: string;
  helpful: number;
  verified: boolean;
  reviewDate: string;
}

export interface ReferralRecord {
  id: string;
  referredUserId: number;
  referredUsername: string;
  status: 'pending' | 'completed' | 'rewarded';
  referralDate: string;
  reward?: Reward;
}

export interface UserAnalytics {
  // Engagement Metrics
  sessionDuration: number;
  pageViews: number;
  clickthroughRate: number;
  engagementScore: number;
  
  // Behavioral Patterns
  mostActiveHours: number[];
  mostActiveDays: string[];
  deviceUsage: DeviceUsage[];
  
  // Interaction Patterns
  categoryPreferences: CategoryPreference[];
  priceRangePreferences: PriceRange[];
  brandPreferences: BrandPreference[];
  
  // Social Metrics
  influenceScore: number;
  communityRank: number;
  mentorshipRating: number;
  
  // Financial Metrics
  averagePledgeAmount: number;
  savingsRate: number;
  roi: number;
  
  // Predictive Analytics
  churnRisk: number;
  lifetimeValue: number;
  nextPurchaseProbability: number;
  recommendedProducts: RecommendedProduct[];
}

export interface DeviceUsage {
  device: string;
  percentage: number;
  lastUsed: string;
}

export interface CategoryPreference {
  category: string;
  score: number;
  interactions: number;
}

export interface PriceRange {
  min: number;
  max: number;
  frequency: number;
}

export interface BrandPreference {
  brand: string;
  score: number;
  purchases: number;
}

export interface RecommendedProduct {
  productId: number;
  productName: string;
  score: number;
  reason: string;
}

export interface ModerationRecord {
  id: string;
  type: 'warning' | 'mute' | 'ban' | 'restriction';
  reason: string;
  moderatorId: number;
  date: string;
  duration?: string;
  resolved: boolean;
}

export interface ReportRecord {
  id: string;
  reportedUserId: number;
  reportedUsername: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reportDate: string;
}

export interface RestrictionRecord {
  id: string;
  type: 'chat' | 'pledge' | 'vote' | 'review' | 'social';
  reason: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface Reward {
  type: 'coins' | 'badge' | 'title' | 'discount' | 'early_access' | 'exclusive_content';
  value: number | string;
  description: string;
}

// Enhanced User Registration Types
export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  state?: string;
  city?: string;
  phoneNumber?: string;
  referralSource?: string;
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
}

export interface UserProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  state?: string;
  city?: string;
  phoneNumber?: string;
  referralSource?: string;
  avatar?: string;
  bio: string;
  joinedDate: string;
}

export interface EnhancedUser {
  id: number;
  username: string;
  email: string;
  profile: UserProfileData;
  preferences: UserPreferences;
  tier: string;
  banned: boolean;
  verified: boolean;
  stats: UserStats;
  guildTokens: number;
  createdAt: string;
  lastLogin?: string;
  loginCount: number;
}

// Legacy interface for backward compatibility
