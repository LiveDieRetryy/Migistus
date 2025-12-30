-- MIGISTUS Production Database Schema
-- Run this in your Vercel Postgres dashboard to set up the database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  tier VARCHAR(50) DEFAULT 'Initiate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  -- Enforcement fields
  banned BOOLEAN DEFAULT false,
  banned_reason TEXT,
  banned_at TIMESTAMP,
  banned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  muted_until TIMESTAMP,
  muted_reason TEXT,
  muted_at TIMESTAMP,
  muted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  -- Profile fields
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  date_of_birth DATE,
  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(100),
  phone_number VARCHAR(50),
  referral_source VARCHAR(255),
  agree_to_marketing BOOLEAN DEFAULT false,
  -- Financial fields
  wallet DECIMAL(10, 2) DEFAULT 0.00,
  guild_coins INTEGER DEFAULT 0
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  current_page VARCHAR(500),
  is_invisible BOOLEAN DEFAULT false
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  image TEXT,
  category VARCHAR(100),
  stage VARCHAR(50) DEFAULT 'voting',
  stage_entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  supplier_id INTEGER,
  supplier_name VARCHAR(255),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL,
  value INTEGER DEFAULT 1,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff picks table
CREATE TABLE IF NOT EXISTS staff_picks (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  is_staff_pick BOOLEAN DEFAULT true,
  pick_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  drop_start_date TIMESTAMP,
  drop_end_date TIMESTAMP,
  supplier_payment DECIMAL(10, 2),
  expected_revenue DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id)
);

-- Pledges table
CREATE TABLE IF NOT EXISTS pledges (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  page VARCHAR(500),
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles (extended profile data)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar TEXT,
  banner TEXT,
  badges JSONB DEFAULT '[]',
  titles JSONB DEFAULT '[]',
  links JSONB DEFAULT '[]',
  guild_tokens INTEGER DEFAULT 100,
  voting_power INTEGER DEFAULT 1,
  is_invisible BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User statistics (denormalized for performance)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  total_pledges INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  drops_joined INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  show_online_status BOOLEAN DEFAULT true,
  allow_messages BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follows/Followers
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

-- Social Posts
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  type VARCHAR(50) DEFAULT 'post', -- post, announcement, update
  visibility VARCHAR(20) DEFAULT 'public', -- public, followers, private
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Likes
CREATE TABLE IF NOT EXISTS post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- Post Comments
CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Applications
CREATE TABLE IF NOT EXISTS supplier_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website TEXT,
  description TEXT,
  product_categories JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by INTEGER REFERENCES users(id),
  review_notes TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Profiles
CREATE TABLE IF NOT EXISTS supplier_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  logo TEXT,
  banner TEXT,
  description TEXT,
  website TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  country VARCHAR(100),
  certifications JSONB DEFAULT '[]',
  product_categories JSONB DEFAULT '[]',
  social_links JSONB DEFAULT '{}',
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  reported_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'published', -- published, pending, hidden
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, user_id)
);

