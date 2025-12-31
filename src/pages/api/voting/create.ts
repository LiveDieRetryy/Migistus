import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const pollData = req.body;
    
    // Validate required fields
    if (!pollData.title || !pollData.description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const newPoll = await db.createCommunityPoll({
      title: pollData.title,
      description: pollData.description,
      category: pollData.category || 'general',
      createdBy: pollData.createdBy
    });
    
    res.status(201).json({ success: true, poll: newPoll });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
}

