/**
 * Database Connection Test
 * Quick test to verify database connection and setup
 */

import { sql } from '@vercel/postgres';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test basic connection
    console.log('1. Testing basic query...');
    const test = await sql`SELECT NOW() as current_time`;
    console.log('   ✅ Database connected!');
    console.log('   Server time:', test.rows[0].current_time);

    // Check if tables exist
    console.log('\n2. Checking tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.rows.length === 0) {
      console.log('   ⚠️  No tables found!');
      console.log('   Please run db/schema.sql to initialize the database.');
    } else {
      console.log('   ✅ Found tables:');
      tables.rows.forEach(row => {
        console.log('      -', row.table_name);
      });
    }

    // Count users
    try {
      console.log('\n3. Checking users table...');
      const users = await sql`SELECT COUNT(*) as count FROM users`;
      console.log('   ✅ Users in database:', users.rows[0].count);
      
      // Show sample user
      const sample = await sql`SELECT username, email, tier FROM users LIMIT 1`;
      if (sample.rows.length > 0) {
        console.log('   Sample user:', sample.rows[0].username, `(${sample.rows[0].tier})`);
      }
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        console.log('   ⚠️  Users table not found - run schema.sql');
      } else {
        throw error;
      }
    }

    // Count products
    try {
      console.log('\n4. Checking products table...');
      const products = await sql`SELECT COUNT(*) as count FROM products`;
      console.log('   ✅ Products in database:', products.rows[0].count);
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        console.log('   ⚠️  Products table not found - run schema.sql');
      } else {
        throw error;
      }
    }

    // Count active sessions
    try {
      console.log('\n5. Checking sessions table...');
      const sessions = await sql`
        SELECT COUNT(*) as count FROM sessions 
        WHERE expires_at > CURRENT_TIMESTAMP
      `;
      console.log('   ✅ Active sessions:', sessions.rows[0].count);
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        console.log('   ⚠️  Sessions table not found - run schema.sql');
      } else {
        throw error;
      }
    }

    console.log('\n✨ Database is ready!\n');
    console.log('Next steps:');
    console.log('1. If tables are missing, run: psql "..." < db/schema.sql');
    console.log('2. If no users, run: npm run db:migrate');
    console.log('3. Deploy to production: git push origin main\n');

  } catch (error) {
    console.error('\n❌ Database connection failed!\n');
    console.error('Error:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Make sure POSTGRES_URL environment variable is set');
    console.error('2. Check Vercel dashboard for database connection string');
    console.error('3. Verify database is created in Vercel Storage\n');
    process.exit(1);
  }
}

testConnection();
