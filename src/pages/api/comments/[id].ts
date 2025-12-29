import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSessionFromRequest(req);

  if (!session || !session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const commentId = parseInt(id as string);

  if (isNaN(commentId)) {
    return res.status(400).json({ error: 'Invalid comment ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const comment = await db.updateComment(commentId, session.userId, content);

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found or unauthorized' });
      }

      return res.status(200).json({ comment });
    } catch (error) {
      console.error('Error updating comment:', error);
      return res.status(500).json({ error: 'Failed to update comment' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await db.deleteComment(commentId, session.userId);

      if (!result) {
        return res.status(404).json({ error: 'Comment not found or unauthorized' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting comment:', error);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
