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
      const { limit } = req.query;
      const comments = await db.getComments(
        postId,
        limit ? parseInt(limit as string) : 100
      );
      return res.status(200).json({ comments });
    } catch (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  if (req.method === 'POST') {
    const session = await getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const comment = await db.createComment(postId, session.userId, content);
      return res.status(201).json({ comment });
    } catch (error) {
      console.error('Error creating comment:', error);
      return res.status(500).json({ error: 'Failed to create comment' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
