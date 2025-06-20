import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const VOTING_PATH = path.resolve('public/data/voting.json');

function readVotingData() {
  try {
    if (!fs.existsSync(VOTING_PATH)) {
      const initialData = { polls: [] };
      fs.writeFileSync(VOTING_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const fileContent = fs.readFileSync(VOTING_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading voting file:', error);
    return { polls: [] };
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const pollData = req.body;
    
    // Validate required fields
    if (!pollData.title || !pollData.options || pollData.options.length < 2) {
      return res.status(400).json({ error: 'Invalid poll data' });
    }

    const votingData = readVotingData();
    votingData.polls.push(pollData);
    
    writeVotingData(votingData);
    
    res.status(201).json({ success: true, poll: pollData });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
}
