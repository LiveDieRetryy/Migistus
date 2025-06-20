import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const VOTES_PATH = path.resolve('public/data/votes.json');

function readVotesData() {
  try {
    if (!fs.existsSync(VOTES_PATH)) {
      const initialData = { votes: [] };
      fs.writeFileSync(VOTES_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const fileContent = fs.readFileSync(VOTES_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading votes file:', error);
    return { votes: [] };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const votesData = readVotesData();
    res.status(200).json(votesData);
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
}
