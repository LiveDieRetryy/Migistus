import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

/**
 * E-Commerce Data Migration Endpoint
 * 
 * Migrates supplier applications, reviews, and orders from localStorage/files to database.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionFromRequest(req);

  if (!session || !session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.userId;

  try {
    const { supplierApplications, reviews, orders } = req.body;

    let migratedApplications = 0;
    let migratedReviews = 0;
    let migratedOrders = 0;
    const errors: string[] = [];

    // Migrate supplier applications
    if (supplierApplications && Array.isArray(supplierApplications)) {
      for (const app of supplierApplications) {
        try {
          if (app.userId !== userId) continue;

          await db.createSupplierApplication(userId, {
            companyName: app.companyName,
            email: app.email,
            phone: app.phone,
            website: app.website,
            description: app.description,
            productCategories: app.productCategories,
            certifications: app.certifications
          });

          migratedApplications++;
        } catch (error) {
          console.error('Error migrating application:', error);
          errors.push(`Application migration failed: ${app.id || 'unknown'}`);
        }
      }
    }

    // Migrate reviews
    if (reviews && Array.isArray(reviews)) {
      for (const review of reviews) {
        try {
          if (review.userId !== userId) continue;

          await db.createProductReview(review.productId, userId, {
            rating: review.rating,
            title: review.title,
            content: review.content || review.text,
            images: review.images,
            verifiedPurchase: review.verifiedPurchase
          });

          migratedReviews++;
        } catch (error) {
          console.error('Error migrating review:', error);
          errors.push(`Review migration failed: ${review.id || 'unknown'}`);
        }
      }
    }

    // Migrate orders
    if (orders && Array.isArray(orders)) {
      for (const order of orders) {
        try {
          if (order.userId !== userId) continue;

          await db.createOrder(userId, {
            orderNumber: order.orderNumber || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            totalAmount: order.totalAmount || order.total,
            currency: order.currency,
            paymentMethod: order.paymentMethod,
            shippingAddress: order.shippingAddress,
            billingAddress: order.billingAddress,
            items: order.items || [],
            notes: order.notes
          });

          migratedOrders++;
        } catch (error) {
          console.error('Error migrating order:', error);
          errors.push(`Order migration failed: ${order.id || 'unknown'}`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'E-commerce data migration completed',
      migrated: {
        supplierApplications: migratedApplications,
        reviews: migratedReviews,
        orders: migratedOrders
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
