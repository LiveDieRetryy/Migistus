// src/types/product.ts
export type PricingTier = {
  min: number;
  max: number;
  price: number;
};

export type Product = {
  id: number;
  name: string;
  image: string;
  description: string;
  goal: number;
  link: string;
  timeframe: string;
  category: string;
  votes?: number;
  featured?: boolean;
  pledges: number;
  pricingTiers?: PricingTier[];
  slug?: string;
};
