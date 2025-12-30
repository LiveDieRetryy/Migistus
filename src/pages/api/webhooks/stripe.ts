import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Disable body parsing for webhooks (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ error: 'No signature provided' });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ 
        error: 'Webhook signature verification failed',
        details: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    console.log('✅ Webhook verified:', event.type);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Extract metadata
        const userId = parseInt(paymentIntent.metadata.userId);
        const amount = paymentIntent.amount / 100; // Convert from cents
        const type = paymentIntent.metadata.type || 'wallet_deposit';

        console.log(`💰 Payment succeeded: $${amount} for user ${userId}`);

        // Credit user's wallet
        if (type === 'wallet_deposit' && userId) {
          try {
            await db.addWalletTransaction({
              userId,
              amount,
              type: 'deposit',
              description: `Stripe payment - ${paymentIntent.id}`,
              metadata: {
                paymentIntentId: paymentIntent.id,
                paymentMethod: paymentIntent.payment_method,
                stripeChargeId: paymentIntent.latest_charge,
              }
            });

            console.log(`✅ Wallet credited for user ${userId}`);
          } catch (dbError) {
            console.error('Failed to credit wallet:', dbError);
            // Don't return error to Stripe - we received the payment
            // Log this for manual reconciliation
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('❌ Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        const refundAmount = charge.amount_refunded / 100;

        console.log(`💸 Refund processed: $${refundAmount} for payment ${paymentIntentId}`);

        // Handle refund - deduct from wallet
        // You may want to implement additional logic here
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = parseInt(subscription.metadata.userId);
        const tier = subscription.metadata.tier; // 'guild' or 'elite'
        const status = subscription.status;

        console.log(`🔔 Subscription ${event.type}: User ${userId}, Tier: ${tier}, Status: ${status}`);

        if (!userId) {
          console.error('No userId in subscription metadata');
          break;
        }

        try {
          // Map subscription tier to user tier
          let userTier: 'Initiate' | 'Guild' | 'MIGISTUS';
          if (status === 'active' || status === 'trialing') {
            userTier = tier === 'elite' ? 'MIGISTUS' : tier === 'guild' ? 'Guild' : 'Initiate';
          } else {
            // If subscription is not active (canceled, past_due, etc.), downgrade to Initiate
            userTier = 'Initiate';
          }

          // Update user's tier and subscription info
          const periodEnd = (subscription as any).current_period_end;
          await db.updateUser(userId, {
            tier: userTier,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: status,
            subscriptionCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          });

          console.log(`✅ Updated user ${userId} tier to ${userTier} (subscription ${subscription.id})`);
        } catch (dbError) {
          console.error('Failed to update user subscription:', dbError);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = parseInt(subscription.metadata.userId);

        console.log(`🗑️ Subscription deleted: User ${userId}`);

        if (!userId) {
          console.error('No userId in subscription metadata');
          break;
        }

        try {
          // Downgrade user to Initiate tier
          await db.updateUser(userId, {
            tier: 'Initiate',
            stripeSubscriptionId: null,
            stripeSubscriptionStatus: 'canceled',
            subscriptionCurrentPeriodEnd: null,
          });

          console.log(`✅ Downgraded user ${userId} to Initiate tier`);
        } catch (dbError) {
          console.error('Failed to downgrade user:', dbError);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = (invoice as any).subscription;
        const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id;

        if (subscriptionId) {
          console.log(`💳 Invoice paid for subscription ${subscriptionId}`);
          // Additional logic for successful recurring payments can go here
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = (invoice as any).subscription;
        const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id;

        if (subscriptionId) {
          console.error(`❌ Invoice payment failed for subscription ${subscriptionId}`);
          // You might want to send an email notification to the user here
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ 
      error: 'Webhook handler failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
