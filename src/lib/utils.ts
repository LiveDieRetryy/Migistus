import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a clean URL-friendly slug from a product name.
 * Example: "Bluetooth Earbuds Pro!" => "bluetooth-earbuds-pro"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");
}

/**
 * Product structure for MIGISTUS drops:
 * {
 *   id: number;
 *   name: string;
 *   image: string;
 *   description: string;
 *   goal: number;
 *   link: string;
 *   timeframe: string;
 *   category: string;
 *   votes?: number;         // optional, for voting
 *   featured?: boolean;     // optional, for staff pick
 *   pledges: number;
 *   pricingTiers?: { min: number; max: number; price: number }[];
 *   slug?: string;          // optional, for URL routing
 * }
 */

/**
 * ProductFormData model for creating/editing a product (slug is auto-generated):
 * {
 *   name: string;
 *   image: string;
 *   description: string;
 *   goal: number;
 *   link: string;
 *   timeframe: string;
 *   category: string;
 *   pricingTiers?: { min: number; max: number; price: number }[];
 * }
 */