import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Adding database indexes for performance optimization...');
    const indexes: string[] = [];
    const errors: string[] = [];

    // Helper function to safely create index
    const createIndex = async (indexSql: string, indexName: string) => {
      try {
        await sql.query(indexSql);
        indexes.push(indexName);
        return true;
      } catch (error: any) {
        console.error(`Failed to create ${indexName}:`, error.message);
        errors.push(`${indexName}: ${error.message}`);
        return false;
      }
    };

    // Users table indexes
    await createIndex('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)', 'users.email');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)', 'users.username');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier)', 'users.tier');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)', 'users.created_at');

    // Products table indexes
    await createIndex('CREATE INDEX IF NOT EXISTS idx_products_stage ON products(stage)', 'products.stage');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id)', 'products.supplier_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC)', 'products.created_at');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)', 'products.slug');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true', 'products.featured');

    // Votes table indexes
    await createIndex('CREATE INDEX IF NOT EXISTS idx_votes_product_id ON votes(product_id)', 'votes.product_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id)', 'votes.user_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_votes_timestamp ON votes(timestamp DESC)', 'votes.timestamp');

    // Orders table indexes
    await createIndex('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)', 'orders.user_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)', 'orders.status');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)', 'orders.created_at');

    // Conversations table indexes
    await createIndex('CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status)', 'conversations.status');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations(user1_id)', 'conversations.user1_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id)', 'conversations.user2_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC)', 'conversations.last_message_at');

    // Messages table indexes
    await createIndex('CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)', 'messages.conversation_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)', 'messages.sender_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)', 'messages.created_at');

    // Notifications table indexes
    await createIndex('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)', 'notifications.user_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)', 'notifications.read');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)', 'notifications.created_at');

    // User profiles indexes
    await createIndex('CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)', 'user_profiles.user_id');

    // Followers table indexes
    await createIndex('CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id)', 'followers.follower_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id)', 'followers.following_id');

    // Chat messages indexes (new table)
    await createIndex('CREATE INDEX IF NOT EXISTS idx_chat_messages_product_id ON chat_messages(product_id)', 'chat_messages.product_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id)', 'chat_messages.user_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC)', 'chat_messages.created_at');

    // Email campaigns indexes (new table)
    await createIndex('CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status)', 'email_campaigns.status');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_email_campaigns_target_tier ON email_campaigns(target_tier)', 'email_campaigns.target_tier');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC)', 'email_campaigns.created_at');

    // Password reset tokens indexes (new table)
    await createIndex('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)', 'password_reset_tokens.token');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email)', 'password_reset_tokens.email');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used)', 'password_reset_tokens.used');

    // Live drops indexes
    await createIndex('CREATE INDEX IF NOT EXISTS idx_live_drops_product_id ON live_drops(product_id)', 'live_drops.product_id');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_live_drops_status ON live_drops(status)', 'live_drops.status');
    await createIndex('CREATE INDEX IF NOT EXISTS idx_live_drops_start_time ON live_drops(start_time DESC)', 'live_drops.start_time');

    console.log(`✅ Created ${indexes.length} database indexes`);
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} errors occurred`);
    }

    return res.status(200).json({
      success: true,
      message: 'Database indexes created',
      created: indexes.length,
      failed: errors.length,
      indexes: indexes,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Index creation error:', error);
    return res.status(500).json({
      error: 'Failed to create indexes',
      details: error.message
    });
  }
}
