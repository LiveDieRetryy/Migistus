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

  async getUsersByIds(ids: number[]) {
    if (!ids || ids.length === 0) return [];
    const result = await sql`
      SELECT * FROM users WHERE id = ANY(${ids})
    `;
    return result.rows;
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

  async getAllUsers() {
    const result = await sql`
      SELECT * FROM users ORDER BY created_at DESC
    `;
    return result.rows;
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
    avatar?: string | null;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const result = await sql`
      INSERT INTO users (
        username, email, password_hash, tier,
        first_name, last_name, date_of_birth, country, state, city,
        phone_number, referral_source, agree_to_marketing, avatar
      )
      VALUES (
        ${data.username}, ${data.email}, ${passwordHash}, ${data.tier || 'Initiate'},
        ${data.firstName || null}, ${data.lastName || null}, ${data.dateOfBirth || null},
        ${data.country || null}, ${data.state || null}, ${data.city || null},
        ${data.phoneNumber || null}, ${data.referralSource || null}, ${data.agreeToMarketing || false},
        ${data.avatar || null}
      )
      RETURNING *
    `;
    
    return result.rows[0];
  },

  async updateUser(id: number, data: any) {
    // Build update object with only defined fields
    const updateFields: any = {};
    
    if (data.username !== undefined) updateFields.username = data.username;
    if (data.email !== undefined) updateFields.email = data.email;
    if (data.tier !== undefined) updateFields.tier = data.tier;
    if (data.firstName !== undefined) updateFields.first_name = data.firstName;
    if (data.lastName !== undefined) updateFields.last_name = data.lastName;
    if (data.banned !== undefined) updateFields.banned = data.banned;
    if (data.mutedUntil !== undefined) updateFields.muted_until = data.mutedUntil;
    if (data.isActive !== undefined) updateFields.is_active = data.isActive;
    if (data.emailVerified !== undefined) updateFields.email_verified = data.emailVerified;
    if (data.wallet !== undefined) updateFields.wallet = data.wallet;
    if (data.guildCoins !== undefined) updateFields.guild_coins = data.guildCoins;
    if (data.stripeCustomerId !== undefined) updateFields.stripe_customer_id = data.stripeCustomerId;
    if (data.stripeSubscriptionId !== undefined) updateFields.stripe_subscription_id = data.stripeSubscriptionId;
    if (data.stripeSubscriptionStatus !== undefined) updateFields.stripe_subscription_status = data.stripeSubscriptionStatus;
    if (data.subscriptionCurrentPeriodEnd !== undefined) updateFields.subscription_current_period_end = data.subscriptionCurrentPeriodEnd;
    
    // If no fields to update, just return the existing user
    if (Object.keys(updateFields).length === 0) {
      const result = await sql`SELECT * FROM users WHERE id = ${id}`;
      return result.rows[0];
    }
    
    // Use COALESCE to only update fields that are provided
    const result = await sql`
      UPDATE users 
      SET 
        username = COALESCE(${updateFields.username || null}, username),
        email = COALESCE(${updateFields.email || null}, email),
        tier = COALESCE(${updateFields.tier || null}, tier),
        first_name = COALESCE(${updateFields.first_name || null}, first_name),
        last_name = COALESCE(${updateFields.last_name || null}, last_name),
        banned = COALESCE(${updateFields.banned !== undefined ? updateFields.banned : null}, banned),
        muted_until = COALESCE(${updateFields.muted_until || null}, muted_until),
        is_active = COALESCE(${updateFields.is_active !== undefined ? updateFields.is_active : null}, is_active),
        email_verified = COALESCE(${updateFields.email_verified !== undefined ? updateFields.email_verified : null}, email_verified),
        wallet = COALESCE(${updateFields.wallet !== undefined ? updateFields.wallet : null}, wallet),
        guild_coins = COALESCE(${updateFields.guild_coins !== undefined ? updateFields.guild_coins : null}, guild_coins),
        stripe_customer_id = COALESCE(${updateFields.stripe_customer_id !== undefined ? updateFields.stripe_customer_id : null}, stripe_customer_id),
        stripe_subscription_id = COALESCE(${updateFields.stripe_subscription_id !== undefined ? updateFields.stripe_subscription_id : null}, stripe_subscription_id),
        stripe_subscription_status = COALESCE(${updateFields.stripe_subscription_status !== undefined ? updateFields.stripe_subscription_status : null}, stripe_subscription_status),
        subscription_current_period_end = COALESCE(${updateFields.subscription_current_period_end !== undefined ? updateFields.subscription_current_period_end : null}, subscription_current_period_end),
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

  async deleteUser(id: number) {
    const result = await sql`
      DELETE FROM users WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async markUserAsVerified(email: string) {
    const result = await sql`
      UPDATE users 
      SET email_verified = true, updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(email) = LOWER(${email})
      RETURNING *
    `;
    return result.rows[0] || null;
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

  async updateSessionTier(sessionId: string, tier: string) {
    // Note: In production, user tier is stored in users table, not sessions
    // Sessions join with users to get current tier, so we don't need to update sessions
    // This is a no-op in database mode but kept for API compatibility
    console.log(`Note: updateSessionTier called but tier is stored in users table, not sessions`);
  },

  // Email Verification Tokens
  async createVerificationToken(email: string, code: string, expiresAt: Date) {
    const result = await sql`
      INSERT INTO verification_tokens (email, code, expires_at, used)
      VALUES (${email.toLowerCase()}, ${code}, ${expiresAt.toISOString()}, false)
      RETURNING *
    `;
    return result.rows[0];
  },

  async getVerificationToken(code: string) {
    const result = await sql`
      SELECT * FROM verification_tokens 
      WHERE code = ${code} AND used = false AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async markTokenAsUsed(code: string) {
    await sql`
      UPDATE verification_tokens 
      SET used = true, updated_at = CURRENT_TIMESTAMP
      WHERE code = ${code}
    `;
  },

  async cleanupExpiredTokens() {
    await sql`
      DELETE FROM verification_tokens 
      WHERE expires_at < CURRENT_TIMESTAMP OR used = true
    `;
  },

  async cleanupExpiredSessions() {
    await sql`DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`;
  },

  async updateSessionActivity(userId: number, currentPage?: string) {
    const result = await sql`
      UPDATE sessions 
      SET last_active = CURRENT_TIMESTAMP,
          current_page = ${currentPage || null}
      WHERE user_id = ${userId} AND expires_at > CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async getOnlineUsers() {
    // Consider users online if they had activity in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const result = await sql`
      SELECT DISTINCT u.id, u.username, u.avatar, u.tier, s.last_active, s.current_page
      FROM users u
      JOIN sessions s ON s.user_id = u.id
      WHERE s.expires_at > CURRENT_TIMESTAMP
        AND s.last_active > ${fiveMinutesAgo}
        AND (s.is_invisible = false OR s.is_invisible IS NULL)
      ORDER BY s.last_active DESC
    `;
    
    return result.rows;
  },

  async isUserOnline(userId: number, ignoreInvisible: boolean = false) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const result = ignoreInvisible 
      ? await sql`
          SELECT COUNT(*) as count
          FROM sessions s
          WHERE s.user_id = ${userId}
            AND s.expires_at > CURRENT_TIMESTAMP
            AND s.last_active > ${fiveMinutesAgo}
        `
      : await sql`
          SELECT COUNT(*) as count
          FROM sessions s
          WHERE s.user_id = ${userId}
            AND s.expires_at > CURRENT_TIMESTAMP
            AND s.last_active > ${fiveMinutesAgo}
            AND (s.is_invisible = false OR s.is_invisible IS NULL)
        `;
    
    return result.rows[0].count > 0;
  },

  async updateSessionVisibility(userId: number, isInvisible: boolean) {
    await sql`
      UPDATE sessions 
      SET is_invisible = ${isInvisible}
      WHERE user_id = ${userId}
    `;
  },

  async getAllActiveSessions(userId?: number) {
    if (userId) {
      const result = await sql`
        SELECT * FROM sessions 
        WHERE user_id = ${userId} 
          AND expires_at > CURRENT_TIMESTAMP
          AND is_active = true
        ORDER BY last_active DESC
      `;
      return result.rows;
    } else {
      const result = await sql`
        SELECT s.*, u.username, u.email, u.tier
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.expires_at > CURRENT_TIMESTAMP
          AND s.is_active = true
        ORDER BY s.last_active DESC
      `;
      return result.rows;
    }
  },

  async endSession(sessionId: string) {
    const result = await sql`
      UPDATE sessions
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ${sessionId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async updateSessionPage(sessionId: string, currentPage: string, ipAddress?: string, userAgent?: string) {
    const result = await sql`
      UPDATE sessions
      SET current_page = ${currentPage},
          last_active = CURRENT_TIMESTAMP,
          ip_address = COALESCE(${ipAddress || null}, ip_address),
          user_agent = COALESCE(${userAgent || null}, user_agent)
      WHERE session_id = ${sessionId}
      RETURNING *
    `;
    return result.rows[0] || null;
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

  async createProduct(data: any) {
    const result = await sql`
      INSERT INTO products (
        name, description, image, goal, link, timeframe, category, 
        votes, featured, pledges, pricing_tiers, slug, stage, status,
        vote_end_date, created_at
      ) VALUES (
        ${data.name}, ${data.description}, ${data.image}, ${data.goal || 0}, 
        ${data.link || ''}, ${data.timeframe || '30 days'}, ${data.category || 'General'},
        ${data.votes || 0}, ${data.featured || false}, ${data.pledges || 0},
        ${JSON.stringify(data.pricingTiers || data.pricing_tiers || [])},
        ${data.slug}, ${data.stage || 'voting'}, ${data.status || 'active'},
        ${data.vote_end_date || data.voteEndDate || null},
        ${data.created_at || data.createdAt || new Date().toISOString()}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateProduct(id: number, data: any) {
    const updates = [];
    const values = [];
    
    if (data.name !== undefined) { updates.push(`name = $${updates.length + 1}`); values.push(data.name); }
    if (data.description !== undefined) { updates.push(`description = $${updates.length + 1}`); values.push(data.description); }
    if (data.image !== undefined) { updates.push(`image = $${updates.length + 1}`); values.push(data.image); }
    if (data.goal !== undefined) { updates.push(`goal = $${updates.length + 1}`); values.push(data.goal); }
    if (data.link !== undefined) { updates.push(`link = $${updates.length + 1}`); values.push(data.link); }
    if (data.timeframe !== undefined) { updates.push(`timeframe = $${updates.length + 1}`); values.push(data.timeframe); }
    if (data.category !== undefined) { updates.push(`category = $${updates.length + 1}`); values.push(data.category); }
    if (data.votes !== undefined) { updates.push(`votes = $${updates.length + 1}`); values.push(data.votes); }
    if (data.featured !== undefined) { updates.push(`featured = $${updates.length + 1}`); values.push(data.featured); }
    if (data.pledges !== undefined) { updates.push(`pledges = $${updates.length + 1}`); values.push(data.pledges); }
    if (data.pricingTiers !== undefined) { updates.push(`pricing_tiers = $${updates.length + 1}`); values.push(JSON.stringify(data.pricingTiers)); }
    if (data.pricing_tiers !== undefined) { updates.push(`pricing_tiers = $${updates.length + 1}`); values.push(JSON.stringify(data.pricing_tiers)); }
    if (data.slug !== undefined) { updates.push(`slug = $${updates.length + 1}`); values.push(data.slug); }
    if (data.stage !== undefined) { updates.push(`stage = $${updates.length + 1}`); values.push(data.stage); }
    if (data.status !== undefined) { updates.push(`status = $${updates.length + 1}`); values.push(data.status); }
    if (data.vote_end_date !== undefined) { updates.push(`vote_end_date = $${updates.length + 1}`); values.push(data.vote_end_date); }
    if (data.voteEndDate !== undefined) { updates.push(`vote_end_date = $${updates.length + 1}`); values.push(data.voteEndDate); }

    if (updates.length === 0) return null;

    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = $${updates.length + 1} RETURNING *`;
    values.push(id);
    
    const result = await sql.query(query, values);
    return result.rows[0];
  },

  async deleteProduct(id: number) {
    await sql`DELETE FROM products WHERE id = ${id}`;
  },

  // Vote operations (extended)
  async getVote(productId: number, userId: number) {
    const result = await sql`
      SELECT * FROM votes 
      WHERE product_id = ${productId} AND user_id = ${userId}
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getUserVotes(userId: number) {
    const result = await sql`
      SELECT * FROM votes WHERE user_id = ${userId} ORDER BY timestamp DESC
    `;
    return result.rows;
  },

  async getProductVoteCount(productId: number) {
    const result = await sql`
      SELECT COUNT(*) as count FROM votes WHERE product_id = ${productId}
    `;
    return parseInt(result.rows[0].count);
  },

  async deleteVote(productId: number, userId: number) {
    await sql`
      DELETE FROM votes 
      WHERE product_id = ${productId} AND user_id = ${userId}
    `;
  },

  // Pledges
  async createPledge(data: {
    productId: number;
    userId: number;
    tierId: number;
    quantity: number;
  }) {
    const result = await sql`
      INSERT INTO pledges (product_id, user_id, tier_id, quantity)
      VALUES (${data.productId}, ${data.userId}, ${data.tierId}, ${data.quantity})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getPledge(productId: number, userId: number) {
    const result = await sql`
      SELECT * FROM pledges 
      WHERE product_id = ${productId} AND user_id = ${userId}
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getProductPledges(productId: number) {
    const result = await sql`
      SELECT * FROM pledges WHERE product_id = ${productId} ORDER BY created_at DESC
    `;
    return result.rows;
  },

  async getUserPledges(userId: number) {
    const result = await sql`
      SELECT * FROM pledges WHERE user_id = ${userId} ORDER BY timestamp DESC
    `;
    return result.rows;
  },

  async getProductPledgeCount(productId: number) {
    const result = await sql`
      SELECT SUM(quantity) as total FROM pledges WHERE product_id = ${productId}
    `;
    return parseInt(result.rows[0].total || 0);
  },

  async updatePledge(productId: number, userId: number, quantity: number) {
    const result = await sql`
      UPDATE pledges 
      SET quantity = ${quantity}, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ${productId} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async deletePledge(productId: number, userId: number) {
    await sql`
      DELETE FROM pledges 
      WHERE product_id = ${productId} AND user_id = ${userId}
    `;
  },

  // Staff Picks
  async createStaffPick(data: {
    productId: number;
    reason?: string;
    featuredUntil?: string;
  }) {
    const result = await sql`
      INSERT INTO staff_picks (product_id, reason, featured_until)
      VALUES (${data.productId}, ${data.reason || ''}, ${data.featuredUntil || null})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getStaffPick(productId: number) {
    const result = await sql`
      SELECT * FROM staff_picks WHERE product_id = ${productId} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getAllStaffPicks() {
    const result = await sql`
      SELECT sp.*, p.name, p.image, p.description 
      FROM staff_picks sp
      JOIN products p ON sp.product_id = p.id
      WHERE sp.featured_until IS NULL OR sp.featured_until > CURRENT_TIMESTAMP
      ORDER BY sp.created_at DESC
    `;
    return result.rows;
  },

  async removeStaffPick(productId: number) {
    await sql`DELETE FROM staff_picks WHERE product_id = ${productId}`;
  },

  async updateStaffPick(productId: number, data: { reason?: string; featuredUntil?: string }) {
    const updates = [];
    if (data.reason !== undefined) updates.push(`reason = '${data.reason}'`);
    if (data.featuredUntil !== undefined) updates.push(`featured_until = '${data.featuredUntil}'`);
    
    if (updates.length === 0) return null;

    const result = await sql.query(
      `UPDATE staff_picks SET ${updates.join(', ')} WHERE product_id = ${productId} RETURNING *`
    );
    return result.rows[0];
  },

  // ============ PHASE 5: ADMIN FEATURES, ANALYTICS & MODERATION ============
  
  // Admin Audit Logs
  async logAdminAction(data: {
    adminId: number;
    action: string;
    targetType?: string;
    targetId?: number;
    details?: any;
    ipAddress?: string;
  }) {
    const result = await sql`
      INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details, ip_address)
      VALUES (
        ${data.adminId},
        ${data.action},
        ${data.targetType || null},
        ${data.targetId || null},
        ${JSON.stringify(data.details || {})},
        ${data.ipAddress || null}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getAdminAuditLogs(limit: number = 100, offset: number = 0) {
    const result = await sql`
      SELECT aal.*, u.username as admin_username, u.email as admin_email
      FROM admin_audit_logs aal
      LEFT JOIN users u ON aal.admin_id = u.id
      ORDER BY aal.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  },

  async getAuditLogsByUser(userId: number, limit: number = 50) {
    const result = await sql`
      SELECT * FROM admin_audit_logs
      WHERE admin_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async getAuditLogsByAction(action: string, limit: number = 50) {
    const result = await sql`
      SELECT aal.*, u.username as admin_username
      FROM admin_audit_logs aal
      LEFT JOIN users u ON aal.admin_id = u.id
      WHERE aal.action = ${action}
      ORDER BY aal.created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async getAuditLogsByDateRange(startDate: string, endDate: string) {
    const result = await sql`
      SELECT aal.*, u.username as admin_username
      FROM admin_audit_logs aal
      LEFT JOIN users u ON aal.admin_id = u.id
      WHERE aal.created_at >= ${startDate} AND aal.created_at <= ${endDate}
      ORDER BY aal.created_at DESC
    `;
    return result.rows;
  },

  // Moderation Actions
  async createModerationAction(data: {
    moderatorId: number;
    targetUserId: number;
    actionType: string;
    reason?: string;
    duration?: number;
    details?: any;
  }) {
    const result = await sql`
      INSERT INTO moderation_actions (moderator_id, target_user_id, action_type, reason, duration, details)
      VALUES (
        ${data.moderatorId},
        ${data.targetUserId},
        ${data.actionType},
        ${data.reason || null},
        ${data.duration || null},
        ${JSON.stringify(data.details || {})}
      )
      RETURNING *
    `;
    
    // Log the action in audit logs
    await this.logAdminAction({
      adminId: data.moderatorId,
      action: `moderation_${data.actionType}`,
      targetType: 'user',
      targetId: data.targetUserId,
      details: { reason: data.reason, duration: data.duration }
    });
    
    return result.rows[0];
  },

  async getModerationActions(limit: number = 100, offset: number = 0) {
    const result = await sql`
      SELECT ma.*, 
        u1.username as moderator_username,
        u2.username as target_username
      FROM moderation_actions ma
      LEFT JOIN users u1 ON ma.moderator_id = u1.id
      LEFT JOIN users u2 ON ma.target_user_id = u2.id
      ORDER BY ma.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  },

  async updateModerationStatus(actionId: number, status: string, resolvedBy?: number) {
    const result = await sql`
      UPDATE moderation_actions
      SET status = ${status},
          resolved_by = ${resolvedBy || null},
          resolved_at = CURRENT_TIMESTAMP
      WHERE id = ${actionId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async banUser(userId: number, moderatorId: number, reason: string, duration?: number) {
    // Update user ban status with new schema fields
    const result = await sql`
      UPDATE users
      SET banned = true,
          banned_reason = ${reason},
          banned_at = CURRENT_TIMESTAMP,
          banned_by = ${moderatorId}
      WHERE id = ${userId}
      RETURNING *
    `;

    // Log the enforcement action
    await sql`
      INSERT INTO enforcement_log (user_id, admin_id, action_type, reason)
      VALUES (${userId}, ${moderatorId}, 'ban', ${reason})
    `;
    
    return result.rows[0];
  },

  async unbanUser(userId: number, moderatorId: number) {
    // Update user ban status
    const result = await sql`
      UPDATE users
      SET banned = false,
          banned_reason = NULL,
          banned_at = NULL,
          banned_by = NULL
      WHERE id = ${userId}
      RETURNING *
    `;

    // Log the enforcement action
    await sql`
      INSERT INTO enforcement_log (user_id, admin_id, action_type)
      VALUES (${userId}, ${moderatorId}, 'unban')
    `;
    
    return result.rows[0];
  },

  async muteUser(userId: number, moderatorId: number, durationMinutes: number, reason?: string) {
    const mutedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    
    // Update user mute status
    const result = await sql`
      UPDATE users 
      SET muted_until = ${mutedUntil.toISOString()}, 
          muted_reason = ${reason || null},
          muted_at = CURRENT_TIMESTAMP, 
          muted_by = ${moderatorId}
      WHERE id = ${userId}
      RETURNING *
    `;

    // Log the enforcement action
    await sql`
      INSERT INTO enforcement_log (user_id, admin_id, action_type, reason, duration_minutes, expires_at)
      VALUES (${userId}, ${moderatorId}, 'mute', ${reason || null}, ${durationMinutes}, ${mutedUntil.toISOString()})
    `;

    return result.rows[0] || null;
  },

  async unmuteUser(userId: number, moderatorId: number) {
    // Update user mute status
    const result = await sql`
      UPDATE users 
      SET muted_until = NULL, 
          muted_reason = NULL,
          muted_at = NULL, 
          muted_by = NULL
      WHERE id = ${userId}
      RETURNING *
    `;

    // Log the enforcement action
    await sql`
      INSERT INTO enforcement_log (user_id, admin_id, action_type)
      VALUES (${userId}, ${moderatorId}, 'unmute')
    `;

    return result.rows[0] || null;
  },

  async getEnforcementLog(userId?: number, limit: number = 50) {
    let result;
    if (userId) {
      result = await sql`
        SELECT el.*, 
               u.username as user_username,
               a.username as admin_username
        FROM enforcement_log el
        LEFT JOIN users u ON el.user_id = u.id
        LEFT JOIN users a ON el.admin_id = a.id
        WHERE el.user_id = ${userId}
        ORDER BY el.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      result = await sql`
        SELECT el.*, 
               u.username as user_username,
               a.username as admin_username
        FROM enforcement_log el
        LEFT JOIN users u ON el.user_id = u.id
        LEFT JOIN users a ON el.admin_id = a.id
        ORDER BY el.created_at DESC
        LIMIT ${limit}
      `;
    }
    return result.rows;
  },

  async getBannedUsers() {
    const result = await sql`
      SELECT id, username, email, banned, banned_reason, banned_at, banned_by
      FROM users
      WHERE banned = true
      ORDER BY banned_at DESC
    `;
    return result.rows;
  },

  async getMutedUsers() {
    const result = await sql`
      SELECT id, username, email, muted_until, muted_reason, muted_at, muted_by
      FROM users
      WHERE muted_until IS NOT NULL AND muted_until > CURRENT_TIMESTAMP
      ORDER BY muted_at DESC
    `;
    return result.rows;
  },

  // Push Subscriptions
  async savePushSubscription(data: {
    userId: number;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
  }) {
    const result = await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
      VALUES (${data.userId}, ${data.endpoint}, ${data.p256dh}, ${data.auth}, ${data.userAgent || null})
      ON CONFLICT (endpoint) 
      DO UPDATE SET 
        user_id = ${data.userId},
        p256dh = ${data.p256dh},
        auth = ${data.auth},
        is_active = true,
        last_used = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  },

  async getUserPushSubscriptions(userId: number) {
    const result = await sql`
      SELECT * FROM push_subscriptions 
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY created_at DESC
    `;
    return result.rows;
  },

  async getAllActivePushSubscriptions() {
    const result = await sql`
      SELECT * FROM push_subscriptions 
      WHERE is_active = true
      ORDER BY last_used DESC
    `;
    return result.rows;
  },

  async deactivatePushSubscription(endpoint: string) {
    const result = await sql`
      UPDATE push_subscriptions 
      SET is_active = false 
      WHERE endpoint = ${endpoint}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async deletePushSubscription(endpoint: string) {
    const result = await sql`
      DELETE FROM push_subscriptions 
      WHERE endpoint = ${endpoint}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async getUserModerationHistory(userId: number) {
    const result = await sql`
      SELECT ma.*, u.username as moderator_username
      FROM moderation_actions ma
      LEFT JOIN users u ON ma.moderator_id = u.id
      WHERE ma.target_user_id = ${userId}
      ORDER BY ma.created_at DESC
    `;
    return result.rows;
  },

  // System Settings
  async getSystemSettings() {
    const result = await sql`SELECT * FROM system_settings ORDER BY key`;
    const settings: any = {};
    result.rows.forEach((row: any) => {
      settings[row.key] = {
        value: row.value,
        type: row.value_type,
        description: row.description,
        updatedAt: row.updated_at
      };
    });
    return settings;
  },

  async getSystemSetting(key: string) {
    const result = await sql`
      SELECT * FROM system_settings WHERE key = ${key} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async updateSystemSetting(key: string, value: any, adminId: number, description?: string) {
    const valueType = typeof value;
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    const result = await sql`
      INSERT INTO system_settings (key, value, value_type, description)
      VALUES (${key}, ${valueStr}, ${valueType}, ${description || null})
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = ${valueStr},
        value_type = ${valueType},
        description = COALESCE(${description}, system_settings.description),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    // Log the setting change
    await this.logAdminAction({
      adminId,
      action: 'update_system_setting',
      targetType: 'setting',
      details: { key, oldValue: result.rows[0].value, newValue: valueStr }
    });

    return result.rows[0];
  },

  async deleteSystemSetting(key: string, adminId: number) {
    const setting = await this.getSystemSetting(key);
    
    await sql`DELETE FROM system_settings WHERE key = ${key}`;
    
    // Log the deletion
    await this.logAdminAction({
      adminId,
      action: 'delete_system_setting',
      targetType: 'setting',
      details: { key, value: setting?.value }
    });
  },

  // Feature Flags
  async getFeatureFlags() {
    const result = await sql`SELECT * FROM feature_flags ORDER BY name`;
    const flags: any = {};
    result.rows.forEach((row: any) => {
      flags[row.name] = {
        enabled: row.enabled,
        description: row.description,
        rolloutPercentage: row.rollout_percentage,
        updatedAt: row.updated_at
      };
    });
    return flags;
  },

  async getFeatureFlag(name: string) {
    const result = await sql`
      SELECT * FROM feature_flags WHERE name = ${name} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async updateFeatureFlag(name: string, enabled: boolean, adminId: number, rolloutPercentage?: number) {
    let result;
    if (rolloutPercentage !== undefined) {
      result = await sql`
        UPDATE feature_flags
        SET enabled = ${enabled},
            rollout_percentage = ${rolloutPercentage},
            updated_at = CURRENT_TIMESTAMP
        WHERE name = ${name}
        RETURNING *
      `;
    } else {
      result = await sql`
        UPDATE feature_flags
        SET enabled = ${enabled},
            updated_at = CURRENT_TIMESTAMP
        WHERE name = ${name}
        RETURNING *
      `;
    }

    // Log the flag change
    await this.logAdminAction({
      adminId,
      action: 'update_feature_flag',
      targetType: 'feature_flag',
      details: { name, enabled, rolloutPercentage }
    });

    return result.rows[0];
  },

  async createFeatureFlag(name: string, enabled: boolean, description: string, adminId: number) {
    const result = await sql`
      INSERT INTO feature_flags (name, enabled, description)
      VALUES (${name}, ${enabled}, ${description})
      RETURNING *
    `;

    await this.logAdminAction({
      adminId,
      action: 'create_feature_flag',
      targetType: 'feature_flag',
      details: { name, enabled, description }
    });

    return result.rows[0];
  },

  async toggleMaintenanceMode(enabled: boolean, adminId: number, message?: string) {
    await this.updateSystemSetting('maintenance_mode', enabled, adminId, 'Maintenance mode status');
    
    if (message) {
      await this.updateSystemSetting('maintenance_message', message, adminId, 'Maintenance mode message');
    }

    await this.logAdminAction({
      adminId,
      action: enabled ? 'enable_maintenance_mode' : 'disable_maintenance_mode',
      details: { message }
    });
  },

  // Analytics Events
  async logAnalyticsEvent(data: {
    eventType: string;
    userId?: number;
    sessionId?: string;
    eventData?: any;
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const result = await sql`
      INSERT INTO analytics_events (
        event_type, user_id, session_id, event_data,
        page_url, referrer, user_agent, ip_address
      ) VALUES (
        ${data.eventType},
        ${data.userId || null},
        ${data.sessionId || null},
        ${JSON.stringify(data.eventData || {})},
        ${data.pageUrl || null},
        ${data.referrer || null},
        ${data.userAgent || null},
        ${data.ipAddress || null}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getAnalyticsEventsSimple(limit: number = 1000, offset: number = 0) {
    const result = await sql`
      SELECT * FROM analytics_events
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  },

  async getEventsByType(eventType: string, limit: number = 500) {
    const result = await sql`
      SELECT * FROM analytics_events
      WHERE event_type = ${eventType}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async getEventsByDateRange(startDate: string, endDate: string, eventType?: string) {
    const query = eventType
      ? sql`
          SELECT * FROM analytics_events
          WHERE created_at >= ${startDate} 
            AND created_at <= ${endDate}
            AND event_type = ${eventType}
          ORDER BY created_at DESC
        `
      : sql`
          SELECT * FROM analytics_events
          WHERE created_at >= ${startDate} AND created_at <= ${endDate}
          ORDER BY created_at DESC
        `;
    
    const result = await query;
    return result.rows;
  },

  async getAnalyticsSummary(startDate: string, endDate: string) {
    const result = await sql`
      SELECT 
        event_type,
        COUNT(*) as event_count,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM analytics_events
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY event_type
      ORDER BY event_count DESC
    `;
    return result.rows;
  },

  async getUserAnalytics(userId: number, startDate?: string, endDate?: string) {
    const query = startDate && endDate
      ? sql`
          SELECT * FROM analytics_events
          WHERE user_id = ${userId}
            AND created_at >= ${startDate}
            AND created_at <= ${endDate}
          ORDER BY created_at DESC
        `
      : sql`
          SELECT * FROM analytics_events
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT 1000
        `;
    
    const result = await query;
    return result.rows;
  },

  // ============ PHASE 6: NOTIFICATIONS & REAL-TIME ============
  
  // Notifications
  async createNotification(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    metadata?: any;
    priority?: string;
  }) {
    const result = await sql`
      INSERT INTO notifications (
        user_id, type, title, message, action_url, action_text, metadata, priority
      ) VALUES (
        ${data.userId},
        ${data.type},
        ${data.title},
        ${data.message},
        ${data.actionUrl || null},
        ${data.actionText || null},
        ${JSON.stringify(data.metadata || {})},
        ${data.priority || 'normal'}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getNotifications(userId: number, limit: number = 50, offset: number = 0) {
    const result = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  },

  async getUnreadNotifications(userId: number) {
    const result = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId} AND is_read = false
      ORDER BY created_at DESC
    `;
    return result.rows;
  },

  async getUnreadCount(userId: number) {
    const result = await sql`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ${userId} AND is_read = false
    `;
    return parseInt(result.rows[0].count);
  },

  async markAsRead(notificationId: number) {
    const result = await sql`
      UPDATE notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = ${notificationId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async markAllAsRead(userId: number) {
    const result = await sql`
      UPDATE notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND is_read = false
      RETURNING *
    `;
    return result.rows;
  },

  async deleteNotification(notificationId: number) {
    await sql`DELETE FROM notifications WHERE id = ${notificationId}`;
  },

  async deleteAllNotifications(userId: number) {
    await sql`DELETE FROM notifications WHERE user_id = ${userId}`;
  },

  async getNotificationsByType(userId: number, type: string, limit: number = 20) {
    const result = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId} AND type = ${type}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  // Notification Preferences
  async getNotificationPreferences(userId: number) {
    const result = await sql`
      SELECT * FROM notification_preferences
      WHERE user_id = ${userId} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async updateNotificationPreferences(userId: number, preferences: {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    smsEnabled?: boolean;
    notifyOnVotes?: boolean;
    notifyOnComments?: boolean;
    notifyOnFollows?: boolean;
    notifyOnMessages?: boolean;
    notifyOnProductUpdates?: boolean;
    notifyOnOrders?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }) {
    const existing = await this.getNotificationPreferences(userId);
    
    if (existing) {
      const updates: string[] = [];
      const values: any[] = [];
      
      Object.entries(preferences).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${updates.length + 1}`);
          values.push(value);
        }
      });

      if (updates.length === 0) return existing;

      const query = `UPDATE notification_preferences SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${updates.length + 1} RETURNING *`;
      values.push(userId);
      
      const result = await sql.query(query, values);
      return result.rows[0];
    } else {
      const result = await sql`
        INSERT INTO notification_preferences (
          user_id, email_enabled, push_enabled, sms_enabled,
          notify_on_votes, notify_on_comments, notify_on_follows,
          notify_on_messages, notify_on_product_updates, notify_on_orders,
          quiet_hours_start, quiet_hours_end
        ) VALUES (
          ${userId},
          ${preferences.emailEnabled !== undefined ? preferences.emailEnabled : true},
          ${preferences.pushEnabled !== undefined ? preferences.pushEnabled : true},
          ${preferences.smsEnabled !== undefined ? preferences.smsEnabled : false},
          ${preferences.notifyOnVotes !== undefined ? preferences.notifyOnVotes : true},
          ${preferences.notifyOnComments !== undefined ? preferences.notifyOnComments : true},
          ${preferences.notifyOnFollows !== undefined ? preferences.notifyOnFollows : true},
          ${preferences.notifyOnMessages !== undefined ? preferences.notifyOnMessages : true},
          ${preferences.notifyOnProductUpdates !== undefined ? preferences.notifyOnProductUpdates : true},
          ${preferences.notifyOnOrders !== undefined ? preferences.notifyOnOrders : true},
          ${preferences.quietHoursStart || null},
          ${preferences.quietHoursEnd || null}
        )
        RETURNING *
      `;
      return result.rows[0];
    }
  },

  // Email Queue
  async queueEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    templateId?: string;
    templateData?: any;
    priority?: string;
    scheduledFor?: string;
  }) {
    const result = await sql`
      INSERT INTO email_queue (
        recipient_email, recipient_name, subject, html_content, text_content,
        template_id, template_data, priority, scheduled_for, status
      ) VALUES (
        ${data.recipientEmail},
        ${data.recipientName || null},
        ${data.subject},
        ${data.htmlContent},
        ${data.textContent || null},
        ${data.templateId || null},
        ${JSON.stringify(data.templateData || {})},
        ${data.priority || 'normal'},
        ${data.scheduledFor || null},
        'pending'
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getQueuedEmails(status: string = 'pending', limit: number = 100) {
    const result = await sql`
      SELECT * FROM email_queue
      WHERE status = ${status}
        AND (scheduled_for IS NULL OR scheduled_for <= CURRENT_TIMESTAMP)
      ORDER BY priority DESC, created_at ASC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async markEmailSent(emailId: number) {
    const result = await sql`
      UPDATE email_queue
      SET status = 'sent', sent_at = CURRENT_TIMESTAMP, attempts = attempts + 1
      WHERE id = ${emailId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async markEmailFailed(emailId: number, error: string) {
    const result = await sql`
      UPDATE email_queue
      SET status = 'failed', 
          last_error = ${error},
          attempts = attempts + 1,
          last_attempt_at = CURRENT_TIMESTAMP
      WHERE id = ${emailId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async retryFailedEmail(emailId: number) {
    const result = await sql`
      UPDATE email_queue
      SET status = 'pending', last_error = NULL
      WHERE id = ${emailId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async getEmailStatus(emailId: number) {
    const result = await sql`
      SELECT * FROM email_queue WHERE id = ${emailId} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async cleanupOldEmails(daysOld: number = 30) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      DELETE FROM email_queue
      WHERE status = 'sent' AND sent_at < ${cutoffDate}
    `;
  },

  // Real-time Sessions (WebSocket tracking)
  async createRealtimeSession(data: {
    userId: number;
    sessionId: string;
    socketId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const result = await sql`
      INSERT INTO realtime_sessions (
        user_id, session_id, socket_id, ip_address, user_agent
      ) VALUES (
        ${data.userId},
        ${data.sessionId},
        ${data.socketId},
        ${data.ipAddress || null},
        ${data.userAgent || null}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateRealtimeSession(socketId: string, lastActivity?: string) {
    const result = await sql`
      UPDATE realtime_sessions
      SET last_activity = ${lastActivity || new Date().toISOString()}
      WHERE socket_id = ${socketId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async removeRealtimeSession(socketId: string) {
    await sql`DELETE FROM realtime_sessions WHERE socket_id = ${socketId}`;
  },

  async getActiveRealtimeSessions(userId?: number) {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes
    
    if (userId) {
      const result = await sql`
        SELECT * FROM realtime_sessions
        WHERE user_id = ${userId} AND last_activity > ${cutoff}
        ORDER BY last_activity DESC
      `;
      return result.rows;
    } else {
      const result = await sql`
        SELECT * FROM realtime_sessions
        WHERE last_activity > ${cutoff}
        ORDER BY last_activity DESC
      `;
      return result.rows;
    }
  },

  async getUserSessionCount(userId: number) {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = await sql`
      SELECT COUNT(*) as count FROM realtime_sessions
      WHERE user_id = ${userId} AND last_activity > ${cutoff}
    `;
    return parseInt(result.rows[0].count);
  },

  async cleanupStaleRealtimeSessions(minutesOld: number = 30) {
    const cutoff = new Date(Date.now() - minutesOld * 60 * 1000).toISOString();
    await sql`
      DELETE FROM realtime_sessions WHERE last_activity < ${cutoff}
    `;
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
  },

  // User Profiles
  async getUserProfile(userId: number) {
    const result = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${userId} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async createUserProfile(userId: number, data: {
    bio?: string;
    avatar?: string;
    banner?: string;
    badges?: any[];
    titles?: any[];
    links?: any[];
    guildTokens?: number;
    votingPower?: number;
  }) {
    const result = await sql`
      INSERT INTO user_profiles (
        user_id, bio, avatar, banner, badges, titles, links, guild_tokens, voting_power
      )
      VALUES (
        ${userId},
        ${data.bio || null},
        ${data.avatar || null},
        ${data.banner || null},
        ${JSON.stringify(data.badges || [])},
        ${JSON.stringify(data.titles || [])},
        ${JSON.stringify(data.links || [])},
        ${data.guildTokens || 100},
        ${data.votingPower || 1}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        bio = EXCLUDED.bio,
        avatar = EXCLUDED.avatar,
        banner = EXCLUDED.banner,
        badges = EXCLUDED.badges,
        titles = EXCLUDED.titles,
        links = EXCLUDED.links,
        guild_tokens = EXCLUDED.guild_tokens,
        voting_power = EXCLUDED.voting_power,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateUserProfile(userId: number, data: Partial<{
    bio: string;
    avatar: string;
    banner: string;
    badges: any[];
    titles: any[];
    links: any[];
    isInvisible: boolean;
  }>) {
    const updates: string[] = [];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (data.bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      values.push(data.bio);
    }
    if (data.avatar !== undefined) {
      updates.push(`avatar = $${paramIndex++}`);
      values.push(data.avatar);
    }
    if (data.banner !== undefined) {
      updates.push(`banner = $${paramIndex++}`);
      values.push(data.banner);
    }
    if (data.badges !== undefined) {
      updates.push(`badges = $${paramIndex++}`);
      values.push(JSON.stringify(data.badges));
    }
    if (data.titles !== undefined) {
      updates.push(`titles = $${paramIndex++}`);
      values.push(JSON.stringify(data.titles));
    }
    if (data.links !== undefined) {
      updates.push(`links = $${paramIndex++}`);
      values.push(JSON.stringify(data.links));
    }
    if (data.isInvisible !== undefined) {
      updates.push(`is_invisible = $${paramIndex++}`);
      values.push(data.isInvisible);
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE user_profiles 
      SET ${updates.join(', ')}
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  // User Stats
  async getUserStats(userId: number) {
    const result = await sql`
      SELECT * FROM user_stats WHERE user_id = ${userId} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async createUserStats(userId: number) {
    const result = await sql`
      INSERT INTO user_stats (user_id)
      VALUES (${userId})
      ON CONFLICT (user_id) DO NOTHING
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateUserStats(userId: number, stats: Partial<{
    followers: number;
    following: number;
    totalPledges: number;
    totalVotes: number;
    dropsJoined: number;
    profileViews: number;
    postsCount: number;
  }>) {
    const updates: string[] = [];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (stats.followers !== undefined) {
      updates.push(`followers = $${paramIndex++}`);
      values.push(stats.followers);
    }
    if (stats.following !== undefined) {
      updates.push(`following = $${paramIndex++}`);
      values.push(stats.following);
    }
    if (stats.totalPledges !== undefined) {
      updates.push(`total_pledges = $${paramIndex++}`);
      values.push(stats.totalPledges);
    }
    if (stats.totalVotes !== undefined) {
      updates.push(`total_votes = $${paramIndex++}`);
      values.push(stats.totalVotes);
    }
    if (stats.dropsJoined !== undefined) {
      updates.push(`drops_joined = $${paramIndex++}`);
      values.push(stats.dropsJoined);
    }
    if (stats.profileViews !== undefined) {
      updates.push(`profile_views = $${paramIndex++}`);
      values.push(stats.profileViews);
    }
    if (stats.postsCount !== undefined) {
      updates.push(`posts_count = $${paramIndex++}`);
      values.push(stats.postsCount);
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE user_stats 
      SET ${updates.join(', ')}
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async incrementUserStat(userId: number, stat: 'followers' | 'following' | 'total_pledges' | 'total_votes' | 'drops_joined' | 'profile_views' | 'posts_count', amount: number = 1) {
    const query = `
      UPDATE user_stats 
      SET ${stat} = COALESCE(${stat}, 0) + $2, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;
    const result = await sql.query(query, [userId, amount]);
    return result.rows[0] || null;
  },

  // User Settings
  async getUserSettings(userId: number) {
    const result = await sql`
      SELECT * FROM user_settings WHERE user_id = ${userId} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async createUserSettings(userId: number, settings?: Partial<{
    showOnlineStatus: boolean;
    allowMessages: boolean;
    emailNotifications: boolean;
    marketingEmails: boolean;
    preferences: any;
  }>) {
    const result = await sql`
      INSERT INTO user_settings (
        user_id, show_online_status, allow_messages, email_notifications, marketing_emails, preferences
      )
      VALUES (
        ${userId},
        ${settings?.showOnlineStatus ?? true},
        ${settings?.allowMessages ?? true},
        ${settings?.emailNotifications ?? true},
        ${settings?.marketingEmails ?? false},
        ${JSON.stringify(settings?.preferences || {})}
      )
      ON CONFLICT (user_id) DO NOTHING
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateUserSettings(userId: number, settings: Partial<{
    showOnlineStatus: boolean;
    allowMessages: boolean;
    emailNotifications: boolean;
    marketingEmails: boolean;
    preferences: any;
  }>) {
    const updates: string[] = [];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (settings.showOnlineStatus !== undefined) {
      updates.push(`show_online_status = $${paramIndex++}`);
      values.push(settings.showOnlineStatus);
    }
    if (settings.allowMessages !== undefined) {
      updates.push(`allow_messages = $${paramIndex++}`);
      values.push(settings.allowMessages);
    }
    if (settings.emailNotifications !== undefined) {
      updates.push(`email_notifications = $${paramIndex++}`);
      values.push(settings.emailNotifications);
    }
    if (settings.marketingEmails !== undefined) {
      updates.push(`marketing_emails = $${paramIndex++}`);
      values.push(settings.marketingEmails);
    }
    if (settings.preferences !== undefined) {
      updates.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(settings.preferences));
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE user_settings 
      SET ${updates.join(', ')}
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async getUsersWithMarketingOptIn() {
    // Get total users count
    const totalResult = await sql`SELECT COUNT(*)::int as count FROM users`;
    const totalUsers = totalResult.rows[0].count;
    
    // Get users with marketing opt-in
    const result = await sql`
      SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, u.tier, u.created_at,
        s.email_notifications, s.marketing_emails
      FROM users u
      LEFT JOIN user_settings s ON u.id = s.user_id
      WHERE s.marketing_emails = true
      ORDER BY u.created_at DESC
    `;
    
    return {
      totalUsers,
      optInUsers: result.rows.length,
      users: result.rows
    };
  },

  // Follows/Followers
  async followUser(followerId: number, followingId: number) {
    try {
      const result = await sql`
        INSERT INTO follows (follower_id, following_id)
        VALUES (${followerId}, ${followingId})
        ON CONFLICT (follower_id, following_id) DO NOTHING
        RETURNING *
      `;
      
      if (result.rows[0]) {
        // Update stats
        await this.incrementUserStat(followerId, 'following', 1);
        await this.incrementUserStat(followingId, 'followers', 1);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  async unfollowUser(followerId: number, followingId: number) {
    const result = await sql`
      DELETE FROM follows 
      WHERE follower_id = ${followerId} AND following_id = ${followingId}
      RETURNING *
    `;
    
    if (result.rows[0]) {
      // Update stats
      await this.incrementUserStat(followerId, 'following', -1);
      await this.incrementUserStat(followingId, 'followers', -1);
    }
    
    return result.rows[0];
  },

  async isFollowing(followerId: number, followingId: number) {
    const result = await sql`
      SELECT COUNT(*) as count FROM follows
      WHERE follower_id = ${followerId} AND following_id = ${followingId}
    `;
    return result.rows[0].count > 0;
  },

  async getFollowers(userId: number, limit: number = 50) {
    const result = await sql`
      SELECT u.id, u.username, u.email, u.tier, up.avatar
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE f.following_id = ${userId}
      ORDER BY f.created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async getFollowing(userId: number, limit: number = 50) {
    const result = await sql`
      SELECT u.id, u.username, u.email, u.tier, up.avatar
      FROM follows f
      JOIN users u ON f.following_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE f.follower_id = ${userId}
      ORDER BY f.created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async getFollowersCount(userId: number) {
    const result = await sql`
      SELECT COUNT(*) as count FROM follows WHERE following_id = ${userId}
    `;
    return parseInt(result.rows[0].count);
  },

  async getFollowingCount(userId: number) {
    const result = await sql`
      SELECT COUNT(*) as count FROM follows WHERE follower_id = ${userId}
    `;
    return parseInt(result.rows[0].count);
  },

  // Wishlist
  async addToWishlist(userId: number, productId: number) {
    const result = await sql`
      INSERT INTO wishlist (user_id, product_id)
      VALUES (${userId}, ${productId})
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING *
    `;
    return result.rows[0];
  },

  async removeFromWishlist(userId: number, productId: number) {
    const result = await sql`
      DELETE FROM wishlist 
      WHERE user_id = ${userId} AND product_id = ${productId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async getWishlist(userId: number) {
    const result = await sql`
      SELECT p.* FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ${userId}
      ORDER BY w.created_at DESC
    `;
    return result.rows;
  },

  async isInWishlist(userId: number, productId: number) {
    const result = await sql`
      SELECT COUNT(*) as count FROM wishlist
      WHERE user_id = ${userId} AND product_id = ${productId}
    `;
    return result.rows[0].count > 0;
  },

  // Social Posts
  async createPost(userId: number, data: {
    content: string;
    imageUrl?: string;
    type?: string;
    visibility?: string;
  }) {
    const result = await sql`
      INSERT INTO posts (user_id, content, image_url, type, visibility)
      VALUES (
        ${userId},
        ${data.content},
        ${data.imageUrl || null},
        ${data.type || 'post'},
        ${data.visibility || 'public'}
      )
      RETURNING *
    `;
    
    // Update user stats
    await this.incrementUserStat(userId, 'posts_count', 1);
    
    return result.rows[0];
  },

  async getPost(postId: number) {
    const result = await sql`
      SELECT p.*, u.username, u.tier, up.avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE p.id = ${postId}
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getPosts(options: {
    userId?: number;
    limit?: number;
    offset?: number;
    type?: string;
    visibility?: string;
  } = {}) {
    const { userId, limit = 50, offset = 0, type, visibility = 'public' } = options;

    let query = `
      SELECT p.*, u.username, u.tier, up.avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE p.visibility = $1
    `;
    const values: any[] = [visibility];
    let paramIndex = 2;

    if (userId) {
      query += ` AND p.user_id = $${paramIndex++}`;
      values.push(userId);
    }

    if (type) {
      query += ` AND p.type = $${paramIndex++}`;
      values.push(type);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);

    const result = await sql.query(query, values);
    return result.rows;
  },

  async getFeedPosts(userId: number, limit: number = 50, offset: number = 0) {
    // Get posts from users the current user follows + their own posts
    const result = await sql`
      SELECT p.*, u.username, u.tier, up.avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE (
        p.user_id = ${userId}
        OR p.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = ${userId}
        )
      )
      AND p.visibility IN ('public', 'followers')
      ORDER BY p.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    return result.rows;
  },

  async updatePost(postId: number, userId: number, data: {
    content?: string;
    imageUrl?: string;
    visibility?: string;
  }) {
    const updates: string[] = [];
    const values: any[] = [postId, userId];
    let paramIndex = 3;

    if (data.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(data.content);
    }
    if (data.imageUrl !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(data.imageUrl);
    }
    if (data.visibility !== undefined) {
      updates.push(`visibility = $${paramIndex++}`);
      values.push(data.visibility);
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE posts 
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deletePost(postId: number, userId: number) {
    const result = await sql`
      DELETE FROM posts 
      WHERE id = ${postId} AND user_id = ${userId}
      RETURNING *
    `;
    
    if (result.rows[0]) {
      // Update user stats
      await this.incrementUserStat(userId, 'posts_count', -1);
    }
    
    return result.rows[0];
  },

  // Post Likes
  async likePost(postId: number, userId: number) {
    try {
      const result = await sql`
        INSERT INTO post_likes (post_id, user_id)
        VALUES (${postId}, ${userId})
        ON CONFLICT (post_id, user_id) DO NOTHING
        RETURNING *
      `;
      
      if (result.rows[0]) {
        // Increment likes count
        await sql`
          UPDATE posts 
          SET likes_count = likes_count + 1
          WHERE id = ${postId}
        `;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  async unlikePost(postId: number, userId: number) {
    const result = await sql`
      DELETE FROM post_likes 
      WHERE post_id = ${postId} AND user_id = ${userId}
      RETURNING *
    `;
    
    if (result.rows[0]) {
      // Decrement likes count
      await sql`
        UPDATE posts 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = ${postId}
      `;
    }
    
    return result.rows[0];
  },

  async isPostLiked(postId: number, userId: number) {
    const result = await sql`
      SELECT COUNT(*) as count FROM post_likes
      WHERE post_id = ${postId} AND user_id = ${userId}
    `;
    return result.rows[0].count > 0;
  },

  async getPostLikes(postId: number, limit: number = 50) {
    const result = await sql`
      SELECT u.id, u.username, u.tier, up.avatar
      FROM post_likes pl
      JOIN users u ON pl.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE pl.post_id = ${postId}
      ORDER BY pl.created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  // Post Comments
  async createComment(postId: number, userId: number, content: string) {
    const result = await sql`
      INSERT INTO post_comments (post_id, user_id, content)
      VALUES (${postId}, ${userId}, ${content})
      RETURNING *
    `;
    
    if (result.rows[0]) {
      // Increment comments count
      await sql`
        UPDATE posts 
        SET comments_count = comments_count + 1
        WHERE id = ${postId}
      `;
    }
    
    return result.rows[0];
  },

  async getComments(postId: number, limit: number = 100) {
    const result = await sql`
      SELECT c.*, u.username, u.tier, up.avatar
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async updateComment(commentId: number, userId: number, content: string) {
    const result = await sql`
      UPDATE post_comments 
      SET content = ${content}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${commentId} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async deleteComment(commentId: number, userId: number) {
    const result = await sql`
      DELETE FROM post_comments 
      WHERE id = ${commentId} AND user_id = ${userId}
      RETURNING post_id
    `;
    
    if (result.rows[0]) {
      // Decrement comments count
      await sql`
        UPDATE posts 
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = ${result.rows[0].post_id}
      `;
    }
    
    return result.rows[0];
  },

  // Supplier Applications
  async createSupplierApplication(userId: number, data: {
    companyName: string;
    email: string;
    phone?: string;
    website?: string;
    description?: string;
    productCategories?: string[];
    certifications?: any[];
  }) {
    const result = await sql`
      INSERT INTO supplier_applications (
        user_id, company_name, email, phone, website, description,
        product_categories, certifications
      )
      VALUES (
        ${userId},
        ${data.companyName},
        ${data.email},
        ${data.phone || null},
        ${data.website || null},
        ${data.description || null},
        ${JSON.stringify(data.productCategories || [])},
        ${JSON.stringify(data.certifications || [])}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getSupplierApplications(status?: string, limit: number = 50) {
    let query = 'SELECT * FROM supplier_applications';
    const values: any[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      values.push(status);
    }
    
    query += ' ORDER BY submitted_at DESC LIMIT $' + (values.length + 1);
    values.push(limit);
    
    const result = await sql.query(query, values);
    return result.rows;
  },

  async getSupplierApplication(id: number) {
    const result = await sql`
      SELECT * FROM supplier_applications WHERE id = ${id} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async updateSupplierApplication(id: number, reviewerId: number, data: {
    status: 'approved' | 'rejected';
    reviewNotes?: string;
  }) {
    const result = await sql`
      UPDATE supplier_applications
      SET status = ${data.status},
          reviewed_by = ${reviewerId},
          review_notes = ${data.reviewNotes || null},
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  // Supplier Profiles
  async createSupplierProfile(userId: number, data: {
    companyName: string;
    slug: string;
    email: string;
    description?: string;
    website?: string;
    phone?: string;
    logo?: string;
    banner?: string;
    productCategories?: string[];
    certifications?: any[];
  }) {
    const result = await sql`
      INSERT INTO supplier_profiles (
        user_id, company_name, slug, email, description, website, phone,
        logo, banner, product_categories, certifications
      )
      VALUES (
        ${userId},
        ${data.companyName},
        ${data.slug},
        ${data.email},
        ${data.description || null},
        ${data.website || null},
        ${data.phone || null},
        ${data.logo || null},
        ${data.banner || null},
        ${JSON.stringify(data.productCategories || [])},
        ${JSON.stringify(data.certifications || [])}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        email = EXCLUDED.email,
        description = EXCLUDED.description,
        website = EXCLUDED.website,
        phone = EXCLUDED.phone,
        logo = EXCLUDED.logo,
        banner = EXCLUDED.banner,
        product_categories = EXCLUDED.product_categories,
        certifications = EXCLUDED.certifications,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  },

  async getSupplierProfile(slug: string) {
    const result = await sql`
      SELECT sp.*, u.username, u.email as user_email
      FROM supplier_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.slug = ${slug} AND sp.is_active = true
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getSupplierProfileByUserId(userId: number) {
    const result = await sql`
      SELECT * FROM supplier_profiles WHERE user_id = ${userId} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getAllSuppliers(limit: number = 100) {
    const result = await sql`
      SELECT sp.*, u.username, u.email, u.tier,
        (SELECT COUNT(*) FROM products WHERE supplier_id = sp.user_id) as total_products
      FROM supplier_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.is_active = true
      ORDER BY sp.created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async getSupplierByEmailAndCode(email: string, supplierCode: string) {
    const result = await sql`
      SELECT sp.*, u.email
      FROM supplier_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE u.email = ${email} AND sp.supplier_code = ${supplierCode}
    `;
    return result.rows[0] || null;
  },

  async updateSupplierProfile(userId: number, data: any) {
    const updates: string[] = [];
    const values: any[] = [userId];
    let paramIndex = 2;

    const allowedFields = [
      'company_name', 'description', 'website', 'phone', 'logo', 'banner',
      'address', 'country', 'product_categories', 'certifications', 'social_links'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        const dbField = field;
        updates.push(`${dbField} = $${paramIndex++}`);
        
        if (typeof data[field] === 'object') {
          values.push(JSON.stringify(data[field]));
        } else {
          values.push(data[field]);
        }
      }
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE supplier_profiles 
      SET ${updates.join(', ')}
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  // Supplier Testimonials
  async createSupplierTestimonial(data: {
    supplierId: number;
    customerName: string;
    customerCompany?: string;
    rating: number;
    testimonialText: string;
    isFeatured?: boolean;
    isApproved?: boolean;
  }) {
    const result = await sql`
      INSERT INTO supplier_testimonials (
        supplier_id, customer_name, customer_company, rating, 
        testimonial_text, is_featured, is_approved
      )
      VALUES (
        ${data.supplierId},
        ${data.customerName},
        ${data.customerCompany || null},
        ${data.rating},
        ${data.testimonialText},
        ${data.isFeatured || false},
        ${data.isApproved || true}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getSupplierTestimonials(supplierId?: number, approvedOnly: boolean = true) {
    if (supplierId) {
      const query = approvedOnly
        ? sql`
            SELECT * FROM supplier_testimonials 
            WHERE supplier_id = ${supplierId} AND is_approved = true
            ORDER BY created_at DESC
          `
        : sql`
            SELECT * FROM supplier_testimonials 
            WHERE supplier_id = ${supplierId}
            ORDER BY created_at DESC
          `;
      const result = await query;
      return result.rows;
    } else {
      const query = approvedOnly
        ? sql`
            SELECT * FROM supplier_testimonials 
            WHERE is_approved = true
            ORDER BY created_at DESC
          `
        : sql`SELECT * FROM supplier_testimonials ORDER BY created_at DESC`;
      const result = await query;
      return result.rows;
    }
  },

  async getSupplierTestimonial(id: number) {
    const result = await sql`
      SELECT * FROM supplier_testimonials WHERE id = ${id}
    `;
    return result.rows[0] || null;
  },

  async updateSupplierTestimonial(id: number, data: {
    customerName?: string;
    customerCompany?: string;
    rating?: number;
    testimonialText?: string;
    isFeatured?: boolean;
    isApproved?: boolean;
  }) {
    const updates: string[] = [];
    const values: any[] = [id];
    
    if (data.customerName !== undefined) {
      values.push(data.customerName);
      updates.push('customer_name = $' + values.length);
    }
    if (data.customerCompany !== undefined) {
      values.push(data.customerCompany);
      updates.push('customer_company = $' + values.length);
    }
    if (data.rating !== undefined) {
      values.push(data.rating);
      updates.push('rating = $' + values.length);
    }
    if (data.testimonialText !== undefined) {
      values.push(data.testimonialText);
      updates.push('testimonial_text = $' + values.length);
    }
    if (data.isFeatured !== undefined) {
      values.push(data.isFeatured);
      updates.push('is_featured = $' + values.length);
    }
    if (data.isApproved !== undefined) {
      values.push(data.isApproved);
      updates.push('is_approved = $' + values.length);
    }
    
    if (updates.length === 0) {
      return this.getSupplierTestimonial(id);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    const query = `
      UPDATE supplier_testimonials 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deleteSupplierTestimonial(id: number) {
    const result = await sql`
      DELETE FROM supplier_testimonials WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  // Supplier Products
  async getSupplierProducts(supplierId?: number, status?: string) {
    let query = `
      SELECT p.*, sp.company_name as supplier_name, u.username
      FROM products p
      LEFT JOIN supplier_profiles sp ON p.supplier_id = sp.user_id
      LEFT JOIN users u ON p.supplier_id = u.id
      WHERE p.supplier_id IS NOT NULL
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (supplierId) {
      query += ` AND p.supplier_id = $${paramIndex++}`;
      params.push(supplierId);
    }

    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await sql.query(query, params);
    return result.rows;
  },

  async createSupplierProduct(supplierId: number, data: {
    name: string;
    description: string;
    category: string;
    price: number;
    images?: string[];
    specifications?: any;
    features?: string[];
    status?: string;
  }) {
    const result = await sql`
      INSERT INTO products (
        supplier_id, name, description, category, price, 
        images, specifications, features, status
      )
      VALUES (
        ${supplierId},
        ${data.name},
        ${data.description},
        ${data.category},
        ${data.price},
        ${JSON.stringify(data.images || [])},
        ${JSON.stringify(data.specifications || {})},
        ${JSON.stringify(data.features || [])},
        ${data.status || 'pending'}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateSupplierProduct(productId: number, supplierId: number, data: any) {
    const updates: string[] = [];
    const values: any[] = [productId, supplierId];
    let paramIndex = 3;

    const allowedFields = [
      'name', 'description', 'category', 'price', 'original_price', 
      'discount', 'images', 'specifications', 'features', 'status'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        
        if (typeof data[field] === 'object') {
          values.push(JSON.stringify(data[field]));
        } else {
          values.push(data[field]);
        }
      }
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE products 
      SET ${updates.join(', ')}
      WHERE id = $1 AND supplier_id = $2
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deleteSupplierProduct(productId: number, supplierId: number) {
    const result = await sql`
      DELETE FROM products 
      WHERE id = ${productId} AND supplier_id = ${supplierId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  // Product Reviews
  async createProductReview(productId: number, userId: number, data: {
    rating: number;
    title?: string;
    content: string;
    images?: string[];
    verifiedPurchase?: boolean;
  }) {
    const result = await sql`
      INSERT INTO product_reviews (
        product_id, user_id, rating, title, content, images, verified_purchase
      )
      VALUES (
        ${productId},
        ${userId},
        ${data.rating},
        ${data.title || null},
        ${data.content},
        ${JSON.stringify(data.images || [])},
        ${data.verifiedPurchase || false}
      )
      ON CONFLICT (product_id, user_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        images = EXCLUDED.images,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    // Update product rating average
    await this.updateProductRating(productId);
    
    return result.rows[0];
  },

  async getProductReviews(productId: number, limit: number = 50, offset: number = 0) {
    const result = await sql`
      SELECT r.*, u.username, up.avatar
      FROM product_reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE r.product_id = ${productId} AND r.status = 'published'
      ORDER BY r.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    return result.rows;
  },

  async getUserReviews(userId: number, limit: number = 50) {
    const result = await sql`
      SELECT r.*, p.name as product_name, p.image as product_image
      FROM product_reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ${userId}
      ORDER BY r.created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async updateProductReview(reviewId: number, userId: number, data: {
    rating?: number;
    title?: string;
    content?: string;
    images?: string[];
  }) {
    const updates: string[] = [];
    const values: any[] = [reviewId, userId];
    let paramIndex = 3;

    if (data.rating !== undefined) {
      updates.push(`rating = $${paramIndex++}`);
      values.push(data.rating);
    }
    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(data.content);
    }
    if (data.images !== undefined) {
      updates.push(`images = $${paramIndex++}`);
      values.push(JSON.stringify(data.images));
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE product_reviews 
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await sql.query(query, values);
    
    if (result.rows[0]) {
      await this.updateProductRating(result.rows[0].product_id);
    }
    
    return result.rows[0] || null;
  },

  async deleteProductReview(reviewId: number, userId: number) {
    const result = await sql`
      DELETE FROM product_reviews 
      WHERE id = ${reviewId} AND user_id = ${userId}
      RETURNING product_id
    `;
    
    if (result.rows[0]) {
      await this.updateProductRating(result.rows[0].product_id);
    }
    
    return result.rows[0];
  },

  async markReviewHelpful(reviewId: number, userId: number) {
    try {
      const result = await sql`
        INSERT INTO review_helpful (review_id, user_id)
        VALUES (${reviewId}, ${userId})
        ON CONFLICT (review_id, user_id) DO NOTHING
        RETURNING *
      `;
      
      if (result.rows[0]) {
        await sql`
          UPDATE product_reviews 
          SET helpful_count = helpful_count + 1
          WHERE id = ${reviewId}
        `;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error marking review helpful:', error);
      throw error;
    }
  },

  async updateReviewHelpful(reviewId: number, helpful: boolean) {
    if (helpful) {
      const result = await sql`
        UPDATE product_reviews 
        SET helpful_count = helpful_count + 1
        WHERE id = ${reviewId}
        RETURNING *
      `;
      return result.rows[0];
    } else {
      const result = await sql`
        UPDATE product_reviews 
        SET not_helpful_count = not_helpful_count + 1
        WHERE id = ${reviewId}
        RETURNING *
      `;
      return result.rows[0];
    }
  },

  async updateProductRating(productId: number) {
    const result = await sql`
      SELECT AVG(rating)::DECIMAL(3,2) as avg_rating, COUNT(*) as review_count
      FROM product_reviews
      WHERE product_id = ${productId} AND status = 'published'
    `;
    
    const avgRating = result.rows[0]?.avg_rating || 0;
    const reviewCount = result.rows[0]?.review_count || 0;
    
    await sql`
      UPDATE products 
      SET rating = ${avgRating}, review_count = ${reviewCount}
      WHERE id = ${productId}
    `;
  },

  // Orders
  async createOrder(userId: number, data: {
    orderNumber: string;
    totalAmount: number;
    currency?: string;
    paymentMethod?: string;
    shippingAddress?: any;
    billingAddress?: any;
    items: any[];
    notes?: string;
  }) {
    const result = await sql`
      INSERT INTO orders (
        user_id, order_number, total_amount, currency, payment_method,
        shipping_address, billing_address, items, notes
      )
      VALUES (
        ${userId},
        ${data.orderNumber},
        ${data.totalAmount},
        ${data.currency || 'USD'},
        ${data.paymentMethod || null},
        ${JSON.stringify(data.shippingAddress || {})},
        ${JSON.stringify(data.billingAddress || {})},
        ${JSON.stringify(data.items)},
        ${data.notes || null}
      )
      RETURNING *
    `;
    
    const order = result.rows[0];
    
    // Create order items
    for (const item of data.items) {
      await sql`
        INSERT INTO order_items (
          order_id, product_id, product_name, product_image,
          quantity, unit_price, total_price
        )
        VALUES (
          ${order.id},
          ${item.productId},
          ${item.productName},
          ${item.productImage || null},
          ${item.quantity},
          ${item.unitPrice},
          ${item.totalPrice}
        )
      `;
    }
    
    return order;
  },

  async getOrder(orderId: number) {
    const result = await sql`
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'productId', oi.product_id,
          'productName', oi.product_name,
          'productImage', oi.product_image,
          'quantity', oi.quantity,
          'unitPrice', oi.unit_price,
          'totalPrice', oi.total_price
        )) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ${orderId}
      GROUP BY o.id
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getOrderByNumber(orderNumber: string) {
    const result = await sql`
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'productId', oi.product_id,
          'productName', oi.product_name,
          'productImage', oi.product_image,
          'quantity', oi.quantity,
          'unitPrice', oi.unit_price,
          'totalPrice', oi.total_price
        )) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.order_number = ${orderNumber}
      GROUP BY o.id
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getUserOrders(userId: number, limit: number = 50, offset: number = 0) {
    const result = await sql`
      SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
      FROM orders o
      WHERE o.user_id = ${userId}
      ORDER BY o.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    return result.rows;
  },

  async hasUserPurchasedProduct(userId: number, productId: number): Promise<{ purchased: boolean; orderId?: number }> {
    const result = await sql`
      SELECT o.id as order_id
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ${userId} 
        AND oi.product_id = ${productId}
        AND o.status IN ('completed', 'delivered', 'shipped')
      LIMIT 1
    `;
    
    if (result.rows.length > 0) {
      return { purchased: true, orderId: result.rows[0].order_id };
    }
    return { purchased: false };
  },

  async updateOrderStatus(orderId: number, status: string, data?: {
    trackingNumber?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
  }) {
    const updates: string[] = [`status = $2`];
    const values: any[] = [orderId, status];
    let paramIndex = 3;

    if (data?.trackingNumber) {
      updates.push(`tracking_number = $${paramIndex++}`);
      values.push(data.trackingNumber);
    }
    if (data?.shippedAt) {
      updates.push(`shipped_at = $${paramIndex++}`);
      values.push(data.shippedAt);
    }
    if (data?.deliveredAt) {
      updates.push(`delivered_at = $${paramIndex++}`);
      values.push(data.deliveredAt);
    }
    if (data?.cancelledAt) {
      updates.push(`cancelled_at = $${paramIndex++}`);
      values.push(data.cancelledAt);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE orders 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  // ============================================
  // PHASE 7: CHAT & MESSAGING
  // ============================================

  // Conversations
  async createConversation(data: {
    type: 'direct' | 'group';
    name?: string;
    createdBy: number;
  }) {
    const result = await sql`
      INSERT INTO conversations (type, name, created_by)
      VALUES (${data.type}, ${data.name || null}, ${data.createdBy})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getConversation(conversationId: number) {
    const result = await sql`
      SELECT * FROM conversations WHERE id = ${conversationId}
    `;
    return result.rows[0] || null;
  },

  async getUserConversations(userId: number, limit: number = 50, offset: number = 0) {
    const result = await sql`
      SELECT c.*, 
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
        (SELECT MAX(created_at) FROM messages m WHERE m.conversation_id = c.id) as last_message_at
      FROM conversations c
      INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = ${userId} AND cp.is_active = true
      ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  },

  async updateConversation(conversationId: number, data: { name?: string; isArchived?: boolean }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.isArchived !== undefined) {
      updates.push(`is_archived = $${paramCount++}`);
      values.push(data.isArchived);
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    values.push(conversationId);

    const query = `
      UPDATE conversations 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deleteConversation(conversationId: number) {
    await sql`DELETE FROM conversations WHERE id = ${conversationId}`;
  },

  // Conversation Participants
  async addParticipant(data: { conversationId: number; userId: number; role?: string }) {
    const result = await sql`
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES (${data.conversationId}, ${data.userId}, ${data.role || 'member'})
      ON CONFLICT (conversation_id, user_id) 
      DO UPDATE SET is_active = true, left_at = NULL
      RETURNING *
    `;
    return result.rows[0];
  },

  async getConversationParticipants(conversationId: number) {
    const result = await sql`
      SELECT cp.*, u.username, u.email
      FROM conversation_participants cp
      INNER JOIN users u ON cp.user_id = u.id
      WHERE cp.conversation_id = ${conversationId} AND cp.is_active = true
      ORDER BY cp.joined_at ASC
    `;
    return result.rows;
  },

  async removeParticipant(conversationId: number, userId: number) {
    await sql`
      UPDATE conversation_participants 
      SET is_active = false, left_at = NOW()
      WHERE conversation_id = ${conversationId} AND user_id = ${userId}
    `;
  },

  async isParticipant(conversationId: number, userId: number): Promise<boolean> {
    const result = await sql`
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = ${conversationId} 
        AND user_id = ${userId} 
        AND is_active = true
    `;
    return result.rows.length > 0;
  },

  async updateParticipantRole(conversationId: number, userId: number, role: string) {
    await sql`
      UPDATE conversation_participants 
      SET role = ${role}
      WHERE conversation_id = ${conversationId} AND user_id = ${userId}
    `;
  },

  // Messages
  async createMessage(data: {
    conversationId: number;
    senderId: number;
    content: string;
    messageType?: string;
    replyToId?: number;
    metadata?: any;
  }) {
    const result = await sql`
      INSERT INTO messages (
        conversation_id, sender_id, content, message_type, reply_to_id, metadata
      ) VALUES (
        ${data.conversationId},
        ${data.senderId},
        ${data.content},
        ${data.messageType || 'text'},
        ${data.replyToId || null},
        ${data.metadata ? JSON.stringify(data.metadata) : null}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getMessage(messageId: number) {
    const result = await sql`
      SELECT m.*, u.username as sender_username
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ${messageId}
    `;
    return result.rows[0] || null;
  },

  async getConversationMessages(
    conversationId: number, 
    limit: number = 50, 
    offset: number = 0,
    beforeMessageId?: number
  ) {
    if (beforeMessageId) {
      const result = await sql`
        SELECT m.*, u.username as sender_username, u.email as sender_email
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ${conversationId} 
          AND m.id < ${beforeMessageId}
          AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
      return result.rows.reverse();
    } else {
      const result = await sql`
        SELECT m.*, u.username as sender_username, u.email as sender_email
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ${conversationId} AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      return result.rows.reverse();
    }
  },

  async updateMessage(messageId: number, data: { content?: string; isEdited?: boolean }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(data.content);
      updates.push(`is_edited = true`);
      updates.push(`edited_at = NOW()`);
    }

    if (updates.length === 0) return null;

    values.push(messageId);

    const query = `
      UPDATE messages 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deleteMessage(messageId: number, hardDelete: boolean = false) {
    if (hardDelete) {
      await sql`DELETE FROM messages WHERE id = ${messageId}`;
    } else {
      await sql`
        UPDATE messages 
        SET is_deleted = true, content = '[Deleted]', deleted_at = NOW()
        WHERE id = ${messageId}
      `;
    }
  },

  async searchMessages(conversationId: number, searchTerm: string, limit: number = 20) {
    const result = await sql`
      SELECT m.*, u.username as sender_username
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ${conversationId} 
        AND m.is_deleted = false
        AND m.content ILIKE ${`%${searchTerm}%`}
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  // Message Attachments
  async createAttachment(data: {
    messageId: number;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }) {
    const result = await sql`
      INSERT INTO message_attachments (
        message_id, file_url, file_name, file_type, file_size
      ) VALUES (
        ${data.messageId}, ${data.fileUrl}, ${data.fileName}, 
        ${data.fileType}, ${data.fileSize}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getMessageAttachments(messageId: number) {
    const result = await sql`
      SELECT * FROM message_attachments WHERE message_id = ${messageId}
    `;
    return result.rows;
  },

  async deleteAttachment(attachmentId: number) {
    await sql`DELETE FROM message_attachments WHERE id = ${attachmentId}`;
  },

  // Message Reactions
  async addReaction(data: { messageId: number; userId: number; emoji: string }) {
    const result = await sql`
      INSERT INTO message_reactions (message_id, user_id, emoji)
      VALUES (${data.messageId}, ${data.userId}, ${data.emoji})
      ON CONFLICT (message_id, user_id, emoji) DO NOTHING
      RETURNING *
    `;
    return result.rows[0];
  },

  async removeReaction(data: { messageId: number; userId: number; emoji: string }) {
    await sql`
      DELETE FROM message_reactions 
      WHERE message_id = ${data.messageId} 
        AND user_id = ${data.userId} 
        AND emoji = ${data.emoji}
    `;
  },

  async getMessageReactions(messageId: number) {
    const result = await sql`
      SELECT r.*, u.username
      FROM message_reactions r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.message_id = ${messageId}
      ORDER BY r.created_at ASC
    `;
    return result.rows;
  },

  async getReactionCounts(messageId: number) {
    const result = await sql`
      SELECT emoji, COUNT(*) as count, 
        json_agg(json_build_object('userId', user_id, 'username', u.username)) as users
      FROM message_reactions r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE message_id = ${messageId}
      GROUP BY emoji
    `;
    return result.rows;
  },

  // Message Read Status
  async markMessageAsRead(data: { messageId: number; userId: number }) {
    const result = await sql`
      INSERT INTO message_read_status (message_id, user_id)
      VALUES (${data.messageId}, ${data.userId})
      ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = NOW()
      RETURNING *
    `;
    return result.rows[0];
  },

  async markConversationAsRead(conversationId: number, userId: number) {
    // Mark all messages in conversation as read
    const result = await sql`
      INSERT INTO message_read_status (message_id, user_id)
      SELECT m.id, ${userId}
      FROM messages m
      WHERE m.conversation_id = ${conversationId}
        AND m.sender_id != ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM message_read_status mrs 
          WHERE mrs.message_id = m.id AND mrs.user_id = ${userId}
        )
      ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = NOW()
    `;
    return result.rowCount || 0;
  },

  async getUnreadMessageCount(userId: number, conversationId?: number) {
    if (conversationId) {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM messages m
        WHERE m.conversation_id = ${conversationId}
          AND m.sender_id != ${userId}
          AND NOT EXISTS (
            SELECT 1 FROM message_read_status mrs 
            WHERE mrs.message_id = m.id AND mrs.user_id = ${userId}
          )
      `;
      return parseInt(result.rows[0]?.count || '0', 10);
    } else {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM messages m
        INNER JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
        WHERE cp.user_id = ${userId}
          AND cp.is_active = true
          AND m.sender_id != ${userId}
          AND NOT EXISTS (
            SELECT 1 FROM message_read_status mrs 
            WHERE mrs.message_id = m.id AND mrs.user_id = ${userId}
          )
      `;
      return parseInt(result.rows[0]?.count || '0', 10);
    }
  },

  async getMessageReadStatus(messageId: number) {
    const result = await sql`
      SELECT mrs.*, u.username
      FROM message_read_status mrs
      LEFT JOIN users u ON mrs.user_id = u.id
      WHERE mrs.message_id = ${messageId}
      ORDER BY mrs.read_at DESC
    `;
    return result.rows;
  },

  // Typing Indicators (real-time, stored temporarily)
  async setTypingStatus(data: { conversationId: number; userId: number; isTyping: boolean }) {
    if (data.isTyping) {
      // Store that user is typing (expires after 10 seconds)
      const expiresAt = new Date(Date.now() + 10000).toISOString();
      await sql`
        INSERT INTO typing_indicators (conversation_id, user_id, expires_at)
        VALUES (${data.conversationId}, ${data.userId}, ${expiresAt})
        ON CONFLICT (conversation_id, user_id) 
        DO UPDATE SET expires_at = ${expiresAt}
      `;
    } else {
      await sql`
        DELETE FROM typing_indicators 
        WHERE conversation_id = ${data.conversationId} AND user_id = ${data.userId}
      `;
    }
  },

  async getTypingUsers(conversationId: number) {
    const now = new Date().toISOString();
    const result = await sql`
      SELECT ti.user_id, u.username
      FROM typing_indicators ti
      LEFT JOIN users u ON ti.user_id = u.id
      WHERE ti.conversation_id = ${conversationId} AND ti.expires_at > ${now}
    `;
    return result.rows;
  },

  async cleanupExpiredTypingIndicators() {
    const now = new Date().toISOString();
    await sql`DELETE FROM typing_indicators WHERE expires_at <= ${now}`;
  },

  // ============================================
  // PHASE 8: SEARCH & DISCOVERY
  // ============================================

  // Search Index
  async indexContent(data: {
    entityType: string;
    entityId: number;
    title: string;
    content: string;
    metadata?: any;
  }) {
    const result = await sql`
      INSERT INTO search_index (entity_type, entity_id, title, content, metadata, indexed_at)
      VALUES (${data.entityType}, ${data.entityId}, ${data.title}, ${data.content}, ${JSON.stringify(data.metadata || {})}, CURRENT_TIMESTAMP)
      ON CONFLICT (entity_type, entity_id) 
      DO UPDATE SET 
        title = ${data.title},
        content = ${data.content},
        metadata = ${JSON.stringify(data.metadata || {})},
        indexed_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  },

  async searchContent(searchTerm: string, entityTypes?: string[], limit: number = 20) {
    let query;
    if (entityTypes && entityTypes.length > 0) {
      const typesArray = `{${entityTypes.join(',')}}`;
      query = sql`
        SELECT *, 
          ts_rank(search_vector, plainto_tsquery('english', ${searchTerm})) as rank
        FROM search_index
        WHERE search_vector @@ plainto_tsquery('english', ${searchTerm})
          AND entity_type = ANY(${typesArray}::text[])
        ORDER BY rank DESC, indexed_at DESC
        LIMIT ${limit}
      `;
    } else {
      query = sql`
        SELECT *, 
          ts_rank(search_vector, plainto_tsquery('english', ${searchTerm})) as rank
        FROM search_index
        WHERE search_vector @@ plainto_tsquery('english', ${searchTerm})
        ORDER BY rank DESC, indexed_at DESC
        LIMIT ${limit}
      `;
    }
    const result = await query;
    return result.rows;
  },

  async removeFromIndex(entityType: string, entityId: number) {
    await sql`DELETE FROM search_index WHERE entity_type = ${entityType} AND entity_id = ${entityId}`;
  },

  async reindexAll() {
    // This would be called to rebuild the entire search index
    await sql`TRUNCATE search_index`;
    // Then re-index all content from other tables
    // This is a placeholder - actual implementation would query all entities
    return { message: 'Reindex initiated' };
  },

  // Search History
  async saveSearchQuery(userId: number, query: string, resultCount: number) {
    const result = await sql`
      INSERT INTO search_history (user_id, query, result_count)
      VALUES (${userId}, ${query}, ${resultCount})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getUserSearchHistory(userId: number, limit: number = 20) {
    const result = await sql`
      SELECT * FROM search_history
      WHERE user_id = ${userId}
      ORDER BY searched_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async clearSearchHistory(userId: number) {
    await sql`DELETE FROM search_history WHERE user_id = ${userId}`;
  },

  async getPopularSearches(limit: number = 10) {
    const result = await sql`
      SELECT query, COUNT(*) as search_count, MAX(searched_at) as last_searched
      FROM search_history
      WHERE searched_at > NOW() - INTERVAL '7 days'
      GROUP BY query
      ORDER BY search_count DESC, last_searched DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  // Search Suggestions
  async createSearchSuggestion(data: { suggestion: string; category?: string; priority?: number }) {
    const result = await sql`
      INSERT INTO search_suggestions (suggestion, category, priority)
      VALUES (${data.suggestion}, ${data.category || null}, ${data.priority || 0})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getSearchSuggestions(prefix: string, limit: number = 10) {
    const result = await sql`
      SELECT * FROM search_suggestions
      WHERE suggestion ILIKE ${prefix + '%'}
      ORDER BY priority DESC, suggestion ASC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async deleteSearchSuggestion(id: number) {
    await sql`DELETE FROM search_suggestions WHERE id = ${id}`;
  },

  // Trending Content
  async trackView(data: { entityType: string; entityId: number; userId?: number }) {
    const result = await sql`
      INSERT INTO trending_content (entity_type, entity_id, view_count, last_viewed)
      VALUES (${data.entityType}, ${data.entityId}, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (entity_type, entity_id)
      DO UPDATE SET 
        view_count = trending_content.view_count + 1,
        last_viewed = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  },

  async getTrendingContent(entityType?: string, limit: number = 20, timeWindow: number = 7) {
    let query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);

    if (entityType) {
      query = sql`
        SELECT * FROM trending_content
        WHERE entity_type = ${entityType} AND last_viewed > ${cutoffDate.toISOString()}
        ORDER BY view_count DESC, last_viewed DESC
        LIMIT ${limit}
      `;
    } else {
      query = sql`
        SELECT * FROM trending_content
        WHERE last_viewed > ${cutoffDate.toISOString()}
        ORDER BY view_count DESC, last_viewed DESC
        LIMIT ${limit}
      `;
    }
    const result = await query;
    return result.rows;
  },

  async resetTrendingCounts() {
    await sql`UPDATE trending_content SET view_count = 0`;
  },

  // Saved Searches
  async saveSearch(userId: number, name: string, query: string, filters?: any) {
    const result = await sql`
      INSERT INTO saved_searches (user_id, name, query, filters)
      VALUES (${userId}, ${name}, ${query}, ${JSON.stringify(filters || {})})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getSavedSearches(userId: number) {
    const result = await sql`
      SELECT * FROM saved_searches
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return result.rows;
  },

  async deleteSavedSearch(id: number, userId: number) {
    await sql`DELETE FROM saved_searches WHERE id = ${id} AND user_id = ${userId}`;
  },

  // Recommendations
  async createRecommendation(data: {
    userId: number;
    entityType: string;
    entityId: number;
    score: number;
    reason?: string;
  }) {
    const result = await sql`
      INSERT INTO recommendations (user_id, entity_type, entity_id, score, reason)
      VALUES (${data.userId}, ${data.entityType}, ${data.entityId}, ${data.score}, ${data.reason || null})
      ON CONFLICT (user_id, entity_type, entity_id)
      DO UPDATE SET 
        score = ${data.score},
        reason = ${data.reason || null},
        created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  },

  async getUserRecommendations(userId: number, entityType?: string, limit: number = 10) {
    let query;
    if (entityType) {
      query = sql`
        SELECT * FROM recommendations
        WHERE user_id = ${userId} AND entity_type = ${entityType}
        ORDER BY score DESC, created_at DESC
        LIMIT ${limit}
      `;
    } else {
      query = sql`
        SELECT * FROM recommendations
        WHERE user_id = ${userId}
        ORDER BY score DESC, created_at DESC
        LIMIT ${limit}
      `;
    }
    const result = await query;
    return result.rows;
  },

  async deleteRecommendation(id: number, userId: number) {
    await sql`DELETE FROM recommendations WHERE id = ${id} AND user_id = ${userId}`;
  },

  async clearUserRecommendations(userId: number) {
    await sql`DELETE FROM recommendations WHERE user_id = ${userId}`;
  },

  // Recently Viewed
  async addToRecentlyViewed(userId: number, entityType: string, entityId: number) {
    // First, check if it exists
    const existing = await sql`
      SELECT * FROM recently_viewed
      WHERE user_id = ${userId} AND entity_type = ${entityType} AND entity_id = ${entityId}
    `;

    if (existing.rows.length > 0) {
      // Update the timestamp
      const result = await sql`
        UPDATE recently_viewed
        SET viewed_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId} AND entity_type = ${entityType} AND entity_id = ${entityId}
        RETURNING *
      `;
      return result.rows[0];
    } else {
      // Insert new record
      const result = await sql`
        INSERT INTO recently_viewed (user_id, entity_type, entity_id)
        VALUES (${userId}, ${entityType}, ${entityId})
        RETURNING *
      `;
      return result.rows[0];
    }
  },

  async getRecentlyViewed(userId: number, entityType?: string, limit: number = 20) {
    let query;
    if (entityType) {
      query = sql`
        SELECT * FROM recently_viewed
        WHERE user_id = ${userId} AND entity_type = ${entityType}
        ORDER BY viewed_at DESC
        LIMIT ${limit}
      `;
    } else {
      query = sql`
        SELECT * FROM recently_viewed
        WHERE user_id = ${userId}
        ORDER BY viewed_at DESC
        LIMIT ${limit}
      `;
    }
    const result = await query;
    return result.rows;
  },

  async clearRecentlyViewed(userId: number) {
    await sql`DELETE FROM recently_viewed WHERE user_id = ${userId}`;
  },

  // Search Filters
  async getAvailableFilters(entityType: string) {
    // This returns metadata about available filters for a given entity type
    // In a real implementation, this would be dynamically generated from the schema
    const filters: any = {
      product: {
        price: { type: 'range', min: 0, max: 10000 },
        category: { type: 'select', options: [] },
        tags: { type: 'multiselect', options: [] },
        rating: { type: 'range', min: 0, max: 5 }
      },
      user: {
        tier: { type: 'select', options: ['Initiate', 'Seeker', 'Knight', 'Lord', 'Master'] },
        reputation: { type: 'range', min: 0, max: 10000 }
      },
      post: {
        created_at: { type: 'daterange' },
        category: { type: 'select', options: [] }
      }
    };

    return filters[entityType] || {};
  },

  // Search Analytics
  async trackSearchAnalytics(data: {
    userId?: number;
    query: string;
    resultCount: number;
    clickedResults: number[];
    searchDuration: number;
  }) {
    const result = await sql`
      INSERT INTO search_analytics (
        user_id, query, result_count, clicked_results, search_duration
      )
      VALUES (
        ${data.userId || null}, 
        ${data.query}, 
        ${data.resultCount}, 
        ${JSON.stringify(data.clickedResults)}, 
        ${data.searchDuration}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getSearchAnalytics(limit: number = 100, offset: number = 0) {
    const result = await sql`
      SELECT 
        query,
        COUNT(*) as search_count,
        AVG(result_count) as avg_results,
        AVG(search_duration) as avg_duration,
        MAX(searched_at) as last_searched
      FROM search_analytics
      WHERE searched_at > NOW() - INTERVAL '30 days'
      GROUP BY query
      ORDER BY search_count DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  },

  async getFailedSearches(limit: number = 50) {
    const result = await sql`
      SELECT query, COUNT(*) as fail_count, MAX(searched_at) as last_searched
      FROM search_analytics
      WHERE result_count = 0 AND searched_at > NOW() - INTERVAL '7 days'
      GROUP BY query
      ORDER BY fail_count DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  // ============================================
  // PHASE 9: PAYMENTS & SUBSCRIPTIONS
  // ============================================

  // Payment Methods
  async addPaymentMethod(data: {
    userId: number;
    type: string;
    provider: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault?: boolean;
    token: string;
  }) {
    // If this is default, unset other defaults first
    if (data.isDefault) {
      await sql`UPDATE payment_methods SET is_default = false WHERE user_id = ${data.userId}`;
    }

    const result = await sql`
      INSERT INTO payment_methods (
        user_id, type, provider, last4, expiry_month, expiry_year, is_default, token
      ) VALUES (
        ${data.userId}, ${data.type}, ${data.provider}, ${data.last4 || null},
        ${data.expiryMonth || null}, ${data.expiryYear || null}, 
        ${data.isDefault || false}, ${data.token}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getUserPaymentMethods(userId: number) {
    const result = await sql`
      SELECT * FROM payment_methods 
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY is_default DESC, created_at DESC
    `;
    return result.rows;
  },

  async getPaymentMethod(id: number) {
    const result = await sql`SELECT * FROM payment_methods WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async setDefaultPaymentMethod(id: number, userId: number) {
    await sql`UPDATE payment_methods SET is_default = false WHERE user_id = ${userId}`;
    const result = await sql`
      UPDATE payment_methods 
      SET is_default = true 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async deletePaymentMethod(id: number, userId: number) {
    await sql`
      UPDATE payment_methods 
      SET is_active = false 
      WHERE id = ${id} AND user_id = ${userId}
    `;
  },

  // Transactions
  async createTransaction(data: {
    userId: number;
    type: string;
    amount: number;
    currency?: string;
    status?: string;
    paymentMethodId?: number;
    orderId?: number;
    description?: string;
    metadata?: any;
  }) {
    const result = await sql`
      INSERT INTO transactions (
        user_id, type, amount, currency, status, payment_method_id, 
        order_id, description, metadata
      ) VALUES (
        ${data.userId}, ${data.type}, ${data.amount}, ${data.currency || 'USD'},
        ${data.status || 'pending'}, ${data.paymentMethodId || null},
        ${data.orderId || null}, ${data.description || null}, 
        ${JSON.stringify(data.metadata || {})}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getTransaction(id: number) {
    const result = await sql`SELECT * FROM transactions WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async getUserTransactions(userId: number, limit: number = 50, offset: number = 0) {
    const result = await sql`
      SELECT * FROM transactions 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  },

  async updateTransactionStatus(id: number, status: string, metadata?: any) {
    const updateData: any = { status };
    if (metadata) {
      updateData.metadata = JSON.stringify(metadata);
    }

    const result = await sql`
      UPDATE transactions 
      SET status = ${status}, 
          metadata = COALESCE(${metadata ? JSON.stringify(metadata) : null}, metadata),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async getTransactionsByOrder(orderId: number) {
    const result = await sql`
      SELECT * FROM transactions 
      WHERE order_id = ${orderId}
      ORDER BY created_at DESC
    `;
    return result.rows;
  },

  // Subscriptions
  async createSubscription(data: {
    userId: number;
    planId: string;
    status?: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd?: boolean;
  }) {
    const result = await sql`
      INSERT INTO subscriptions (
        user_id, plan_id, status, current_period_start, 
        current_period_end, cancel_at_period_end
      ) VALUES (
        ${data.userId}, ${data.planId}, ${data.status || 'active'},
        ${data.currentPeriodStart}, ${data.currentPeriodEnd}, 
        ${data.cancelAtPeriodEnd || false}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getUserSubscription(userId: number) {
    const result = await sql`
      SELECT * FROM subscriptions 
      WHERE user_id = ${userId} AND status IN ('active', 'trialing')
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async updateSubscription(id: number, data: {
    status?: string;
    planId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  }) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(data.status);
    }
    if (data.planId !== undefined) {
      updates.push(`plan_id = $${values.length + 1}`);
      values.push(data.planId);
    }
    if (data.currentPeriodStart !== undefined) {
      updates.push(`current_period_start = $${values.length + 1}`);
      values.push(data.currentPeriodStart);
    }
    if (data.currentPeriodEnd !== undefined) {
      updates.push(`current_period_end = $${values.length + 1}`);
      values.push(data.currentPeriodEnd);
    }
    if (data.cancelAtPeriodEnd !== undefined) {
      updates.push(`cancel_at_period_end = $${values.length + 1}`);
      values.push(data.cancelAtPeriodEnd);
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE subscriptions 
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async cancelSubscription(id: number, cancelAtPeriodEnd: boolean = true) {
    if (cancelAtPeriodEnd) {
      const result = await sql`
        UPDATE subscriptions 
        SET cancel_at_period_end = true,
            canceled_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
      return result.rows[0] || null;
    } else {
      const result = await sql`
        UPDATE subscriptions 
        SET cancel_at_period_end = false,
            status = 'canceled',
            canceled_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
      return result.rows[0] || null;
    }
  },

  // Invoices
  async createInvoice(data: {
    userId: number;
    subscriptionId?: number;
    orderId?: number;
    amount: number;
    currency?: string;
    status?: string;
    dueDate?: string;
    items: any[];
  }) {
    const result = await sql`
      INSERT INTO invoices (
        user_id, subscription_id, order_id, amount, currency, 
        status, due_date, items
      ) VALUES (
        ${data.userId}, ${data.subscriptionId || null}, ${data.orderId || null},
        ${data.amount}, ${data.currency || 'USD'}, ${data.status || 'pending'},
        ${data.dueDate || null}, ${JSON.stringify(data.items)}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getInvoice(id: number) {
    const result = await sql`SELECT * FROM invoices WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async getUserInvoices(userId: number, limit: number = 50, offset: number = 0) {
    const result = await sql`
      SELECT * FROM invoices 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  },

  async updateInvoiceStatus(id: number, status: string, paidAt?: string) {
    const result = await sql`
      UPDATE invoices 
      SET status = ${status},
          paid_at = ${paidAt || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  // Payouts (for suppliers)
  async createPayout(data: {
    userId: number;
    amount: number;
    currency?: string;
    status?: string;
    method?: string;
    destination?: string;
  }) {
    const result = await sql`
      INSERT INTO payouts (
        user_id, amount, currency, status, method, destination
      ) VALUES (
        ${data.userId}, ${data.amount}, ${data.currency || 'USD'},
        ${data.status || 'pending'}, ${data.method || 'bank_transfer'},
        ${data.destination || null}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getPayout(id: number) {
    const result = await sql`SELECT * FROM payouts WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async getUserPayouts(userId: number, limit: number = 50, offset: number = 0) {
    const result = await sql`
      SELECT * FROM payouts 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  },

  async updatePayoutStatus(id: number, status: string, processedAt?: string) {
    const result = await sql`
      UPDATE payouts 
      SET status = ${status},
          processed_at = ${processedAt || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async getPendingPayouts(limit: number = 50) {
    const result = await sql`
      SELECT * FROM payouts 
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  // Wallet/Credits
  async getWallet(userId: number) {
    const result = await sql`
      SELECT * FROM wallets 
      WHERE user_id = ${userId}
    `;
    
    if (result.rows.length === 0) {
      // Create wallet if doesn't exist
      const createResult = await sql`
        INSERT INTO wallets (user_id, balance, currency)
        VALUES (${userId}, 0, 'USD')
        RETURNING *
      `;
      return createResult.rows[0];
    }
    
    return result.rows[0];
  },

  async updateWalletBalance(userId: number, amount: number, type: string, description?: string) {
    // Get current wallet
    const wallet = await db.getWallet(userId);
    const newBalance = parseFloat(wallet.balance) + amount;

    // Update balance
    const result = await sql`
      UPDATE wallets 
      SET balance = ${newBalance},
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING *
    `;

    // Create transaction record
    await sql`
      INSERT INTO wallet_transactions (
        wallet_id, amount, type, balance_after, description
      ) VALUES (
        ${wallet.id}, ${amount}, ${type}, ${newBalance}, ${description || null}
      )
    `;

    return result.rows[0];
  },

  // Refunds
  async getAllRefunds() {
    const result = await sql`
      SELECT 
        r.*,
        u.username,
        u.email,
        o.order_number,
        reviewer.username as reviewer_username
      FROM refunds r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      ORDER BY r.requested_at DESC
    `;
    return result.rows;
  },

  async getRefundById(id: number) {
    const result = await sql`
      SELECT 
        r.*,
        u.username,
        u.email,
        o.order_number,
        reviewer.username as reviewer_username
      FROM refunds r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      WHERE r.id = ${id}
    `;
    return result.rows[0] || null;
  },

  async getRefundsByUser(userId: number) {
    const result = await sql`
      SELECT 
        r.*,
        o.order_number
      FROM refunds r
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE r.user_id = ${userId}
      ORDER BY r.requested_at DESC
    `;
    return result.rows;
  },

  async getRefundsByStatus(status: string) {
    const result = await sql`
      SELECT 
        r.*,
        u.username,
        u.email,
        o.order_number
      FROM refunds r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE r.status = ${status}
      ORDER BY r.requested_at DESC
    `;
    return result.rows;
  },

  async createRefund(data: {
    orderId?: number;
    userId: number;
    amount: number;
    reason: string;
    description?: string;
  }) {
    const result = await sql`
      INSERT INTO refunds (
        order_id, user_id, amount, reason, description, requested_at
      ) VALUES (
        ${data.orderId || null}, ${data.userId}, ${data.amount}, 
        ${data.reason}, ${data.description || null}, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getRefund(id: number) {
    // Alias for getRefundById for backward compatibility
    return this.getRefundById(id);
  },

  async updateRefund(id: number, updates: {
    status?: string;
    reviewedBy?: number;
    reviewerNotes?: string;
    refundMethod?: string;
    refundReference?: string;
  }) {
    const setters = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      setters.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    if (updates.reviewedBy !== undefined) {
      setters.push(`reviewed_by = $${paramIndex++}`);
      values.push(updates.reviewedBy);
      setters.push(`reviewed_at = CURRENT_TIMESTAMP`);
    }

    if (updates.reviewerNotes !== undefined) {
      setters.push(`reviewer_notes = $${paramIndex++}`);
      values.push(updates.reviewerNotes);
    }

    if (updates.refundMethod !== undefined) {
      setters.push(`refund_method = $${paramIndex++}`);
      values.push(updates.refundMethod);
    }

    if (updates.refundReference !== undefined) {
      setters.push(`refund_reference = $${paramIndex++}`);
      values.push(updates.refundReference);
    }

    // Mark as processed if approved or completed
    if (updates.status && ['approved', 'completed'].includes(updates.status)) {
      setters.push(`processed_at = CURRENT_TIMESTAMP`);
    }

    if (setters.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE refunds 
      SET ${setters.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async updateRefundStatus(id: number, status: string, processedAt?: string) {
    // Backward compatibility wrapper
    return this.updateRefund(id, { status });
  },

  async getTransactionRefunds(transactionId: number) {
    // Legacy function - now redirects to order-based refunds
    const result = await sql`
      SELECT * FROM refunds 
      WHERE order_id = ${transactionId}
      ORDER BY requested_at DESC
    `;
    return result.rows;
  },

  async deleteRefund(id: number) {
    await sql`DELETE FROM refunds WHERE id = ${id}`;
  },

  // Reports
  async getAllReports() {
    const result = await sql`
      SELECT 
        r.*,
        reporter.username as reporter_username,
        reported.username as reported_username,
        reviewer.username as reviewer_username
      FROM reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      ORDER BY r.created_at DESC
    `;
    return result.rows;
  },

  async getReportById(id: number) {
    const result = await sql`
      SELECT 
        r.*,
        reporter.username as reporter_username,
        reported.username as reported_username,
        reviewer.username as reviewer_username
      FROM reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      WHERE r.id = ${id}
    `;
    return result.rows[0] || null;
  },

  async getReportsByStatus(status: string) {
    const result = await sql`
      SELECT 
        r.*,
        reporter.username as reporter_username,
        reported.username as reported_username
      FROM reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      WHERE r.status = ${status}
      ORDER BY r.created_at DESC
    `;
    return result.rows;
  },

  async getReportsByReason(reason: string) {
    const result = await sql`
      SELECT 
        r.*,
        reporter.username as reporter_username,
        reported.username as reported_username
      FROM reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      WHERE r.reason = ${reason}
      ORDER BY r.created_at DESC
    `;
    return result.rows;
  },

  async createReport(data: {
    reporterId?: number;
    reportedUserId?: number;
    reportedContentType?: string;
    reportedContentId?: number;
    reason: string;
    description?: string;
  }) {
    const result = await sql`
      INSERT INTO reports (
        reporter_id, reported_user_id, reported_content_type, 
        reported_content_id, reason, description, created_at
      ) VALUES (
        ${data.reporterId || null}, ${data.reportedUserId || null}, 
        ${data.reportedContentType || null}, ${data.reportedContentId || null},
        ${data.reason}, ${data.description || null}, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateReport(id: number, updates: {
    status?: string;
    reviewedBy?: number;
    reviewerNotes?: string;
    actionTaken?: string;
  }) {
    const setters = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      setters.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    if (updates.reviewedBy !== undefined) {
      setters.push(`reviewed_by = $${paramIndex++}`);
      values.push(updates.reviewedBy);
      setters.push(`reviewed_at = CURRENT_TIMESTAMP`);
    }

    if (updates.reviewerNotes !== undefined) {
      setters.push(`reviewer_notes = $${paramIndex++}`);
      values.push(updates.reviewerNotes);
    }

    if (updates.actionTaken !== undefined) {
      setters.push(`action_taken = $${paramIndex++}`);
      values.push(updates.actionTaken);
    }

    // Mark as resolved if status is resolved or dismissed
    if (updates.status && ['resolved', 'dismissed'].includes(updates.status)) {
      setters.push(`resolved_at = CURRENT_TIMESTAMP`);
    }

    if (setters.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE reports 
      SET ${setters.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deleteReport(id: number) {
    await sql`DELETE FROM reports WHERE id = ${id}`;
  },

  async getModerationActionsByReport(reportId: number) {
    const result = await sql`
      SELECT 
        ma.*,
        u.username as moderator_username
      FROM moderation_actions ma
      LEFT JOIN users u ON ma.moderator_id = u.id
      WHERE ma.report_id = ${reportId}
      ORDER BY ma.created_at DESC
    `;
    return result.rows;
  },

  // Live Drops
  async getAllLiveDrops() {
    const result = await sql`
      SELECT 
        ld.*,
        p.name as product_name,
        p.image as product_image,
        u.username as created_by_username
      FROM live_drops ld
      LEFT JOIN products p ON ld.product_id = p.id
      LEFT JOIN users u ON ld.created_by = u.id
      ORDER BY ld.start_time DESC
    `;
    return result.rows;
  },

  async getLiveDropById(id: number) {
    const result = await sql`
      SELECT 
        ld.*,
        p.name as product_name,
        p.image as product_image
      FROM live_drops ld
      LEFT JOIN products p ON ld.product_id = p.id
      WHERE ld.id = ${id}
    `;
    return result.rows[0] || null;
  },

  async getLiveDropsByStatus(status: string) {
    const result = await sql`
      SELECT 
        ld.*,
        p.name as product_name,
        p.image as product_image
      FROM live_drops ld
      LEFT JOIN products p ON ld.product_id = p.id
      WHERE ld.status = ${status}
      ORDER BY ld.start_time DESC
    `;
    return result.rows;
  },

  async createLiveDrop(data: {
    productId: number;
    productName: string;
    pledgeGoal: number;
    startTime: string;
    durationHours?: number;
    createdBy?: number;
  }) {
    const result = await sql`
      INSERT INTO live_drops (
        product_id, product_name, pledge_goal, start_time, 
        duration_hours, created_by, created_at
      ) VALUES (
        ${data.productId}, ${data.productName}, ${data.pledgeGoal},
        ${data.startTime}, ${data.durationHours || 24}, 
        ${data.createdBy || null}, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateLiveDrop(id: number, updates: {
    status?: string;
    currentPledges?: number;
    participantsCount?: number;
    endTime?: string;
  }) {
    const setters = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      setters.push(`status = $${paramIndex++}`);
      values.push(updates.status);

      // Set timestamp fields based on status
      if (updates.status === 'active') {
        setters.push(`started_at = CURRENT_TIMESTAMP`);
      } else if (updates.status === 'ended') {
        setters.push(`ended_at = CURRENT_TIMESTAMP`);
      }
    }

    if (updates.currentPledges !== undefined) {
      setters.push(`current_pledges = $${paramIndex++}`);
      values.push(updates.currentPledges);
    }

    if (updates.participantsCount !== undefined) {
      setters.push(`participants_count = $${paramIndex++}`);
      values.push(updates.participantsCount);
    }

    if (updates.endTime !== undefined) {
      setters.push(`end_time = $${paramIndex++}`);
      values.push(updates.endTime);
    }

    if (setters.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE live_drops 
      SET ${setters.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deleteLiveDrop(id: number) {
    await sql`DELETE FROM live_drops WHERE id = ${id}`;
  },

  async addLiveDropParticipant(dropId: number, userId: number, pledgeAmount: number) {
    const result = await sql`
      INSERT INTO live_drop_participants (
        drop_id, user_id, pledge_amount, joined_at
      ) VALUES (
        ${dropId}, ${userId}, ${pledgeAmount}, CURRENT_TIMESTAMP
      )
      ON CONFLICT (drop_id, user_id) DO UPDATE
      SET pledge_amount = live_drop_participants.pledge_amount + ${pledgeAmount}
      RETURNING *
    `;

    // Update live drop stats
    await sql`
      UPDATE live_drops
      SET 
        current_pledges = (SELECT COALESCE(SUM(pledge_amount), 0) FROM live_drop_participants WHERE drop_id = ${dropId}),
        participants_count = (SELECT COUNT(DISTINCT user_id) FROM live_drop_participants WHERE drop_id = ${dropId})
      WHERE id = ${dropId}
    `;

    return result.rows[0];
  },

  async getLiveDropParticipants(dropId: number) {
    const result = await sql`
      SELECT 
        ldp.*,
        u.username,
        u.tier
      FROM live_drop_participants ldp
      LEFT JOIN users u ON ldp.user_id = u.id
      WHERE ldp.drop_id = ${dropId}
      ORDER BY ldp.joined_at DESC
    `;
    return result.rows;
  },

  async getLiveDropStats() {
    const result = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
        COALESCE(SUM(participants_count), 0) as total_participants,
        COUNT(*) FILTER (WHERE status = 'ended' AND DATE(ended_at) = CURRENT_DATE) as completed_today
      FROM live_drops
    `;
    return result.rows[0] || { active: 0, scheduled: 0, total_participants: 0, completed_today: 0 };
  },

  // Voting Configuration
  async getVotingConfig() {
    const [tierConfig, settings] = await Promise.all([
      sql`SELECT tier, daily_vote_limit, vote_multiplier FROM voting_config ORDER BY tier`,
      sql`SELECT key, value FROM voting_settings`
    ]);

    // Transform to expected structure
    const config: any = {
      tierLimits: {},
      tierMultipliers: {},
      votingEnabled: true,
      doubleVoteWeek: false,
      tripleVoteWeek: false,
      topWinners: 3
    };

    // Build tier limits and multipliers
    for (const row of tierConfig.rows) {
      config.tierLimits[row.tier] = row.daily_vote_limit;
      config.tierMultipliers[row.tier] = row.vote_multiplier;
    }

    // Apply settings
    for (const row of settings.rows) {
      config[row.key] = row.value;
    }

    return config;
  },

  async updateVotingTierConfig(tier: string, dailyLimit: number, multiplier: number, updatedBy?: number) {
    const result = await sql`
      INSERT INTO voting_config (tier, daily_vote_limit, vote_multiplier, updated_by, updated_at)
      VALUES (${tier}, ${dailyLimit}, ${multiplier}, ${updatedBy || null}, CURRENT_TIMESTAMP)
      ON CONFLICT (tier)
      DO UPDATE SET
        daily_vote_limit = ${dailyLimit},
        vote_multiplier = ${multiplier},
        updated_by = ${updatedBy || null},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateVotingSetting(key: string, value: any, updatedBy?: number, description?: string) {
    const result = await sql`
      INSERT INTO voting_settings (key, value, description, updated_by, updated_at)
      VALUES (${key}, ${value}, ${description || null}, ${updatedBy || null}, CURRENT_TIMESTAMP)
      ON CONFLICT (key)
      DO UPDATE SET
        value = ${value},
        description = COALESCE(${description || null}, voting_settings.description),
        updated_by = ${updatedBy || null},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateVotingConfig(config: any, updatedBy?: number) {
    // Update tier configurations
    if (config.tierLimits && config.tierMultipliers) {
      const updates = [];
      for (const [tier, limit] of Object.entries(config.tierLimits)) {
        const multiplier = config.tierMultipliers[tier] || 1;
        updates.push(
          this.updateVotingTierConfig(tier, limit as number, multiplier, updatedBy)
        );
      }
      await Promise.all(updates);
    }

    // Update global settings
    const settingUpdates = [];
    if (config.votingEnabled !== undefined) {
      settingUpdates.push(this.updateVotingSetting('votingEnabled', config.votingEnabled, updatedBy));
    }
    if (config.doubleVoteWeek !== undefined) {
      settingUpdates.push(this.updateVotingSetting('doubleVoteWeek', config.doubleVoteWeek, updatedBy));
    }
    if (config.tripleVoteWeek !== undefined) {
      settingUpdates.push(this.updateVotingSetting('tripleVoteWeek', config.tripleVoteWeek, updatedBy));
    }
    if (config.topWinners !== undefined) {
      settingUpdates.push(this.updateVotingSetting('topWinners', config.topWinners, updatedBy));
    }

    if (settingUpdates.length > 0) {
      await Promise.all(settingUpdates);
    }

    return await this.getVotingConfig();
  },

  async initializeDefaultVotingConfig() {
    // Initialize tier configurations
    await Promise.all([
      this.updateVotingTierConfig('Initiate', 2, 1),
      this.updateVotingTierConfig('Guild', 5, 2),
      this.updateVotingTierConfig('MIGISTUS', 15, 4)
    ]);

    // Initialize settings
    await Promise.all([
      this.updateVotingSetting('votingEnabled', true, undefined, 'Enable/disable voting system'),
      this.updateVotingSetting('doubleVoteWeek', false, undefined, 'Double vote power week'),
      this.updateVotingSetting('tripleVoteWeek', false, undefined, 'Triple vote power week'),
      this.updateVotingSetting('topWinners', 3, undefined, 'Number of top winners displayed')
    ]);

    return await this.getVotingConfig();
  },

  // Tier Rewards/Benefits
  async getTierRewards() {
    const result = await sql`
      SELECT tier, benefit_key, benefit_value, benefit_type
      FROM tier_benefits
      WHERE is_active = true
      ORDER BY tier, display_order, benefit_key
    `;

    // Transform to expected nested structure
    const rewards: any = {};

    for (const row of result.rows) {
      if (!rewards[row.tier]) {
        rewards[row.tier] = {};
      }

      // Handle special cases
      if (row.benefit_key === 'perks' && Array.isArray(row.benefit_value)) {
        rewards[row.tier].perks = row.benefit_value;
      } else {
        rewards[row.tier][row.benefit_key] = row.benefit_value;
      }
    }

    return rewards;
  },

  async getTierBenefits(tier: string) {
    const result = await sql`
      SELECT benefit_key, benefit_value, benefit_type
      FROM tier_benefits
      WHERE tier = ${tier} AND is_active = true
      ORDER BY display_order, benefit_key
    `;

    const benefits: any = {};
    for (const row of result.rows) {
      if (row.benefit_key === 'perks' && Array.isArray(row.benefit_value)) {
        benefits.perks = row.benefit_value;
      } else {
        benefits[row.benefit_key] = row.benefit_value;
      }
    }

    return benefits;
  },

  async updateTierBenefit(
    tier: string,
    benefitKey: string,
    benefitValue: any,
    benefitType: string = 'general',
    updatedBy?: number,
    displayOrder: number = 0
  ) {
    const result = await sql`
      INSERT INTO tier_benefits (
        tier, benefit_key, benefit_value, benefit_type, display_order, updated_by, updated_at
      ) VALUES (
        ${tier}, ${benefitKey}, ${benefitValue}, ${benefitType}, ${displayOrder},
        ${updatedBy || null}, CURRENT_TIMESTAMP
      )
      ON CONFLICT (tier, benefit_key)
      DO UPDATE SET
        benefit_value = ${benefitValue},
        benefit_type = ${benefitType},
        display_order = ${displayOrder},
        updated_by = ${updatedBy || null},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateTierRewards(tierRewards: any, updatedBy?: number) {
    const updates = [];

    for (const [tier, benefits] of Object.entries(tierRewards)) {
      if (typeof benefits === 'object' && benefits !== null) {
        for (const [key, value] of Object.entries(benefits)) {
          const benefitType = key === 'perks' ? 'perk' :
                             key === 'votingMultiplier' ? 'multiplier' :
                             key === 'chatCooldown' ? 'cooldown' :
                             key === 'discount' ? 'discount' : 'general';
          
          updates.push(
            this.updateTierBenefit(tier, key, value, benefitType, updatedBy)
          );
        }
      }
    }

    await Promise.all(updates);
    return await this.getTierRewards();
  },

  async initializeDefaultTierRewards() {
    const defaultRewards = {
      Initiate: {
        perks: ["Access to drops", "1x voting power"],
        votingMultiplier: 1,
        chatCooldown: 30,
        discount: 0
      },
      Guild: {
        perks: ["All Initiate perks", "2x voting power", "Priority support"],
        votingMultiplier: 2,
        chatCooldown: 10,
        discount: 2
      },
      MIGISTUS: {
        perks: ["All Guild perks", "4x voting power", "Exclusive deals", "Early access"],
        votingMultiplier: 4,
        chatCooldown: 3,
        discount: 5
      }
    };

    await this.updateTierRewards(defaultRewards);
    return defaultRewards;
  },

  // ============================================
  // ANALYTICS SYSTEM
  // ============================================

  // Analytics Events
  async createAnalyticsEvent(data: {
    eventType: string;
    userId?: number;
    sessionId?: string;
    productId?: number;
    supplierId?: number;
    pageUrl?: string;
    referrer?: string;
    metadata?: any;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const result = await sql`
      INSERT INTO analytics_events (
        event_type, user_id, session_id, product_id, supplier_id,
        page_url, referrer, metadata, user_agent, ip_address
      )
      VALUES (
        ${data.eventType},
        ${data.userId || null},
        ${data.sessionId || null},
        ${data.productId || null},
        ${data.supplierId || null},
        ${data.pageUrl || null},
        ${data.referrer || null},
        ${JSON.stringify(data.metadata || {})},
        ${data.userAgent || null},
        ${data.ipAddress || null}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getAnalyticsEvents(filters: {
    eventType?: string;
    userId?: number;
    sessionId?: string;
    productId?: number;
    supplierId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    let whereConditions = [];
    let params: any[] = [];
    
    if (filters.eventType) {
      whereConditions.push('event_type = $' + (params.length + 1));
      params.push(filters.eventType);
    }
    if (filters.userId) {
      whereConditions.push('user_id = $' + (params.length + 1));
      params.push(filters.userId);
    }
    if (filters.sessionId) {
      whereConditions.push('session_id = $' + (params.length + 1));
      params.push(filters.sessionId);
    }
    if (filters.productId) {
      whereConditions.push('product_id = $' + (params.length + 1));
      params.push(filters.productId);
    }
    if (filters.supplierId) {
      whereConditions.push('supplier_id = $' + (params.length + 1));
      params.push(filters.supplierId);
    }
    if (filters.startDate) {
      whereConditions.push('created_at >= $' + (params.length + 1));
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereConditions.push('created_at <= $' + (params.length + 1));
      params.push(filters.endDate);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    let query = `
      SELECT * FROM analytics_events 
      ${whereClause}
      ORDER BY created_at DESC
    `;
    
    if (filters.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
    }
    
    const result = await sql.query(query, params);
    return result.rows;
  },

  async getEventStats(filters: {
    supplierId?: number;
    productId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    let whereConditions = [];
    let params: any[] = [];
    
    if (filters.supplierId) {
      whereConditions.push('supplier_id = $' + (params.length + 1));
      params.push(filters.supplierId);
    }
    if (filters.productId) {
      whereConditions.push('product_id = $' + (params.length + 1));
      params.push(filters.productId);
    }
    if (filters.startDate) {
      whereConditions.push('created_at >= $' + (params.length + 1));
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereConditions.push('created_at <= $' + (params.length + 1));
      params.push(filters.endDate);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    const query = `
      SELECT 
        event_type,
        COUNT(*)::int as count,
        COUNT(DISTINCT user_id)::int as unique_users,
        COUNT(DISTINCT session_id)::int as unique_sessions
      FROM analytics_events
      ${whereClause}
      GROUP BY event_type
    `;
    
    const result = await sql.query(query, params);
    return result.rows;
  },

  // User Sessions (Updated to use sessions table)
  async createUserSession(data: {
    userId: number;
    sessionId: string;
    currentPage?: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    // Check if session already exists
    const existing = await sql`
      SELECT * FROM sessions WHERE session_id = ${data.sessionId}
    `;
    
    if (existing.rows.length > 0) {
      // Update existing session
      const result = await sql`
        UPDATE sessions
        SET 
          last_active = CURRENT_TIMESTAMP,
          current_page = ${data.currentPage || null},
          user_agent = COALESCE(${data.userAgent || null}, user_agent),
          ip_address = COALESCE(${data.ipAddress || null}, ip_address),
          is_active = true
        WHERE session_id = ${data.sessionId}
        RETURNING *
      `;
      return result.rows[0];
    } else {
      // Create new session (expires in 24 hours by default)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = await sql`
        INSERT INTO sessions (
          session_id, user_id, expires_at, current_page, user_agent, ip_address
        )
        VALUES (
          ${data.sessionId},
          ${data.userId},
          ${expiresAt.toISOString()},
          ${data.currentPage || null},
          ${data.userAgent || null},
          ${data.ipAddress || null}
        )
        RETURNING *
      `;
      return result.rows[0];
    }
  },

  async updateUserSession(sessionId: string, data: {
    currentPage?: string;
    isActive?: boolean;
  }) {
    const result = await sql`
      UPDATE sessions
      SET 
        last_active = CURRENT_TIMESTAMP,
        current_page = COALESCE(${data.currentPage || null}, current_page),
        is_active = COALESCE(${data.isActive !== undefined ? data.isActive : null}, is_active)
      WHERE session_id = ${sessionId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async getUserSession(sessionId: string) {
    const result = await sql`
      SELECT * FROM sessions 
      WHERE session_id = ${sessionId}
    `;
    return result.rows[0] || null;
  },

  async getActiveSessions(userId?: number) {
    // Updated to use sessions table instead of user_sessions
    return this.getAllActiveSessions(userId);
  },

  async endUserSession(sessionId: string) {
    // Updated to use sessions table instead of user_sessions
    return this.endSession(sessionId);
  },

  // Analytics Aggregates
  async createOrUpdateAggregate(data: {
    aggregateType: string;
    entityType: string;
    entityId: number;
    timePeriod: string;
    periodStart: string;
    periodEnd: string;
    metrics: any;
  }) {
    const result = await sql`
      INSERT INTO analytics_aggregates (
        aggregate_type, entity_type, entity_id, time_period,
        period_start, period_end, metrics
      )
      VALUES (
        ${data.aggregateType},
        ${data.entityType},
        ${data.entityId},
        ${data.timePeriod},
        ${data.periodStart},
        ${data.periodEnd},
        ${JSON.stringify(data.metrics)}
      )
      ON CONFLICT (aggregate_type, entity_type, entity_id, time_period, period_start)
      DO UPDATE SET
        metrics = EXCLUDED.metrics,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  },

  async getAggregates(filters: {
    aggregateType?: string;
    entityType?: string;
    entityId?: number;
    timePeriod?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let whereConditions = ['1=1'];
    let params: any[] = [];
    
    if (filters.aggregateType) {
      whereConditions.push('aggregate_type = $' + (params.length + 1));
      params.push(filters.aggregateType);
    }
    if (filters.entityType) {
      whereConditions.push('entity_type = $' + (params.length + 1));
      params.push(filters.entityType);
    }
    if (filters.entityId) {
      whereConditions.push('entity_id = $' + (params.length + 1));
      params.push(filters.entityId);
    }
    if (filters.timePeriod) {
      whereConditions.push('time_period = $' + (params.length + 1));
      params.push(filters.timePeriod);
    }
    if (filters.startDate) {
      whereConditions.push('period_start >= $' + (params.length + 1));
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereConditions.push('period_end <= $' + (params.length + 1));
      params.push(filters.endDate);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    const query = `
      SELECT * FROM analytics_aggregates 
      ${whereClause}
      ORDER BY period_start DESC
    `;
    
    const result = await sql.query(query, params);
    return result.rows;
  },

  // ============================================
  // PHASE 10: CONTENT MANAGEMENT SYSTEM
  // ============================================

  // Pages
  async createPage(data: {
    title: string;
    slug: string;
    content: any;
    authorId: number;
    status?: string;
    templateId?: number;
    categoryId?: number;
    publishedAt?: string;
  }) {
    const result = await sql`
      INSERT INTO pages (
        title, slug, content, author_id, status, template_id, 
        category_id, published_at
      ) VALUES (
        ${data.title}, ${data.slug}, ${JSON.stringify(data.content)},
        ${data.authorId}, ${data.status || 'draft'}, ${data.templateId || null},
        ${data.categoryId || null}, ${data.publishedAt || null}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getPage(id: number) {
    const result = await sql`SELECT * FROM pages WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async getPageBySlug(slug: string) {
    const result = await sql`SELECT * FROM pages WHERE slug = ${slug}`;
    return result.rows[0] || null;
  },

  async getPages(filters: {
    status?: string;
    categoryId?: number;
    authorId?: number;
    limit?: number;
    offset?: number;
  }) {
    const { status, categoryId, authorId, limit = 50, offset = 0 } = filters;
    
    let query = `SELECT * FROM pages WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (categoryId) {
      query += ` AND category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }
    if (authorId) {
      query += ` AND author_id = $${paramIndex}`;
      params.push(authorId);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await sql.query(query, params);
    return result.rows;
  },

  async updatePage(id: number, data: {
    title?: string;
    slug?: string;
    content?: any;
    status?: string;
    templateId?: number;
    categoryId?: number;
    publishedAt?: string;
  }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(data.title);
      paramIndex++;
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${paramIndex}`);
      values.push(data.slug);
      paramIndex++;
    }
    if (data.content !== undefined) {
      updates.push(`content = $${paramIndex}`);
      values.push(JSON.stringify(data.content));
      paramIndex++;
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(data.status);
      paramIndex++;
    }
    if (data.templateId !== undefined) {
      updates.push(`template_id = $${paramIndex}`);
      values.push(data.templateId);
      paramIndex++;
    }
    if (data.categoryId !== undefined) {
      updates.push(`category_id = $${paramIndex}`);
      values.push(data.categoryId);
      paramIndex++;
    }
    if (data.publishedAt !== undefined) {
      updates.push(`published_at = $${paramIndex}`);
      values.push(data.publishedAt);
      paramIndex++;
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE pages 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deletePage(id: number) {
    await sql`DELETE FROM pages WHERE id = ${id}`;
  },

  // Page Versions
  async createPageVersion(data: {
    pageId: number;
    content: any;
    authorId: number;
    versionNumber: number;
  }) {
    const result = await sql`
      INSERT INTO page_versions (page_id, content, author_id, version_number)
      VALUES (${data.pageId}, ${JSON.stringify(data.content)}, ${data.authorId}, ${data.versionNumber})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getPageVersions(pageId: number, limit: number = 50) {
    const result = await sql`
      SELECT * FROM page_versions 
      WHERE page_id = ${pageId}
      ORDER BY version_number DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async getPageVersion(id: number) {
    const result = await sql`SELECT * FROM page_versions WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async restorePageVersion(pageId: number, versionId: number) {
    const version = await db.getPageVersion(versionId);
    if (!version || version.pageId !== pageId) return null;

    return await db.updatePage(pageId, { content: version.content });
  },

  // Media Library
  async createMedia(data: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedBy: number;
    alt?: string;
    caption?: string;
  }) {
    const result = await sql`
      INSERT INTO media_library (
        filename, original_name, mime_type, size, url, uploaded_by, alt, caption
      ) VALUES (
        ${data.filename}, ${data.originalName}, ${data.mimeType}, ${data.size},
        ${data.url}, ${data.uploadedBy}, ${data.alt || null}, ${data.caption || null}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getMedia(id: number) {
    const result = await sql`SELECT * FROM media_library WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async getMediaList(filters: {
    mimeType?: string;
    uploadedBy?: number;
    limit?: number;
    offset?: number;
  }) {
    const { mimeType, uploadedBy, limit = 50, offset = 0 } = filters;
    
    let query = `SELECT * FROM media_library WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (mimeType) {
      query += ` AND mime_type LIKE $${paramIndex}`;
      params.push(`${mimeType}%`);
      paramIndex++;
    }
    if (uploadedBy) {
      query += ` AND uploaded_by = $${paramIndex}`;
      params.push(uploadedBy);
      paramIndex++;
    }

    query += ` ORDER BY uploaded_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await sql.query(query, params);
    return result.rows;
  },

  async updateMedia(id: number, data: {
    alt?: string;
    caption?: string;
    filename?: string;
  }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.alt !== undefined) {
      updates.push(`alt = $${paramIndex}`);
      values.push(data.alt);
      paramIndex++;
    }
    if (data.caption !== undefined) {
      updates.push(`caption = $${paramIndex}`);
      values.push(data.caption);
      paramIndex++;
    }
    if (data.filename !== undefined) {
      updates.push(`filename = $${paramIndex}`);
      values.push(data.filename);
      paramIndex++;
    }

    if (updates.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE media_library 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deleteMedia(id: number) {
    await sql`DELETE FROM media_library WHERE id = ${id}`;
  },

  // Content Blocks
  async createContentBlock(data: {
    name: string;
    type: string;
    content: any;
    isGlobal?: boolean;
  }) {
    const result = await sql`
      INSERT INTO content_blocks (name, type, content, is_global)
      VALUES (${data.name}, ${data.type}, ${JSON.stringify(data.content)}, ${data.isGlobal || false})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getContentBlock(id: number) {
    const result = await sql`SELECT * FROM content_blocks WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async getContentBlocks(filters: {
    type?: string;
    isGlobal?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const { type, isGlobal, limit = 50, offset = 0 } = filters;
    
    let query = `SELECT * FROM content_blocks WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    if (isGlobal !== undefined) {
      query += ` AND is_global = $${paramIndex}`;
      params.push(isGlobal);
      paramIndex++;
    }

    query += ` ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await sql.query(query, params);
    return result.rows;
  },

  async updateContentBlock(id: number, data: {
    name?: string;
    content?: any;
    isGlobal?: boolean;
  }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(data.name);
      paramIndex++;
    }
    if (data.content !== undefined) {
      updates.push(`content = $${paramIndex}`);
      values.push(JSON.stringify(data.content));
      paramIndex++;
    }
    if (data.isGlobal !== undefined) {
      updates.push(`is_global = $${paramIndex}`);
      values.push(data.isGlobal);
      paramIndex++;
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE content_blocks 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deleteContentBlock(id: number) {
    await sql`DELETE FROM content_blocks WHERE id = ${id}`;
  },

  // Navigation Menus
  async createNavigationMenu(data: {
    name: string;
    location: string;
    items: any[];
  }) {
    const result = await sql`
      INSERT INTO navigation_menus (name, location, items)
      VALUES (${data.name}, ${data.location}, ${JSON.stringify(data.items)})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getNavigationMenu(id: number) {
    const result = await sql`SELECT * FROM navigation_menus WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async getNavigationMenuByLocation(location: string) {
    const result = await sql`
      SELECT * FROM navigation_menus 
      WHERE location = ${location} AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getNavigationMenus() {
    const result = await sql`
      SELECT * FROM navigation_menus 
      ORDER BY name ASC
    `;
    return result.rows;
  },

  async updateNavigationMenu(id: number, data: {
    name?: string;
    items?: any[];
    isActive?: boolean;
  }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(data.name);
      paramIndex++;
    }
    if (data.items !== undefined) {
      updates.push(`items = $${paramIndex}`);
      values.push(JSON.stringify(data.items));
      paramIndex++;
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(data.isActive);
      paramIndex++;
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE navigation_menus 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deleteNavigationMenu(id: number) {
    await sql`DELETE FROM navigation_menus WHERE id = ${id}`;
  },

  // SEO Settings
  async createSEO(data: {
    pageId: number;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    ogImage?: string;
    canonicalUrl?: string;
  }) {
    const result = await sql`
      INSERT INTO seo_settings (
        page_id, meta_title, meta_description, meta_keywords, og_image, canonical_url
      ) VALUES (
        ${data.pageId}, ${data.metaTitle || null}, ${data.metaDescription || null},
        ${data.metaKeywords || null}, ${data.ogImage || null}, ${data.canonicalUrl || null}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getSEO(pageId: number) {
    const result = await sql`SELECT * FROM seo_settings WHERE page_id = ${pageId}`;
    return result.rows[0] || null;
  },

  async updateSEO(pageId: number, data: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    ogImage?: string;
    canonicalUrl?: string;
  }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.metaTitle !== undefined) {
      updates.push(`meta_title = $${paramIndex}`);
      values.push(data.metaTitle);
      paramIndex++;
    }
    if (data.metaDescription !== undefined) {
      updates.push(`meta_description = $${paramIndex}`);
      values.push(data.metaDescription);
      paramIndex++;
    }
    if (data.metaKeywords !== undefined) {
      updates.push(`meta_keywords = $${paramIndex}`);
      values.push(data.metaKeywords);
      paramIndex++;
    }
    if (data.ogImage !== undefined) {
      updates.push(`og_image = $${paramIndex}`);
      values.push(data.ogImage);
      paramIndex++;
    }
    if (data.canonicalUrl !== undefined) {
      updates.push(`canonical_url = $${paramIndex}`);
      values.push(data.canonicalUrl);
      paramIndex++;
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(pageId);

    const query = `
      UPDATE seo_settings 
      SET ${updates.join(', ')}
      WHERE page_id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  // Categories
  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: number;
  }) {
    const result = await sql`
      INSERT INTO content_categories (name, slug, description, parent_id)
      VALUES (${data.name}, ${data.slug}, ${data.description || null}, ${data.parentId || null})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getCategory(id: number) {
    const result = await sql`SELECT * FROM content_categories WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async getCategoryBySlug(slug: string) {
    const result = await sql`SELECT * FROM content_categories WHERE slug = ${slug}`;
    return result.rows[0] || null;
  },

  async getCategories(parentId?: number) {
    if (parentId === undefined) {
      const result = await sql`
        SELECT * FROM content_categories 
        ORDER BY name ASC
      `;
      return result.rows;
    } else {
      const result = await sql`
        SELECT * FROM content_categories 
        WHERE parent_id = ${parentId}
        ORDER BY name ASC
      `;
      return result.rows;
    }
  },

  async updateCategory(id: number, data: {
    name?: string;
    slug?: string;
    description?: string;
  }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(data.name);
      paramIndex++;
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${paramIndex}`);
      values.push(data.slug);
      paramIndex++;
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(data.description);
      paramIndex++;
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE content_categories 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deleteCategory(id: number) {
    await sql`DELETE FROM content_categories WHERE id = ${id}`;
  },

  // Page Templates
  async createTemplate(data: {
    name: string;
    description?: string;
    structure: any;
  }) {
    const result = await sql`
      INSERT INTO page_templates (name, description, structure)
      VALUES (${data.name}, ${data.description || null}, ${JSON.stringify(data.structure)})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getTemplate(id: number) {
    const result = await sql`SELECT * FROM page_templates WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async getTemplates() {
    const result = await sql`
      SELECT * FROM page_templates 
      WHERE is_active = true
      ORDER BY name ASC
    `;
    return result.rows;
  },

  async updateTemplate(id: number, data: {
    name?: string;
    description?: string;
    structure?: any;
    isActive?: boolean;
  }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(data.name);
      paramIndex++;
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(data.description);
      paramIndex++;
    }
    if (data.structure !== undefined) {
      updates.push(`structure = $${paramIndex}`);
      values.push(JSON.stringify(data.structure));
      paramIndex++;
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(data.isActive);
      paramIndex++;
    }

    if (updates.length === 0) return null;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE page_templates 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async deleteTemplate(id: number) {
    await sql`UPDATE page_templates SET is_active = false WHERE id = ${id}`;
  },

  // Admin Settings
  async getAdminSettings() {
    const result = await sql`
      SELECT category, key, value, updated_at
      FROM admin_settings
      ORDER BY category, key
    `;
    
    // Transform flat rows into nested object structure
    const settings: any = {
      site: {},
      voting: { tierMultipliers: {} },
      drops: {},
      features: {},
      security: {}
    };

    for (const row of result.rows) {
      const { category, key, value } = row;
      
      // Handle nested tierMultipliers in voting
      if (category === 'voting' && key === 'tierMultipliers') {
        settings.voting.tierMultipliers = value;
      } else {
        settings[category][key] = value;
      }
    }

    return settings;
  },

  async getAdminSettingsByCategory(category: string) {
    const result = await sql`
      SELECT key, value FROM admin_settings 
      WHERE category = ${category}
    `;
    
    const settings: any = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    
    return settings;
  },

  async updateAdminSetting(category: string, key: string, value: any, updatedBy?: number) {
    const result = await sql`
      INSERT INTO admin_settings (category, key, value, updated_by, updated_at)
      VALUES (${category}, ${key}, ${value}, ${updatedBy || null}, CURRENT_TIMESTAMP)
      ON CONFLICT (category, key) 
      DO UPDATE SET 
        value = ${value},
        updated_by = ${updatedBy || null},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateAdminSettings(settings: any, updatedBy?: number) {
    // Process each category and key
    const updates = [];
    
    for (const [category, categoryData] of Object.entries(settings)) {
      if (category === 'updatedAt') continue; // Skip metadata
      
      if (typeof categoryData === 'object' && categoryData !== null) {
        for (const [key, value] of Object.entries(categoryData)) {
          updates.push(
            sql`
              INSERT INTO admin_settings (category, key, value, updated_by, updated_at)
              VALUES (${category}, ${key}, ${value}, ${updatedBy || null}, CURRENT_TIMESTAMP)
              ON CONFLICT (category, key) 
              DO UPDATE SET 
                value = ${value},
                updated_by = ${updatedBy || null},
                updated_at = CURRENT_TIMESTAMP
            `
          );
        }
      }
    }

    // Execute all updates
    await Promise.all(updates);
    
    // Return updated settings
    return await this.getAdminSettings();
  },

  async initializeDefaultAdminSettings() {
    const defaultSettings = {
      site: {
        siteName: 'MIGISTUS',
        siteDescription: 'The ultimate group buying platform',
        siteTagline: 'Power in Numbers',
        maintenanceMode: false,
        registrationEnabled: true,
        contactEmail: 'contact@migistus.com',
        supportEmail: 'support@migistus.com',
        logo: '/images/logo.png',
        favicon: '/favicon.ico'
      },
      voting: {
        enabled: true,
        maxVotesPerUser: 10,
        votingCooldown: 24,
        tierMultipliers: {
          initiate: 1,
          guild: 2,
          migistus: 3
        },
        autoApproveThreshold: 100
      },
      drops: {
        enabled: true,
        maxActiveDrops: 5,
        defaultDuration: 24,
        pledgeTimeLimit: 2,
        minParticipants: 10,
        maxParticipants: 1000
      },
      features: {
        chatEnabled: true,
        marketingEnabled: true,
        analyticsEnabled: true,
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: false,
        wishlistEnabled: true,
        reviewsEnabled: true
      },
      security: {
        maxLoginAttempts: 5,
        sessionTimeout: 60,
        passwordMinLength: 8,
        twoFactorRequired: false,
        ipWhitelist: [],
        rateLimitPerMinute: 60
      }
    };

    await this.updateAdminSettings(defaultSettings);
    return defaultSettings;
  },

  // Wallet Management Functions
  async getUserWalletBalance(userId: number) {
    const result = await sql`SELECT wallet FROM users WHERE id = ${userId}`;
    return result.rows[0]?.wallet || 0;
  },

  async addWalletTransaction(data: {
    userId: number;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'purchase' | 'refund' | 'transfer_in' | 'transfer_out' | 'admin_adjustment' | 'reward';
    description: string;
    relatedOrderId?: number;
    relatedUserId?: number;
    metadata?: any;
  }) {
    // Get current balance
    const currentBalance = await this.getUserWalletBalance(data.userId);
    const newBalance = Number(currentBalance) + Number(data.amount);

    // Update user's wallet balance
    await sql`
      UPDATE users 
      SET wallet = ${newBalance}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${data.userId}
    `;

    // Record transaction
    const result = await sql`
      INSERT INTO wallet_transactions (
        user_id, amount, transaction_type, description, balance_after,
        related_order_id, related_user_id, metadata
      )
      VALUES (
        ${data.userId}, ${data.amount}, ${data.type}, ${data.description}, ${newBalance},
        ${data.relatedOrderId || null}, ${data.relatedUserId || null}, ${JSON.stringify(data.metadata || {})}
      )
      RETURNING *
    `;

    return result.rows[0];
  },

  async getWalletTransactions(userId: number, limit: number = 50, offset: number = 0) {
    const result = await sql`
      SELECT 
        wt.*,
        ru.username as related_username
      FROM wallet_transactions wt
      LEFT JOIN users ru ON wt.related_user_id = ru.id
      WHERE wt.user_id = ${userId}
      ORDER BY wt.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  },

  async transferFunds(fromUserId: number, toUserId: number, amount: number, description: string) {
    // Validate sender has sufficient balance
    const senderBalance = await this.getUserWalletBalance(fromUserId);
    if (Number(senderBalance) < Number(amount)) {
      throw new Error('Insufficient funds');
    }

    // Deduct from sender
    await this.addWalletTransaction({
      userId: fromUserId,
      amount: -Math.abs(amount),
      type: 'transfer_out',
      description: `Transfer to user #${toUserId}: ${description}`,
      relatedUserId: toUserId
    });

    // Add to recipient
    await this.addWalletTransaction({
      userId: toUserId,
      amount: Math.abs(amount),
      type: 'transfer_in',
      description: `Transfer from user #${fromUserId}: ${description}`,
      relatedUserId: fromUserId
    });

    return { success: true };
  },

  async adjustWalletBalance(userId: number, amount: number, description: string, adminId?: number) {
    return await this.addWalletTransaction({
      userId,
      amount,
      type: 'admin_adjustment',
      description: description || `Admin adjustment${adminId ? ` by admin #${adminId}` : ''}`,
      metadata: { adminId }
    });
  },

  // Community Polls Management
  async createCommunityPoll(data: {
    title: string;
    description: string;
    category?: string;
    options?: any[];
    createdBy?: number;
  }) {
    const result = await sql`
      INSERT INTO community_polls (title, description, category, status, created_by, vote_count)
      VALUES (
        ${data.title},
        ${data.description},
        ${data.category || 'general'},
        'pending',
        ${data.createdBy || null},
        0
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getCommunityPolls(status?: string) {
    if (status) {
      const result = await sql`
        SELECT * FROM community_polls
        WHERE status = ${status}
        ORDER BY created_at DESC
      `;
      return result.rows;
    }
    
    const result = await sql`
      SELECT * FROM community_polls
      ORDER BY created_at DESC
    `;
    return result.rows;
  },

  async getCommunityPoll(pollId: number) {
    const result = await sql`
      SELECT * FROM community_polls
      WHERE id = ${pollId}
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async updateCommunityPoll(pollId: number, updates: {
    status?: string;
    title?: string;
    description?: string;
    category?: string;
    endDate?: Date;
  }) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }
    if (updates.endDate !== undefined) {
      fields.push(`end_date = $${paramIndex++}`);
      values.push(updates.endDate);
    }

    if (fields.length === 0) {
      return await this.getCommunityPoll(pollId);
    }

    fields.push(`updated_at = NOW()`);
    values.push(pollId);

    const result = await sql.query(
      `UPDATE community_polls SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async deleteCommunityPoll(pollId: number) {
    await sql`
      DELETE FROM community_polls
      WHERE id = ${pollId}
    `;
    return { success: true };
  },

  async incrementPollVoteCount(pollId: number) {
    const result = await sql`
      UPDATE community_polls
      SET vote_count = vote_count + 1
      WHERE id = ${pollId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async getCommunityPollStats() {
    const result = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_polls,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_approval,
        COUNT(*) FILTER (WHERE status = 'ended') as ended_polls,
        COALESCE(SUM(vote_count), 0) as total_votes
      FROM community_polls
    `;
    
    const stats = result.rows[0];
    return {
      activePolls: parseInt(stats.active_polls) || 0,
      totalVotes: parseInt(stats.total_votes) || 0,
      pendingApproval: parseInt(stats.pending_approval) || 0,
      endedPolls: parseInt(stats.ended_polls) || 0
    };
  },

  // Product Orders
  async getProductOrders(filters?: { productId?: number; userId?: number }) {
    let query;
    
    if (filters?.productId && filters?.userId) {
      query = sql`
        SELECT * FROM product_orders
        WHERE product_id = ${filters.productId} 
          AND user_id = ${filters.userId}
          AND status != 'cancelled'
        ORDER BY order_date DESC
      `;
    } else if (filters?.productId) {
      query = sql`
        SELECT * FROM product_orders
        WHERE product_id = ${filters.productId}
        ORDER BY order_date DESC
      `;
    } else if (filters?.userId) {
      query = sql`
        SELECT * FROM product_orders
        WHERE user_id = ${filters.userId}
        ORDER BY order_date DESC
      `;
    } else {
      query = sql`
        SELECT * FROM product_orders
        ORDER BY order_date DESC
      `;
    }
    
    const result = await query;
    return result.rows;
  },

  async getProductOrderById(orderId: string) {
    const result = await sql`
      SELECT * FROM product_orders
      WHERE id = ${orderId}
    `;
    return result.rows[0] || null;
  },

  async createProductOrder(data: {
    productId: number;
    userId: number;
    username: string;
    quantity: number;
  }) {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await sql`
      INSERT INTO product_orders (
        id, product_id, user_id, username, quantity, order_date, status
      )
      VALUES (
        ${orderId}, ${data.productId}, ${data.userId}, ${data.username}, 
        ${data.quantity}, NOW(), 'pending'
      )
      RETURNING *
    `;
    
    return result.rows[0];
  },

  async updateProductOrderStatus(orderId: string, status: string) {
    const result = await sql`
      UPDATE product_orders
      SET status = ${status}
      WHERE id = ${orderId}
      RETURNING *
    `;
    return result.rows[0];
  },

  // Product Lifecycle Configuration
  async getProductLifecycleConfig() {
    const result = await sql`
      SELECT * FROM product_lifecycle_config
      ORDER BY last_updated DESC
      LIMIT 1
    `;
    
    if (result.rows[0]) {
      return result.rows[0];
    }
    
    // Return default config if none exists
    return {
      voting_to_coming_soon_threshold: 50,
      coming_soon_duration: 7,
      community_drops_duration: 14,
      auto_promotion_enabled: true
    };
  },

  async updateProductLifecycleConfig(data: {
    votingToComingSoonThreshold: number;
    comingSoonDuration: number;
    communityDropsDuration: number;
    autoPromotionEnabled: boolean;
    updatedBy?: string;
  }) {
    const result = await sql`
      INSERT INTO product_lifecycle_config (
        voting_to_coming_soon_threshold,
        coming_soon_duration,
        community_drops_duration,
        auto_promotion_enabled,
        last_updated,
        updated_by
      )
      VALUES (
        ${data.votingToComingSoonThreshold},
        ${data.comingSoonDuration},
        ${data.communityDropsDuration},
        ${data.autoPromotionEnabled},
        NOW(),
        ${data.updatedBy || 'admin'}
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  async getProductsForLifecycleProcessing() {
    const result = await sql`
      SELECT id, name, votes, stage, stage_entered_at, promoted_at, completed_at
      FROM products
      WHERE stage IN ('voting', 'coming-soon', 'community-drops')
      ORDER BY id
    `;
    return result.rows;
  },

  async updateProductStage(productId: number, stage: string, promotedAt?: string) {
    const result = await sql`
      UPDATE products
      SET 
        stage = ${stage},
        stage_entered_at = NOW(),
        promoted_at = ${promotedAt || new Date().toISOString()},
        completed_at = CASE WHEN ${stage} = 'completed' THEN NOW() ELSE completed_at END
      WHERE id = ${productId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async getProductStageStats() {
    const result = await sql`
      SELECT 
        stage,
        COUNT(*) as count
      FROM products
      GROUP BY stage
    `;
    
    const stats: any = {
      voting: 0,
      'coming-soon': 0,
      'community-drops': 0,
      completed: 0
    };
    
    for (const row of result.rows) {
      const stage = row.stage || 'voting';
      stats[stage] = parseInt(row.count);
    }
    
    return stats;
  },

  // Moderation System
  async getModerationSettings() {
    const result = await sql`
      SELECT * FROM moderation_settings
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    if (result.rows[0]) {
      return {
        profanityList: result.rows[0].profanity_list || [],
        filterSettings: result.rows[0].filter_settings || {}
      };
    }
    
    return {
      profanityList: [],
      filterSettings: {}
    };
  },

  async updateModerationSettings(data: {
    profanityList: string[];
    filterSettings: any;
  }) {
    const result = await sql`
      INSERT INTO moderation_settings (profanity_list, filter_settings, updated_at)
      VALUES (${JSON.stringify(data.profanityList)}, ${JSON.stringify(data.filterSettings)}, NOW())
      RETURNING *
    `;
    return result.rows[0];
  },

  async getModerationLogs(limit: number = 100) {
    const result = await sql`
      SELECT * FROM moderation_logs
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  async createModerationLog(data: {
    type: string;
    action: string;
    reportId?: number;
    moderatorId: number;
    reportedUserId?: number;
  }) {
    const result = await sql`
      INSERT INTO moderation_logs (
        type, action, report_id, moderator_id, reported_user_id, timestamp
      )
      VALUES (
        ${data.type}, ${data.action}, ${data.reportId || null},
        ${data.moderatorId}, ${data.reportedUserId || null}, NOW()
      )
      RETURNING *
    `;
    return result.rows[0];
  },

  // Maintenance Status
  async getMaintenanceStatus() {
    const result = await sql`
      SELECT maintenance_mode FROM site_settings
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    return result.rows[0]?.maintenance_mode || false;
  },

  async setMaintenanceMode(enabled: boolean) {
    const result = await sql`
      INSERT INTO site_settings (maintenance_mode, updated_at)
      VALUES (${enabled}, NOW())
      RETURNING *
    `;
    return result.rows[0];
  },

  // Email Campaigns
  async getEmailCampaigns() {
    const result = await sql`
      SELECT * FROM email_campaigns
      ORDER BY created_at DESC
    `;
    return result.rows;
  },

  async getEmailCampaign(id: number) {
    const result = await sql`
      SELECT * FROM email_campaigns
      WHERE id = ${id}
    `;
    return result.rows[0];
  },

  async createEmailCampaign(data: {
    name: string;
    subject: string;
    content: string;
    targetTier?: string;
    scheduledFor?: string;
    status: string;
  }) {
    const result = await sql`
      INSERT INTO email_campaigns (name, subject, content, target_tier, scheduled_for, status, created_at)
      VALUES (${data.name}, ${data.subject}, ${data.content}, ${data.targetTier || null}, ${data.scheduledFor || null}, ${data.status}, NOW())
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateEmailCampaign(id: number, updates: {
    name?: string;
    subject?: string;
    content?: string;
    targetTier?: string;
    scheduledFor?: string;
    status?: string;
    sentAt?: string;
  }) {
    const result = await sql`
      UPDATE email_campaigns
      SET 
        name = COALESCE(${updates.name || null}, name),
        subject = COALESCE(${updates.subject || null}, subject),
        content = COALESCE(${updates.content || null}, content),
        target_tier = COALESCE(${updates.targetTier || null}, target_tier),
        scheduled_for = COALESCE(${updates.scheduledFor || null}, scheduled_for),
        status = COALESCE(${updates.status || null}, status),
        sent_at = COALESCE(${updates.sentAt || null}, sent_at),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0];
  },

  // Password Reset Tokens
  async createPasswordResetToken(email: string, token: string, expiresAt: Date) {
    const result = await sql`
      INSERT INTO password_reset_tokens (email, token, expires_at, created_at)
      VALUES (${email}, ${token}, ${expiresAt.toISOString()}, NOW())
      RETURNING *
    `;
    return result.rows[0];
  },

  async getPasswordResetToken(token: string) {
    const result = await sql`
      SELECT * FROM password_reset_tokens
      WHERE token = ${token} AND expires_at > NOW() AND used = false
    `;
    return result.rows[0];
  },

  async markPasswordResetTokenUsed(token: string) {
    const result = await sql`
      UPDATE password_reset_tokens
      SET used = true, used_at = NOW()
      WHERE token = ${token}
      RETURNING *
    `;
    return result.rows[0];
  },

  async cleanupExpiredResetTokens() {
    await sql`
      DELETE FROM password_reset_tokens
      WHERE expires_at < NOW() OR used = true
    `;
  },

  // Product Chat Messages
  async getChatMessages(productId: number, limit: number = 100, offset: number = 0) {
    const result = await sql`
      SELECT * FROM product_chat_messages
      WHERE product_id = ${productId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows.reverse(); // Return in chronological order
  },

  async createChatMessage(data: {
    productId: number;
    senderId: number;
    senderName: string;
    message: string;
    filtered: boolean;
  }) {
    const result = await sql`
      INSERT INTO product_chat_messages (product_id, sender_id, sender_name, message, filtered, created_at)
      VALUES (${data.productId}, ${data.senderId}, ${data.senderName}, ${data.message}, ${data.filtered}, NOW())
      RETURNING *
    `;
    return result.rows[0];
  },

  async deleteChatMessage(id: number) {
    await sql`
      DELETE FROM product_chat_messages
      WHERE id = ${id}
    `;
  },

  async clearProductChat(productId: number) {
    await sql`
      DELETE FROM product_chat_messages
      WHERE product_id = ${productId}
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
