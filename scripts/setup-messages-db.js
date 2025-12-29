// Script to set up messaging database tables
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

async function setupMessagingTables() {
  console.log('🚀 Setting up messaging database tables...\n');

  try {
    // Drop existing tables if they exist (to recreate with correct types)
    console.log('📋 Dropping existing tables if they exist...');
    await sql`DROP TABLE IF EXISTS direct_messages CASCADE`;
    await sql`DROP TABLE IF EXISTS conversations CASCADE`;
    console.log('✅ Tables dropped\n');

    // Create conversations table
    console.log('📋 Creating conversations table...');
    await sql`
      CREATE TABLE conversations (
        id SERIAL PRIMARY KEY,
        user1_id BIGINT NOT NULL,
        user2_id BIGINT NOT NULL,
        last_message TEXT,
        last_message_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT different_users CHECK (user1_id != user2_id)
      )
    `;
    console.log('✅ Conversations table created\n');

    // Create unique index for conversation participants
    console.log('📋 Creating unique index for conversation participants...');
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_participants 
      ON conversations (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
    `;
    console.log('✅ Index created\n');

    // Create direct_messages table
    console.log('📋 Creating direct_messages table...');
    await sql`
      CREATE TABLE direct_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id BIGINT NOT NULL,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Direct messages table created\n');

    // Create indexes for better performance
    console.log('📋 Creating performance indexes...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
      ON direct_messages (conversation_id, created_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_sender 
      ON direct_messages (sender_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_read 
      ON direct_messages (conversation_id, read)
    `;
    console.log('✅ Performance indexes created\n');

    console.log('🎉 Messaging database setup completed successfully!');
    console.log('\nTables created:');
    console.log('  - conversations');
    console.log('  - direct_messages');
    console.log('\nIndexes created:');
    console.log('  - idx_conversation_participants (unique)');
    console.log('  - idx_messages_conversation');
    console.log('  - idx_messages_sender');
    console.log('  - idx_messages_read');

  } catch (error) {
    console.error('❌ Error setting up messaging tables:', error);
    process.exit(1);
  }
}

setupMessagingTables();
