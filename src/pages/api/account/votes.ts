import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/session';

const votesPath = path.join(process.cwd(), 'public', 'data', 'votes.json');

function ensureVotesFile() {
  if (!fs.existsSync(votesPath)) {
    fs.writeFileSync(votesPath, JSON.stringify({ votes: [] }, null, 2));
  }
}

function getVotes() {
  ensureVotesFile();
  const data = fs.readFileSync(votesPath, 'utf-8');
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : (parsed.votes || []);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication
  const session = requireAuth(req, res);
  if (!session) {
    return; // requireAuth already sent the 401 response
  }

  try {
    const allVotes = getVotes();

    if (req.method === 'GET') {
      // Return only the authenticated user's votes
      const userVotes = allVotes.filter((vote: any) => vote.userId === session.userId);
      
      return res.status(200).json({
        success: true,
        data: userVotes,
        total: userVotes.length
      });
    } else {
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('User votes API error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}
