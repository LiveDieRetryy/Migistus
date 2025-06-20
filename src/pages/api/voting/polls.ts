import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const VOTING_PATH = path.resolve('public/data/voting.json');

function readVotingData() {
  try {
    if (!fs.existsSync(VOTING_PATH)) {
      const initialData = { 
        polls: [],
        stats: {
          activePolls: 0,
          totalVotes: 0,
          pendingApproval: 0,
          endedPolls: 0
        }
      };
      fs.writeFileSync(VOTING_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const fileContent = fs.readFileSync(VOTING_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Ensure stats exist
    if (!data.stats) {
      data.stats = {
        activePolls: 0,
        totalVotes: 0,
        pendingApproval: 0,
        endedPolls: 0
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error reading voting file:', error);
    return { 
      polls: [],
      stats: {
        activePolls: 0,
        totalVotes: 0,
        pendingApproval: 0,
        endedPolls: 0
      }
    };
  }
}

function writeVotingData(data: any) {
  try {
    const dir = path.dirname(VOTING_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(VOTING_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing voting file:', error);
    throw new Error('Failed to save voting data');
  }
}

function calculateStats(polls: any[]) {
  return {
    activePolls: polls.filter(poll => poll.status === 'active').length,
    totalVotes: polls.reduce((sum, poll) => sum + (poll.voteCount || 0), 0),
    pendingApproval: polls.filter(poll => poll.status === 'pending').length,
    endedPolls: polls.filter(poll => poll.status === 'ended').length
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = readVotingData();

    if (req.method === 'GET') {
      // Calculate fresh stats
      const stats = calculateStats(data.polls);
      data.stats = stats;
      writeVotingData(data);
      
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { title, description, category } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newPoll = {
        id: Date.now().toString(),
        title,
        description,
        status: 'pending',
        createdAt: new Date().toISOString(),
        voteCount: 0,
        category: category || 'general'
      };

      data.polls.push(newPoll);
      data.stats = calculateStats(data.polls);
      writeVotingData(data);

      return res.status(201).json(newPoll);
    }

    if (req.method === 'PUT') {
      const { id, status, endDate } = req.body;
      
      const pollIndex = data.polls.findIndex((poll: any) => poll.id === id);
      if (pollIndex === -1) {
        return res.status(404).json({ error: 'Poll not found' });
      }

      data.polls[pollIndex].status = status;
      if (endDate) {
        data.polls[pollIndex].endDate = endDate;
      }

      data.stats = calculateStats(data.polls);
      writeVotingData(data);

      return res.status(200).json(data.polls[pollIndex]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      data.polls = data.polls.filter((poll: any) => poll.id !== id);
      data.stats = calculateStats(data.polls);
      writeVotingData(data);

      return res.status(200).json({ message: 'Poll deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Voting API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
