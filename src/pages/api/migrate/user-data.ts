import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

/**
 * Migration Endpoint
 * 
 * Migrates user data from localStorage to database.
 * Should be called once when user first logs in with new system.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionFromRequest(req);

  if (!session || !session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.userId;

  try {
    const { profile, stats, settings, follows, wishlist } = req.body;

    let migratedItems: string[] = [];

    // Migrate profile
    if (profile) {
      await db.createUserProfile(userId, {
        bio: profile.bio,
        avatar: profile.avatar,
        banner: profile.banner,
        badges: profile.badges || [],
        titles: profile.titles || [],
        links: profile.links || [],
        guildTokens: profile.guildTokens || 100,
        votingPower: profile.votingPower || 1
      });
      migratedItems.push('profile');
    }

    // Migrate stats
    if (stats) {
      await db.createUserStats(userId);
      await db.updateUserStats(userId, {
        followers: stats.followers || 0,
        following: stats.following || 0,
        totalPledges: stats.totalPledges || 0,
        totalVotes: stats.totalVotes || 0,
        dropsJoined: stats.dropsJoined || 0,
        profileViews: stats.profileViews || 0,
        postsCount: stats.postsCount || 0
      });
      migratedItems.push('stats');
    }

    // Migrate settings
    if (settings) {
      await db.createUserSettings(userId, {
        showOnlineStatus: settings.showOnlineStatus !== false,
        allowMessages: settings.allowMessages !== false,
        emailNotifications: settings.emailNotifications !== false,
        marketingEmails: settings.marketingEmails === true,
        preferences: settings.preferences || {}
      });
      migratedItems.push('settings');
    }

    // Migrate follows
    if (follows && Array.isArray(follows)) {
      for (const follow of follows) {
        if (follow.followerId === userId) {
          try {
            await db.followUser(userId, follow.followingId);
          } catch (error) {
            console.error('Error migrating follow:', error);
          }
        }
      }
      migratedItems.push(`${follows.length} follows`);
    }

    // Migrate wishlist
    if (wishlist && Array.isArray(wishlist)) {
      for (const productId of wishlist) {
        try {
          await db.addToWishlist(userId, productId);
        } catch (error) {
          console.error('Error migrating wishlist item:', error);
        }
      }
      migratedItems.push(`${wishlist.length} wishlist items`);
    }

    return res.status(200).json({
      success: true,
      message: 'Data migration completed',
      migrated: migratedItems
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
