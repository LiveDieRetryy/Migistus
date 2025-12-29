import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { emitActivity } from '@/utils/socketEmitter';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSessionFromRequest(req);

  if (!session || !session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const postId = parseInt(id as string);

  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  if (req.method === 'POST') {
    try {
      await db.likePost(postId, session.userId);
      
      // Emit real-time activity for like
      emitActivity(session.userId, {
        id: `like-${postId}-${session.userId}`,
        type: 'like',
        targetId: postId.toString(),
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({ success: true, liked: true });
    } catch (error) {
      console.error('Error liking post:', error);
      return res.status(500).json({ error: 'Failed to like post' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await db.unlikePost(postId, session.userId);
      return res.status(200).json({ success: true, liked: false });
    } catch (error) {
      console.error('Error unliking post:', error);
      return res.status(500).json({ error: 'Failed to unlike post' });
    }
  }

  if (req.method === 'GET') {
    try {
      const isLiked = await db.isPostLiked(postId, session.userId);
      const likes = await db.getPostLikes(postId);
      return res.status(200).json({ isLiked, likes });
    } catch (error) {
      console.error('Error checking like status:', error);
      return res.status(500).json({ error: 'Failed to check like status' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
