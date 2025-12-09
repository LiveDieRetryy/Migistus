/**
 * Data Migration Script
 * Migrates data from JSON files to PostgreSQL database
 * Run this ONCE after setting up Vercel Postgres
 */

import fs from 'fs';
import path from 'path';
import { sql } from '@vercel/postgres';

const DATA_DIR = path.resolve(process.cwd(), 'public/data');

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  tier?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  country?: string;
  state?: string;
  city?: string;
  phoneNumber?: string;
  referralSource?: string;
  agreeToMarketing?: boolean;
  joinDate?: string;
  lastLogin?: string;
}

async function migrateUsers() {
  console.log('📦 Migrating users...');
  
  const usersPath = path.join(DATA_DIR, 'users.json');
  if (!fs.existsSync(usersPath)) {
    console.log('⚠️  No users.json file found');
    return;
  }

  const fileContent = fs.readFileSync(usersPath, 'utf-8');
  const data = JSON.parse(fileContent);
  const users: User[] = Array.isArray(data) ? data : (data.users || []);

  console.log(`Found ${users.length} users to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      // Check if user already exists
      const existing = await sql`
        SELECT id FROM users WHERE email = ${user.email} LIMIT 1
      `;

      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping existing user: ${user.email}`);
        skipped++;
        continue;
      }

      // Insert user
      await sql`
        INSERT INTO users (
          username, email, password_hash, tier,
          first_name, last_name, date_of_birth, country, state, city,
          phone_number, referral_source, agree_to_marketing, last_login
        )
        VALUES (
          ${user.username},
          ${user.email},
          ${user.password},
          ${user.tier || 'Initiate'},
          ${user.firstName || null},
          ${user.lastName || null},
          ${user.dateOfBirth || null},
          ${user.country || null},
          ${user.state || null},
          ${user.city || null},
          ${user.phoneNumber || null},
          ${user.referralSource || null},
          ${user.agreeToMarketing || false},
          ${user.lastLogin || null}
        )
      `;

      console.log(`✅ Migrated user: ${user.email}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate user ${user.email}:`, error);
    }
  }

  console.log(`\n✨ Users migration complete: ${migrated} migrated, ${skipped} skipped\n`);
}

async function migrateProducts() {
  console.log('📦 Migrating products...');
  
  const productsPath = path.join(DATA_DIR, 'products.json');
  if (!fs.existsSync(productsPath)) {
    console.log('⚠️  No products.json file found');
    return;
  }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  console.log(`Found ${products.length} products to migrate`);

  let migrated = 0;

  for (const product of products) {
    try {
      const existing = await sql`
        SELECT id FROM products WHERE slug = ${product.slug} LIMIT 1
      `;

      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping existing product: ${product.slug}`);
        continue;
      }

      await sql`
        INSERT INTO products (
          name, slug, stage, category, subcategory,
          supplier_name, supplier_contact, supplier_email,
          moq, unit_price, msrp, currency,
          description, features, specifications, image_url
        )
        VALUES (
          ${product.name},
          ${product.slug},
          ${product.stage || 'Dormant'},
          ${product.category || 'General'},
          ${product.subcategory || null},
          ${product.supplier?.name || null},
          ${product.supplier?.contact || null},
          ${product.supplier?.email || null},
          ${product.moq || null},
          ${product.unitPrice || null},
          ${product.msrp || null},
          ${product.currency || 'USD'},
          ${product.description || ''},
          ${JSON.stringify(product.features || [])},
          ${JSON.stringify(product.specifications || {})},
          ${product.image || product.imageUrl || null}
        )
      `;

      console.log(`✅ Migrated product: ${product.slug}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate product ${product.slug}:`, error);
    }
  }

  console.log(`\n✨ Products migration complete: ${migrated} migrated\n`);
}

async function main() {
  console.log('🚀 Starting data migration to PostgreSQL...\n');
  
  try {
    // Check database connection
    await sql`SELECT 1`;
    console.log('✅ Database connection successful\n');
    
    await migrateUsers();
    await migrateProducts();
    
    console.log('\n🎉 Migration complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify data in Vercel Postgres dashboard');
    console.log('2. Test login on production domain');
    console.log('3. Update environment variables if needed');
    console.log('4. Deploy to production\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n💡 Make sure you have:');
    console.error('1. Set up Vercel Postgres database');
    console.error('2. Run the schema.sql file in your database');
    console.error('3. Added DATABASE_URL to your environment variables\n');
    process.exit(1);
  }
}

main();
