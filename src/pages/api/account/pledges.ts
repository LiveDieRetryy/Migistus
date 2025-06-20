import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const pledgesPath = path.join(process.cwd(), 'public', 'data', 'pledges.json');

function ensurePledgesFile() {
  if (!fs.existsSync(pledgesPath)) {
    fs.writeFileSync(pledgesPath, '[]');
  }
}

function getPledges() {
  ensurePledgesFile();
  const data = fs.readFileSync(pledgesPath, 'utf-8');
  return JSON.parse(data);
}

function savePledges(pledges: any[]) {
  fs.writeFileSync(pledgesPath, JSON.stringify(pledges, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    let pledges = getPledges();

    if (req.method === 'GET') {
      if (userId) {
        const userPledges = pledges.filter((pledge: any) => pledge.userId === parseInt(userId as string));
        res.status(200).json(userPledges);
      } else {
        res.status(200).json(pledges);
      }
    } else if (req.method === 'POST') {
      const newPledge = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      pledges.push(newPledge);
      savePledges(pledges);
      res.status(201).json(newPledge);
    } else if (req.method === 'DELETE') {
      const { pledgeId } = req.query;
      pledges = pledges.filter((pledge: any) => pledge.id !== parseInt(pledgeId as string));
      savePledges(pledges);
      res.status(200).json({ success: true });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Pledges API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
