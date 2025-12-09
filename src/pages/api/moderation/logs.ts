import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const moderationPath = path.join(process.cwd(), 'public', 'data', 'moderation.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(moderationPath)) {
        return res.status(200).json({ logs: [] });
      }

      const logs = JSON.parse(fs.readFileSync(moderationPath, 'utf8'));
      
      // Sort by most recent first
      const sortedLogs = (Array.isArray(logs) ? logs : []).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return res.status(200).json({ logs: sortedLogs });
    } catch (error) {
      console.error('Error reading moderation logs:', error);
      return res.status(500).json({ error: 'Failed to load moderation logs' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
