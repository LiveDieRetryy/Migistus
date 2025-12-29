import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';
import { sql } from '@vercel/postgres';

const DATA_DIR = path.join(process.cwd(), 'data', 'payments');

async function readJsonFile(filename: string) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSessionFromRequest(req);
    
    // Only master tier can run migrations
    if (!session || session.tier !== 'master') {
      return res.status(403).json({ error: 'Forbidden - Master tier required' });
    }

    const stats = {
      paymentMethods: 0,
      transactions: 0,
      subscriptions: 0,
      invoices: 0,
      payouts: 0,
      wallets: 0,
      walletTransactions: 0,
      refunds: 0,
      errors: [] as string[]
    };

    // Migrate payment methods
    try {
      const methods = await readJsonFile('payment_methods.json');
      for (const method of methods) {
        try {
          await sql`
            INSERT INTO payment_methods (
              id, user_id, type, provider, last4, expiry_month, expiry_year,
              is_default, token, is_active, created_at, updated_at
            ) VALUES (
              ${method.id}, ${method.userId}, ${method.type}, ${method.provider},
              ${method.last4}, ${method.expiryMonth}, ${method.expiryYear},
              ${method.isDefault}, ${method.token}, ${method.isActive},
              ${method.createdAt}, ${method.updatedAt}
            )
            ON CONFLICT (id) DO UPDATE SET
              is_default = EXCLUDED.is_default,
              is_active = EXCLUDED.is_active,
              updated_at = EXCLUDED.updated_at
          `;
          stats.paymentMethods++;
        } catch (error: any) {
          if (stats.errors.length < 10) {
            stats.errors.push(`Payment method ${method.id}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      stats.errors.push(`Payment methods file: ${error.message}`);
    }

    // Migrate transactions
    try {
      const transactions = await readJsonFile('transactions.json');
      for (const transaction of transactions) {
        try {
          await sql`
            INSERT INTO transactions (
              id, user_id, type, amount, currency, status, payment_method_id,
              order_id, description, metadata, created_at, updated_at
            ) VALUES (
              ${transaction.id}, ${transaction.userId}, ${transaction.type},
              ${transaction.amount}, ${transaction.currency}, ${transaction.status},
              ${transaction.paymentMethodId}, ${transaction.orderId},
              ${transaction.description}, ${JSON.stringify(transaction.metadata)},
              ${transaction.createdAt}, ${transaction.updatedAt}
            )
            ON CONFLICT (id) DO NOTHING
          `;
          stats.transactions++;
        } catch (error: any) {
          if (stats.errors.length < 10) {
            stats.errors.push(`Transaction ${transaction.id}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      stats.errors.push(`Transactions file: ${error.message}`);
    }

    // Migrate subscriptions
    try {
      const subscriptions = await readJsonFile('subscriptions.json');
      for (const subscription of subscriptions) {
        try {
          await sql`
            INSERT INTO subscriptions (
              id, user_id, plan_id, status, current_period_start,
              current_period_end, cancel_at_period_end, canceled_at,
              created_at, updated_at
            ) VALUES (
              ${subscription.id}, ${subscription.userId}, ${subscription.planId},
              ${subscription.status}, ${subscription.currentPeriodStart},
              ${subscription.currentPeriodEnd}, ${subscription.cancelAtPeriodEnd},
              ${subscription.canceledAt}, ${subscription.createdAt}, ${subscription.updatedAt}
            )
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              current_period_start = EXCLUDED.current_period_start,
              current_period_end = EXCLUDED.current_period_end,
              cancel_at_period_end = EXCLUDED.cancel_at_period_end,
              canceled_at = EXCLUDED.canceled_at,
              updated_at = EXCLUDED.updated_at
          `;
          stats.subscriptions++;
        } catch (error: any) {
          if (stats.errors.length < 10) {
            stats.errors.push(`Subscription ${subscription.id}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      stats.errors.push(`Subscriptions file: ${error.message}`);
    }

    // Migrate invoices
    try {
      const invoices = await readJsonFile('invoices.json');
      for (const invoice of invoices) {
        try {
          await sql`
            INSERT INTO invoices (
              id, user_id, subscription_id, order_id, amount, currency,
              status, due_date, items, paid_at, created_at, updated_at
            ) VALUES (
              ${invoice.id}, ${invoice.userId}, ${invoice.subscriptionId},
              ${invoice.orderId}, ${invoice.amount}, ${invoice.currency},
              ${invoice.status}, ${invoice.dueDate}, ${JSON.stringify(invoice.items)},
              ${invoice.paidAt}, ${invoice.createdAt}, ${invoice.updatedAt}
            )
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              paid_at = EXCLUDED.paid_at,
              updated_at = EXCLUDED.updated_at
          `;
          stats.invoices++;
        } catch (error: any) {
          if (stats.errors.length < 10) {
            stats.errors.push(`Invoice ${invoice.id}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      stats.errors.push(`Invoices file: ${error.message}`);
    }

    // Migrate payouts
    try {
      const payouts = await readJsonFile('payouts.json');
      for (const payout of payouts) {
        try {
          await sql`
            INSERT INTO payouts (
              id, user_id, amount, currency, status, method, destination,
              processed_at, created_at, updated_at
            ) VALUES (
              ${payout.id}, ${payout.userId}, ${payout.amount}, ${payout.currency},
              ${payout.status}, ${payout.method}, ${payout.destination},
              ${payout.processedAt}, ${payout.createdAt}, ${payout.updatedAt}
            )
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              processed_at = EXCLUDED.processed_at,
              updated_at = EXCLUDED.updated_at
          `;
          stats.payouts++;
        } catch (error: any) {
          if (stats.errors.length < 10) {
            stats.errors.push(`Payout ${payout.id}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      stats.errors.push(`Payouts file: ${error.message}`);
    }

    // Migrate wallets
    try {
      const wallets = await readJsonFile('wallets.json');
      for (const wallet of wallets) {
        try {
          await sql`
            INSERT INTO wallets (
              id, user_id, balance, currency, created_at, updated_at
            ) VALUES (
              ${wallet.id}, ${wallet.userId}, ${wallet.balance},
              ${wallet.currency}, ${wallet.createdAt}, ${wallet.updatedAt}
            )
            ON CONFLICT (id) DO UPDATE SET
              balance = EXCLUDED.balance,
              updated_at = EXCLUDED.updated_at
          `;
          stats.wallets++;
        } catch (error: any) {
          if (stats.errors.length < 10) {
            stats.errors.push(`Wallet ${wallet.id}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      stats.errors.push(`Wallets file: ${error.message}`);
    }

    // Migrate wallet transactions
    try {
      const walletTransactions = await readJsonFile('wallet_transactions.json');
      for (const transaction of walletTransactions) {
        try {
          await sql`
            INSERT INTO wallet_transactions (
              id, wallet_id, amount, type, balance_after, description, created_at
            ) VALUES (
              ${transaction.id}, ${transaction.walletId}, ${transaction.amount},
              ${transaction.type}, ${transaction.balanceAfter}, ${transaction.description},
              ${transaction.createdAt}
            )
            ON CONFLICT (id) DO NOTHING
          `;
          stats.walletTransactions++;
        } catch (error: any) {
          if (stats.errors.length < 10) {
            stats.errors.push(`Wallet transaction ${transaction.id}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      stats.errors.push(`Wallet transactions file: ${error.message}`);
    }

    // Migrate refunds
    try {
      const refunds = await readJsonFile('refunds.json');
      for (const refund of refunds) {
        try {
          await sql`
            INSERT INTO refunds (
              id, transaction_id, amount, reason, status, processed_at,
              created_at, updated_at
            ) VALUES (
              ${refund.id}, ${refund.transactionId}, ${refund.amount},
              ${refund.reason}, ${refund.status}, ${refund.processedAt},
              ${refund.createdAt}, ${refund.updatedAt}
            )
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              processed_at = EXCLUDED.processed_at,
              updated_at = EXCLUDED.updated_at
          `;
          stats.refunds++;
        } catch (error: any) {
          if (stats.errors.length < 10) {
            stats.errors.push(`Refund ${refund.id}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      stats.errors.push(`Refunds file: ${error.message}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment data migration completed',
      stats
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Migration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
