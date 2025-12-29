import { NextApiRequest, NextApiResponse } from 'next';
import { productStorage } from '@/utils/productStorageV2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { productId, userId } = req.query;

      if (productId) {
        const votes = await productStorage.getProductVotes(parseInt(productId as string));
        const voteCount = await productStorage.getProductVoteCount(parseInt(productId as string));
        
        return res.status(200).json({
          votes,
          count: votes.length,
          total: voteCount
        });
      }

      if (userId) {
        const votes = await productStorage.getUserVotes(parseInt(userId as string));
        return res.status(200).json(votes);
      }

      // Return all votes if no specific filter provided
      const allVotes = await productStorage.getAllVotes();
      return res.status(200).json(allVotes);
    }

    if (req.method === 'POST') {
      const { productId, userId, tier, value } = req.body;

      if (!productId || !userId || !tier) {
        return res.status(400).json({ error: 'productId, userId, and tier are required' });
      }

      // Check if user has already voted today
      const hasVoted = await productStorage.hasUserVotedToday(userId, productId);
      if (hasVoted) {
        return res.status(400).json({ error: 'User has already voted today' });
      }

      const vote = await productStorage.createVote({ productId, userId, tier, value });
      return res.status(201).json(vote);
    }

    if (req.method === 'DELETE') {
      const { productId, userId } = req.body;

      if (!productId || !userId) {
        return res.status(400).json({ error: 'productId and userId are required' });
      }

      await productStorage.deleteVote(productId, userId);
      return res.status(200).json({ message: 'Vote deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Votes API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
