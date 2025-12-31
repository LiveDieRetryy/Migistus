import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get all polls with fresh stats
      const polls = await db.getCommunityPolls();
      const stats = await db.getCommunityPollStats();
      
      return res.status(200).json({ polls, stats });
    }

    if (req.method === 'POST') {
      const { title, description, category } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newPoll = await db.createCommunityPoll({
        title,
        description,
        category: category || 'general'
      });

      return res.status(201).json(newPoll);
    }

    if (req.method === 'PUT') {
      const { id, status, endDate } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Poll ID is required' });
      }

      const poll = await db.getCommunityPoll(parseInt(id));
      if (!poll) {
        return res.status(404).json({ error: 'Poll not found' });
      }

      const updatedPoll = await db.updateCommunityPoll(parseInt(id), {
        status,
        endDate: endDate ? new Date(endDate) : undefined
      });

      return res.status(200).json(updatedPoll);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Poll ID is required' });
      }

      await db.deleteCommunityPoll(parseInt(id as string));

      return res.status(200).json({ message: 'Poll deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Voting API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

