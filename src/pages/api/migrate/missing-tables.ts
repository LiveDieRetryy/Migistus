import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Creating missing tables for database migration...');
    
    // 1. Create site_settings table for maintenance mode
    await sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        maintenance_mode BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created site_settings table');

    // Insert default maintenance mode setting
    await sql`
      INSERT INTO site_settings (maintenance_mode, updated_at)
      SELECT FALSE, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1)
    `;
    console.log('✅ Inserted default maintenance mode');

    // 2. Create email_campaigns table for marketing
    await sql`
      CREATE TABLE IF NOT EXISTS email_campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        target_tier VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created email_campaigns table');

    // 3. Create chat_messages table for product chat
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        username VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created chat_messages table');

    // 4. Create password_reset_tokens table for auth
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created password_reset_tokens table');

    return res.status(200).json({
      success: true,
      message: 'Missing tables created successfully',
      tables: ['site_settings', 'email_campaigns', 'chat_messages', 'password_reset_tokens']
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}
