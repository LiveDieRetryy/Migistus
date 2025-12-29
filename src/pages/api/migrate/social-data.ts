import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

/**
 * Social Data Migration Endpoint
 * 
 * Migrates social posts, likes, and comments from localStorage to database.
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
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ error: 'Posts array is required' });
    }

    let migratedPosts = 0;
    let migratedComments = 0;
    const errors: string[] = [];

    // Migrate posts
    for (const post of posts) {
      try {
        // Only migrate posts created by this user
        if (post.userId !== userId) continue;

        // Create post
        const newPost = await db.createPost(userId, {
          content: post.content || post.text,
          imageUrl: post.imageUrl || post.image,
          type: post.type || 'post',
          visibility: post.visibility || 'public'
        });

        migratedPosts++;

        // Migrate comments if they exist
        if (post.comments && Array.isArray(post.comments)) {
          for (const comment of post.comments) {
            try {
              await db.createComment(
                newPost.id,
                comment.userId || userId,
                comment.content || comment.text
              );
              migratedComments++;
            } catch (error) {
              console.error('Error migrating comment:', error);
              errors.push(`Comment migration failed: ${comment.id || 'unknown'}`);
            }
          }
        }

        // Set likes count if exists
        if (post.likes || post.likesCount) {
          const likesCount = post.likesCount || (Array.isArray(post.likes) ? post.likes.length : 0);
          if (likesCount > 0) {
            // Update likes count directly
            await db.updatePost(newPost.id, userId, {});
          }
        }
      } catch (error) {
        console.error('Error migrating post:', error);
        errors.push(`Post migration failed: ${post.id || 'unknown'}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Social data migration completed',
      migrated: {
        posts: migratedPosts,
        comments: migratedComments
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
