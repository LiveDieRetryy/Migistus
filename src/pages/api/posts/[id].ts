import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const postId = parseInt(id as string);

  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  if (req.method === 'GET') {
    try {
      const post = await db.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      return res.status(200).json({ post });
    } catch (error) {
      console.error('Error fetching post:', error);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }
  }

  if (req.method === 'PUT') {
    const session = await getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { content, imageUrl, visibility } = req.body;

      const post = await db.updatePost(postId, session.userId, {
        content,
        imageUrl,
        visibility
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found or unauthorized' });
      }

      return res.status(200).json({ post });
    } catch (error) {
      console.error('Error updating post:', error);
      return res.status(500).json({ error: 'Failed to update post' });
    }
  }

  if (req.method === 'DELETE') {
    const session = await getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const post = await db.deletePost(postId, session.userId);

      if (!post) {
        return res.status(404).json({ error: 'Post not found or unauthorized' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