-- Review Helpful Votes
CREATE TABLE IF NOT EXISTS review_helpful (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
  shipping_address JSONB,
  billing_address JSONB,
  items JSONB NOT NULL, -- Array of order items
  notes TEXT,
  tracking_number VARCHAR(255),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items (detailed tracking)
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations (Direct Messaging)
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'accepted', -- accepted, pending, ignored
  initiated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_users CHECK (user1_id != user2_id),
  CONSTRAINT ordered_users UNIQUE (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
);

-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  deleted_for INTEGER[] DEFAULT ARRAY[]::integer[], -- Array of user IDs who deleted this message
  reactions JSONB DEFAULT '[]', -- Array of reactions with userId and emoji
  reply_to_id INTEGER REFERENCES direct_messages(id), -- For threaded replies
  edited BOOLEAN DEFAULT false, -- Whether message was edited
  edited_at TIMESTAMP, -- When message was last edited
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_stage ON products(stage);
CREATE INDEX IF NOT EXISTS idx_votes_product_id ON votes(product_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_pledges_product_id ON pledges(product_id);
CREATE INDEX IF NOT EXISTS idx_pledges_user_id ON pledges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_applications_user_id ON supplier_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_applications_status ON supplier_applications(status);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_user_id ON supplier_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_slug ON supplier_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_is_active ON supplier_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_read ON direct_messages(read) WHERE read = false;

-- Admin Settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);
CREATE INDEX IF NOT EXISTS idx_admin_settings_category_key ON admin_settings(category, key);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  reviewer_notes TEXT,
  processed_at TIMESTAMP,
  refund_method VARCHAR(50),
  refund_reference VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requested_at ON refunds(requested_at DESC);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reported_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reported_content_type VARCHAR(50),
  reported_content_id INTEGER,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by INTEGER REFERENCES users(id),
  reviewer_notes TEXT,
  action_taken VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Moderation Actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  moderator_id INTEGER REFERENCES users(id),
  action_type VARCHAR(50),
  duration INTERVAL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_report ON moderation_actions(report_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);

-- Live Drops table
CREATE TABLE IF NOT EXISTS live_drops (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  pledge_goal DECIMAL(10,2) NOT NULL,
  current_pledges DECIMAL(10,2) DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_hours INTEGER DEFAULT 24,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_drops_product ON live_drops(product_id);
CREATE INDEX IF NOT EXISTS idx_live_drops_status ON live_drops(status);
CREATE INDEX IF NOT EXISTS idx_live_drops_start_time ON live_drops(start_time);

-- Live Drop Participants table
CREATE TABLE IF NOT EXISTS live_drop_participants (
  id SERIAL PRIMARY KEY,
  drop_id INTEGER REFERENCES live_drops(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  pledge_amount DECIMAL(10,2) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(drop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_drop_participants_drop ON live_drop_participants(drop_id);
CREATE INDEX IF NOT EXISTS idx_live_drop_participants_user ON live_drop_participants(user_id);

-- Voting Configuration table (tier-based limits and multipliers)
CREATE TABLE IF NOT EXISTS voting_config (
  id SERIAL PRIMARY KEY,
  tier VARCHAR(50) NOT NULL UNIQUE,
  daily_vote_limit INTEGER NOT NULL,
  vote_multiplier INTEGER NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voting Settings table (global voting rules)
CREATE TABLE IF NOT EXISTS voting_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voting_config_tier ON voting_config(tier);

-- Tier Benefits table
CREATE TABLE IF NOT EXISTS tier_benefits (
  id SERIAL PRIMARY KEY,
  tier VARCHAR(50) NOT NULL,
  benefit_type VARCHAR(50) NOT NULL,
  benefit_key VARCHAR(100) NOT NULL,
  benefit_value JSONB NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tier, benefit_key)
);

CREATE INDEX IF NOT EXISTS idx_tier_benefits_tier ON tier_benefits(tier);
CREATE INDEX IF NOT EXISTS idx_tier_benefits_type ON tier_benefits(benefit_type);
CREATE INDEX IF NOT EXISTS idx_tier_benefits_active ON tier_benefits(is_active) WHERE is_active = true;
-- Analytics Events table (tracks all user interactions)
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  supplier_id INTEGER,
  page_url TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_product ON analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_supplier ON analytics_events(supplier_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

-- Analytics Aggregates table (pre-computed metrics for performance)
CREATE TABLE IF NOT EXISTS analytics_aggregates (
  id SERIAL PRIMARY KEY,
  aggregate_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  time_period VARCHAR(20) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(aggregate_type, entity_type, entity_id, time_period, period_start)
);

CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_type ON analytics_aggregates(aggregate_type);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_entity ON analytics_aggregates(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_period ON analytics_aggregates(time_period, period_start);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_updated ON analytics_aggregates(updated_at DESC);

-- User Sessions table (tracks active user sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  current_page TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  is_active BOOLEAN DEFAULT true,
  logout_time TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity DESC);

-- Supplier Testimonials table
CREATE TABLE IF NOT EXISTS supplier_testimonials (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_company VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  testimonial_text TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_supplier_testimonials_supplier ON supplier_testimonials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_testimonials_featured ON supplier_testimonials(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_supplier_testimonials_approved ON supplier_testimonials(is_approved) WHERE is_approved = true;

-- Enforcement Log table (tracks admin enforcement actions)
CREATE TABLE IF NOT EXISTS enforcement_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL, -- 'ban', 'unban', 'mute', 'unmute'
  reason TEXT,
  duration_minutes INTEGER, -- for mutes
  expires_at TIMESTAMP, -- for mutes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enforcement_log_user ON enforcement_log(user_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_log_admin ON enforcement_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_log_action ON enforcement_log(action_type);
CREATE INDEX IF NOT EXISTS idx_enforcement_log_created ON enforcement_log(created_at DESC);

-- Push Subscriptions table (for web push notifications)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
