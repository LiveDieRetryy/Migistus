// API route for getting and saving page layouts
import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page } = req.query;
  if (typeof page !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid page parameter' });
  }
  const filePath = path.join(DATA_DIR, `${page}.json`);

  if (req.method === 'GET') {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Page config not found' });
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return res.status(200).json(JSON.parse(data));
  }

  if (req.method === 'POST') {
    try {
      fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save page config' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
