/**
 * Product Storage V2 - Dual-mode storage for products, votes, pledges, and staff picks
 * Automatically switches between localStorage (development) and database (production)
 */

import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const USE_DATABASE = process.env.NEXT_PUBLIC_USE_DATABASE === 'true' || 
                     process.env.VERCEL_ENV === 'production' ||
                     process.env.NODE_ENV === 'production';

// ============================================================================
// DATABASE STORAGE
// ============================================================================

class DatabaseProductStorage {
  // Products
  async createProduct(data: {
    name: string;
    slug: string;
    description?: string;
    price?: number;
    image?: string;
    category?: string;
    stage?: string;
    supplierId?: number;
    supplierName?: string;
  }) {
    return await db.createProduct(data);
  }

  async getProduct(id: number) {
    return await db.getProduct(id);
  }

  async getProductBySlug(slug: string) {
    return await db.getProductBySlug(slug);
  }

  async getProducts(filters?: { stage?: string; category?: string; featured?: boolean }) {
    let products = await db.getProducts();
    
    // Apply filters if provided
    if (filters) {
      if (filters.stage) {
        products = products.filter((p: any) => p.stage === filters.stage);
      }
      if (filters.category) {
        products = products.filter((p: any) => p.category === filters.category);
      }
      if (filters.featured !== undefined) {
        products = products.filter((p: any) => p.featured === filters.featured);
      }
    }
    
    return products;
  }

  async updateProduct(id: number, data: any) {
    return await db.updateProduct(id, data);
  }

  async deleteProduct(id: number) {
    return await db.deleteProduct(id);
  }

  // Votes
  async createVote(data: { productId: number; userId: number; tier: string; value?: number }) {
    return await db.createVote({ ...data, value: data.value || 1 });
  }

  async getVote(productId: number, userId: number) {
    return await db.getVote(productId, userId);
  }

  async getAllVotes() {
    return await db.getVotes();
  }

  async getProductVotes(productId: number) {
    return await db.getProductVotes(productId);
  }

  async getUserVotes(userId: number) {
    return await db.getUserVotes(userId);
  }

  async getProductVoteCount(productId: number) {
    return await db.getProductVoteCount(productId);
  }

  async hasUserVotedToday(userId: number, productId: number) {
    return await db.hasUserVotedToday(userId, productId);
  }

  async deleteVote(productId: number, userId: number) {
    return await db.deleteVote(productId, userId);
  }

  // Pledges
  async createPledge(data: { productId: number; userId: number; tierId?: number; quantity?: number }) {
    return await db.createPledge({ 
      productId: data.productId, 
      userId: data.userId, 
      tierId: data.tierId || 1,
      quantity: data.quantity || 1 
    });
  }

  async getPledge(productId: number, userId: number) {
    return await db.getPledge(productId, userId);
  }

  async getProductPledges(productId: number) {
    return await db.getProductPledges(productId);
  }

  async getUserPledges(userId: number) {
    return await db.getUserPledges(userId);
  }

  async getProductPledgeCount(productId: number) {
    return await db.getProductPledgeCount(productId);
  }

  async updatePledge(productId: number, userId: number, quantity: number) {
    return await db.updatePledge(productId, userId, quantity);
  }

  async deletePledge(productId: number, userId: number) {
    return await db.deletePledge(productId, userId);
  }

  // Staff Picks
  async createStaffPick(data: {
    productId: number;
    dropStartDate?: Date;
    dropEndDate?: Date;
    supplierPayment?: number;
    expectedRevenue?: number;
  }) {
    return await db.createStaffPick(data);
  }

  async getStaffPick(productId: number) {
    return await db.getStaffPick(productId);
  }

  async getAllStaffPicks() {
    return await db.getAllStaffPicks();
  }

  async removeStaffPick(productId: number) {
    return await db.removeStaffPick(productId);
  }

  async updateStaffPick(productId: number, data: any) {
    return await db.updateStaffPick(productId, data);
  }
}

// ============================================================================
// FILE STORAGE (Development fallback)
// ============================================================================

class FileProductStorage {
  private productsPath = path.join(process.cwd(), 'public', 'data', 'products.json');
  private votesPath = path.join(process.cwd(), 'public', 'data', 'votes.json');
  private pledgesPath = path.join(process.cwd(), 'public', 'data', 'pledges.json');
  private staffPicksPath = path.join(process.cwd(), 'public', 'data', 'staff-picks.json');

