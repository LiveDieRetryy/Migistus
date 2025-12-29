// src/pages/api/recommendations/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { searchStorage } from '@/utils/searchStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET': {
        // Get user's recommendations
        const { type, limit } = req.query;

        const entityType = type ? (type as string) : undefined;
        const recLimit = limit ? parseInt(limit as string) : 10;

        if (recLimit < 1 || recLimit > 50) {
          return res.status(400).json({ error: 'Limit must be between 1 and 50' });
        }

        const recommendations = await searchStorage.getUserRecommendations(
          session.userId,
          entityType,
          recLimit
        );

        return res.status(200).json({ recommendations });
      }

      case 'POST': {
        // Create recommendation (typically called by recommendation engine)
        const { entityType, entityId, score, reason } = req.body;

        if (!entityType || typeof entityType !== 'string') {
          return res.status(400).json({ error: 'Entity type is required' });
        }

        if (!entityId || isNaN(parseInt(entityId))) {
          return res.status(400).json({ error: 'Valid entity ID is required' });
        }

        const parsedScore = parseFloat(score);
        if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 1) {
          return res.status(400).json({ error: 'Score must be a number between 0 and 1' });
        }

        const recommendation = await searchStorage.createRecommendation({
          userId: session.userId,
          entityType,
          entityId: parseInt(entityId),
          score: parsedScore,
          reason: reason || undefined
        });

        return res.status(201).json({ recommendation });
      }

      case 'DELETE': {
        // Clear all user recommendations
        await searchStorage.clearUserRecommendations(session.userId);
        return res.status(200).json({ message: 'Recommendations cleared successfully' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Recommendations API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
