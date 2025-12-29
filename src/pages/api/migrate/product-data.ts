import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';

/**
 * Migration Endpoint: Product Data (Phase 4)
 * Migrates products, votes, pledges, and staff picks from file storage to database
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = {
      products: { migrated: 0, errors: 0 },
      votes: { migrated: 0, errors: 0 },
      pledges: { migrated: 0, errors: 0 },
      staffPicks: { migrated: 0, errors: 0 }
    };

    // 1. Migrate Products
    console.log('Migrating products...');
    const productsPath = path.join(process.cwd(), 'public', 'data', 'products.json');
    if (fs.existsSync(productsPath)) {
      const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
      
      for (const product of productsData) {
        try {
          // Check if product already exists by slug
          const existing = await db.getProductBySlug(product.slug);
          
          if (!existing) {
            await db.createProduct({
              name: product.name,
              slug: product.slug,
              description: product.description,
              price: product.price,
              image: product.image,
              category: product.category,
              stage: product.stage || 'voting',
              supplierId: product.supplierId || product.supplier_id,
              supplierName: product.supplierName || product.supplier_name
            });
            results.products.migrated++;
          }
        } catch (error) {
          console.error(`Error migrating product ${product.id}:`, error);
          results.products.errors++;
        }
      }
    }

    // 2. Migrate Votes
    console.log('Migrating votes...');
    const votesPath = path.join(process.cwd(), 'public', 'data', 'votes.json');
    if (fs.existsSync(votesPath)) {
      const votesData = JSON.parse(fs.readFileSync(votesPath, 'utf-8'));
      
      for (const vote of votesData) {
        try {
          // Check if vote already exists
          const existing = await db.getVote(vote.product_id || vote.productId, vote.user_id || vote.userId);
          
          if (!existing) {
            await db.createVote({
              productId: vote.product_id || vote.productId,
              userId: vote.user_id || vote.userId,
              tier: vote.tier || 'Initiate',
              value: vote.value || 1
            });
            results.votes.migrated++;
          }
        } catch (error) {
          console.error(`Error migrating vote ${vote.id}:`, error);
          results.votes.errors++;
        }
      }
    }

    // 3. Migrate Pledges
    console.log('Migrating pledges...');
    const pledgesPath = path.join(process.cwd(), 'public', 'data', 'pledges.json');
    if (fs.existsSync(pledgesPath)) {
      let pledgesData = JSON.parse(fs.readFileSync(pledgesPath, 'utf-8'));
      
      // Handle both array and object formats
      if (pledgesData.pledges) {
        pledgesData = pledgesData.pledges;
      }
      
      for (const pledge of pledgesData) {
        try {
          // Check if pledge already exists
          const existing = await db.getPledge(pledge.product_id || pledge.productId, pledge.user_id || pledge.userId);
          
          if (!existing) {
            await db.createPledge({
              productId: pledge.product_id || pledge.productId,
              userId: pledge.user_id || pledge.userId,
              tierId: pledge.tier_id || pledge.tierId || 1,
              quantity: pledge.quantity || 1
            });
            results.pledges.migrated++;
          }
        } catch (error) {
          console.error(`Error migrating pledge ${pledge.id}:`, error);
          results.pledges.errors++;
        }
      }
    }

    // 4. Migrate Staff Picks
    console.log('Migrating staff picks...');
    const staffPicksPath = path.join(process.cwd(), 'public', 'data', 'staff-picks.json');
    if (fs.existsSync(staffPicksPath)) {
      const staffPicksData = JSON.parse(fs.readFileSync(staffPicksPath, 'utf-8'));
      
      for (const staffPick of staffPicksData) {
        try {
          if (staffPick.is_staff_pick !== false) {
            await db.createStaffPick({
              productId: staffPick.product_id || staffPick.productId,
              reason: staffPick.reason || 'Featured by staff',
              featuredUntil: staffPick.featured_until || staffPick.drop_end_date || null
            });
            results.staffPicks.migrated++;
          }
        } catch (error) {
          console.error(`Error migrating staff pick ${staffPick.id}:`, error);
          results.staffPicks.errors++;
        }
      }
    }

    console.log('Migration complete:', results);

    return res.status(200).json({
      success: true,
      message: 'Product data migration completed',
      results
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Migration failed'
    });
  }
}
