import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { emitActivity } from '@/utils/socketEmitter';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { userId, type, limit, offset, feed } = req.query;
      const session = await getSessionFromRequest(req);

      // If feed=true, get personalized feed for logged-in user
      if (feed === 'true' && session?.userId) {
        const posts = await db.getFeedPosts(
          session.userId,
          parseInt(limit as string) || 50,
          parseInt(offset as string) || 0
        );
        return res.status(200).json({ posts });
      }

      // Otherwise get public posts with optional filters
      const posts = await db.getPosts({
        userId: userId ? parseInt(userId as string) : undefined,
        type: type as string,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0
      });

      return res.status(200).json({ posts });
    } catch (error) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }

  if (req.method === 'POST') {
    const session = await getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { content, imageUrl, type, visibility } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const post = await db.createPost(session.userId, {
        content,
        imageUrl,
        type,
        visibility
      });

      // Emit real-time activity for new post
      emitActivity(session.userId, {
        id: post.id.toString(),
        type: 'post',
        content: content,
        timestamp: new Date().toISOString()
      });

      return res.status(201).json({ post });
    } catch (error) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
