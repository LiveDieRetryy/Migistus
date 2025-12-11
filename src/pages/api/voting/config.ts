import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'src', 'configs', 'voting.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(configPath)) {
        // Return default config if file doesn't exist
        return res.status(200).json({
          votingEnabled: true,
          topWinners: 3,
          doubleVoteWeek: false,
          tripleVoteWeek: false,
          tierLimits: {
            "Initiate": 2,
            "Guild": 5,
            "MIGISTUS": 15,
            "Admin": 999
          },
          tierMultipliers: {
            "Initiate": 1,
            "Guild": 2,
            "MIGISTUS": 4,
            "Admin": 4
          }
        });
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return res.status(200).json(config);
    } catch (error) {
      console.error('Error reading voting config:', error);
      return res.status(500).json({ error: 'Failed to load voting configuration' });
    }
  }

  if (req.method === 'POST') {
    try {
      const newConfig = req.body;
      fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
      return res.status(200).json({ success: true, config: newConfig });
    } catch (error) {
      console.error('Error updating voting config:', error);
      return res.status(500).json({ error: 'Failed to update voting configuration' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