  private readJsonFile(filePath: string): any[] {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
    }
    return [];
  }

  private writeJsonFile(filePath: string, data: any[]): void {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
    }
  }

  // Products
  async createProduct(data: any) {
    const products = this.readJsonFile(this.productsPath);
    const newProduct = {
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stage_entered_at: new Date().toISOString()
    };
    products.push(newProduct);
    this.writeJsonFile(this.productsPath, products);
    return newProduct;
  }

  async getProduct(id: number) {
    const products = this.readJsonFile(this.productsPath);
    return products.find(p => p.id === id) || null;
  }

  async getProductBySlug(slug: string) {
    const products = this.readJsonFile(this.productsPath);
    return products.find(p => p.slug === slug) || null;
  }

  async getProducts(filters?: { stage?: string; category?: string; featured?: boolean }) {
    let products = this.readJsonFile(this.productsPath);
    
    if (filters?.stage) {
      products = products.filter(p => p.stage === filters.stage);
    }
    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters?.featured !== undefined) {
      products = products.filter(p => p.featured === filters.featured);
    }
    
    return products;
  }

  async updateProduct(id: number, data: any) {
    const products = this.readJsonFile(this.productsPath);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    products[index] = {
      ...products[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    if (data.stage && data.stage !== products[index].stage) {
      products[index].stage_entered_at = new Date().toISOString();
    }
    
    this.writeJsonFile(this.productsPath, products);
    return products[index];
  }

  async deleteProduct(id: number) {
    const products = this.readJsonFile(this.productsPath);
    const filtered = products.filter(p => p.id !== id);
    this.writeJsonFile(this.productsPath, filtered);
  }

  // Votes
  async createVote(data: { productId: number; userId: number; tier: string; value?: number }) {
    const votes = this.readJsonFile(this.votesPath);
    const newVote = {
      id: votes.length > 0 ? Math.max(...votes.map(v => v.id)) + 1 : 1,
      product_id: data.productId,
      user_id: data.userId,
      tier: data.tier,
      value: data.value || 1,
      timestamp: new Date().toISOString()
    };
    votes.push(newVote);
    this.writeJsonFile(this.votesPath, votes);
    return newVote;
  }

  async getVote(productId: number, userId: number) {
    const votes = this.readJsonFile(this.votesPath);
    const userVotes = votes.filter(v => v.product_id === productId && v.user_id === userId);
    return userVotes.length > 0 ? userVotes[userVotes.length - 1] : null;
  }

  async getAllVotes() {
    const votes = this.readJsonFile(this.votesPath);
    return votes;
  }

  async getProductVotes(productId: number) {
    const votes = this.readJsonFile(this.votesPath);
    return votes.filter(v => v.product_id === productId);
  }

  async getUserVotes(userId: number) {
    const votes = this.readJsonFile(this.votesPath);
    const products = this.readJsonFile(this.productsPath);
    
    return votes
      .filter(v => v.user_id === userId)
      .map(v => {
        const product = products.find(p => p.id === v.product_id);
        return {
          ...v,
          product_name: product?.name,
          product_slug: product?.slug
        };
      });
  }

  async getProductVoteCount(productId: number) {
    const votes = this.readJsonFile(this.votesPath);
    const productVotes = votes.filter(v => v.product_id === productId);
    
    return {
      count: productVotes.length,
      total: productVotes.reduce((sum, v) => sum + (v.value || 1), 0)
    };
  }

  async hasUserVotedToday(userId: number, productId: number) {
    const votes = this.readJsonFile(this.votesPath);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return votes.some(v => 
      v.user_id === userId && 
      v.product_id === productId && 
      new Date(v.timestamp) >= today
    );
  }

  async deleteVote(productId: number, userId: number) {
    const votes = this.readJsonFile(this.votesPath);
    const filtered = votes.filter(v => !(v.product_id === productId && v.user_id === userId));
    this.writeJsonFile(this.votesPath, filtered);
  }

  // Pledges
  async createPledge(data: { productId: number; userId: number; quantity?: number }) {
    const pledges = this.readJsonFile(this.pledgesPath);
    const newPledge = {
      id: pledges.length > 0 ? Math.max(...pledges.map(p => p.id)) + 1 : 1,
      product_id: data.productId,
      user_id: data.userId,
      quantity: data.quantity || 1,
      timestamp: new Date().toISOString()
    };
    pledges.push(newPledge);
    this.writeJsonFile(this.pledgesPath, pledges);
    return newPledge;
  }

  async getPledge(productId: number, userId: number) {
    const pledges = this.readJsonFile(this.pledgesPath);
    const userPledges = pledges.filter(p => p.product_id === productId && p.user_id === userId);
    return userPledges.length > 0 ? userPledges[userPledges.length - 1] : null;
  }

  async getProductPledges(productId: number) {
    const pledges = this.readJsonFile(this.pledgesPath);
    return pledges.filter(p => p.product_id === productId);
  }

  async getUserPledges(userId: number) {
    const pledges = this.readJsonFile(this.pledgesPath);
    const products = this.readJsonFile(this.productsPath);
    
    return pledges
      .filter(p => p.user_id === userId)
      .map(p => {
        const product = products.find(pr => pr.id === p.product_id);
        return {
          ...p,
          product_name: product?.name,
          product_slug: product?.slug,
          product_image: product?.image
        };
      });
  }

  async getProductPledgeCount(productId: number) {
    const pledges = this.readJsonFile(this.pledgesPath);
    const productPledges = pledges.filter(p => p.product_id === productId);
    
    return {
      count: productPledges.length,
      total: productPledges.reduce((sum, p) => sum + (p.quantity || 1), 0)
    };
  }

  async updatePledge(productId: number, userId: number, quantity: number) {
    const pledges = this.readJsonFile(this.pledgesPath);
    const index = pledges.findIndex(p => p.product_id === productId && p.user_id === userId);
    
    if (index === -1) return null;
    
    pledges[index].quantity = quantity;
    this.writeJsonFile(this.pledgesPath, pledges);
    return pledges[index];
  }

  async deletePledge(productId: number, userId: number) {
    const pledges = this.readJsonFile(this.pledgesPath);
    const filtered = pledges.filter(p => !(p.product_id === productId && p.user_id === userId));
    this.writeJsonFile(this.pledgesPath, filtered);
  }

  // Staff Picks
  async createStaffPick(data: {
    productId: number;
    dropStartDate?: Date;
    dropEndDate?: Date;
    supplierPayment?: number;
    expectedRevenue?: number;
  }) {
    const staffPicks = this.readJsonFile(this.staffPicksPath);
    const existingIndex = staffPicks.findIndex(sp => sp.product_id === data.productId);
    
    const staffPick = {
      id: existingIndex >= 0 ? staffPicks[existingIndex].id : (staffPicks.length > 0 ? Math.max(...staffPicks.map(sp => sp.id)) + 1 : 1),
      product_id: data.productId,
      is_staff_pick: true,
      pick_date: new Date().toISOString(),
      drop_start_date: data.dropStartDate?.toISOString() || null,
      drop_end_date: data.dropEndDate?.toISOString() || null,
      supplier_payment: data.supplierPayment || null,
      expected_revenue: data.expectedRevenue || null,
      created_at: existingIndex >= 0 ? staffPicks[existingIndex].created_at : new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      staffPicks[existingIndex] = staffPick;
    } else {
      staffPicks.push(staffPick);
    }
    
    this.writeJsonFile(this.staffPicksPath, staffPicks);
    return staffPick;
  }

  async getStaffPick(productId: number) {
    const staffPicks = this.readJsonFile(this.staffPicksPath);
    const products = this.readJsonFile(this.productsPath);
    
    const staffPick = staffPicks.find(sp => sp.product_id === productId && sp.is_staff_pick);
    if (!staffPick) return null;
    
    const product = products.find(p => p.id === productId);
    return {
      ...staffPick,
      product_name: product?.name,
      product_slug: product?.slug,
      product_image: product?.image
    };
  }

  async getAllStaffPicks() {
    const staffPicks = this.readJsonFile(this.staffPicksPath);
    const products = this.readJsonFile(this.productsPath);
    
    return staffPicks
      .filter(sp => sp.is_staff_pick)
      .map(sp => {
        const product = products.find(p => p.id === sp.product_id);
        return {
          ...sp,
          product_name: product?.name,
          product_slug: product?.slug,
          product_image: product?.image,
          description: product?.description
        };
      });
  }

  async removeStaffPick(productId: number) {
    const staffPicks = this.readJsonFile(this.staffPicksPath);
    const index = staffPicks.findIndex(sp => sp.product_id === productId);
    
    if (index >= 0) {
      staffPicks[index].is_staff_pick = false;
      this.writeJsonFile(this.staffPicksPath, staffPicks);
    }
  }

  async updateStaffPick(productId: number, data: any) {
    const staffPicks = this.readJsonFile(this.staffPicksPath);
    const index = staffPicks.findIndex(sp => sp.product_id === productId);
    
    if (index === -1) return null;
    
    staffPicks[index] = {
      ...staffPicks[index],
      ...data
    };
    
    this.writeJsonFile(this.staffPicksPath, staffPicks);
    return staffPicks[index];
  }
}

// ============================================================================
// EXPORT UNIFIED INTERFACE
// ============================================================================

const databaseStorage = new DatabaseProductStorage();
const fileStorage = new FileProductStorage();

export const productStorage = USE_DATABASE ? databaseStorage : fileStorage;

export const getStorageMode = () => USE_DATABASE ? 'database' : 'file';
