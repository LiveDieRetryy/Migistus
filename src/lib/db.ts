import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

// Database helper functions for production
export const db = {
  // Users
  async getUser(email: string) {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getUserById(id: number) {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getUserByUsername(username: string) {
    const result = await sql`
      SELECT * FROM users WHERE username = ${username} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getUserByEmailOrUsername(identifier: string) {
    const result = await sql`
      SELECT * FROM users 
      WHERE LOWER(email) = LOWER(${identifier}) OR LOWER(username) = LOWER(${identifier})
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async createUser(data: {
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
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const result = await sql`
      INSERT INTO users (
        username, email, password_hash, tier,
        first_name, last_name, date_of_birth, country, state, city,
        phone_number, referral_source, agree_to_marketing
      )
      VALUES (
        ${data.username}, ${data.email}, ${passwordHash}, ${data.tier || 'Initiate'},
        ${data.firstName || null}, ${data.lastName || null}, ${data.dateOfBirth || null},
        ${data.country || null}, ${data.state || null}, ${data.city || null},
        ${data.phoneNumber || null}, ${data.referralSource || null}, ${data.agreeToMarketing || false}
      )
      RETURNING *
    `;
    
    return result.rows[0];
  },

  async updateUser(id: number, data: any) {
    const result = await sql`
      UPDATE users 
      SET 
        username = COALESCE(${data.username}, username),
        email = COALESCE(${data.email}, email),
        tier = COALESCE(${data.tier}, tier),
        first_name = COALESCE(${data.firstName}, first_name),
        last_name = COALESCE(${data.lastName}, last_name),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateLastLogin(id: number) {
    await sql`
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ${id}
    `;
  },

  // Sessions
  async createSession(userId: number, sessionId: string, expiresAt: Date) {
    const result = await sql`
      INSERT INTO sessions (session_id, user_id, expires_at)
      VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getSession(sessionId: string) {
    const result = await sql`
      SELECT s.*, u.* 
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_id = ${sessionId} AND s.expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async deleteSession(sessionId: string) {
    await sql`DELETE FROM sessions WHERE session_id = ${sessionId}`;
  },

  async cleanupExpiredSessions() {
    await sql`DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`;
  },

  // Votes
  async hasUserVotedToday(userId: number, productId: number) {
    const result = await sql`
      SELECT COUNT(*) as count FROM votes
      WHERE user_id = ${userId} 
      AND product_id = ${productId}
      AND DATE(timestamp) = CURRENT_DATE
    `;
    return result.rows[0].count > 0;
  },

  async getUserVotesToday(userId: number) {
    const result = await sql`
      SELECT COUNT(*) as count FROM votes
      WHERE user_id = ${userId}
      AND DATE(timestamp) = CURRENT_DATE
    `;
    return parseInt(result.rows[0].count);
  },

  async createVote(data: {
    productId: number;
    userId: number;
    tier: string;
    value: number;
  }) {
    const result = await sql`
      INSERT INTO votes (product_id, user_id, tier, value)
      VALUES (${data.productId}, ${data.userId}, ${data.tier}, ${data.value})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getVotes() {
    const result = await sql`SELECT * FROM votes ORDER BY timestamp DESC`;
    return result.rows;
  },

  async getProductVotes(productId: number) {
    const result = await sql`
      SELECT * FROM votes WHERE product_id = ${productId} ORDER BY timestamp DESC
    `;
    return result.rows;
  },

  // Products
  async getProducts() {
    const result = await sql`SELECT * FROM products ORDER BY created_at DESC`;
    return result.rows;
  },

  async getProduct(id: number) {
    const result = await sql`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
    return result.rows[0] || null;
  },

  async getProductBySlug(slug: string) {
    const result = await sql`SELECT * FROM products WHERE slug = ${slug} LIMIT 1`;
    return result.rows[0] || null;
  },

  // Activity tracking
  async logActivity(data: {
    userId: number;
    activityType: string;
    page?: string;
    details?: any;
  }) {
    await sql`
      INSERT INTO user_activity (user_id, activity_type, page, details)
      VALUES (
        ${data.userId}, 
        ${data.activityType}, 
        ${data.page || null}, 
        ${JSON.stringify(data.details || {})}
      )
    `;
  }
};

// Helper to check if we're in production
export const isProduction = () => {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
};

// Helper to initialize database tables (run this once)
export async function initializeDatabase() {
  // This will be run via a setup script or API endpoint
  // The actual schema should be created in Vercel Postgres dashboard
  console.log('Database should be initialized via Vercel Postgres dashboard');
  console.log('Run the schema.sql file in your Vercel Postgres database');
}
