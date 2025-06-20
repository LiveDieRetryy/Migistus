import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const SETTINGS_PATH = path.resolve('public/data/admin-settings.json');

function ensureSettingsFile() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      const defaultSettings = {
        siteName: 'MIGISTUS',
        siteDescription: 'Community-driven group buying platform',
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: false,
        autoApproveVotes: true,
        autoApproveProducts: false,
        defaultUserTier: 'New Initiate',
        maxVotesPerDay: {
          'New Initiate': 3,
          'New Member': 5,
          'Subscriber': 10,
          'Premium': 20,
          'Admin': 100
        },
        voteMultipliers: {
          'New Initiate': 1,
          'New Member': 1.2,
          'Subscriber': 1.5,
          'Premium': 2,
          'Admin': 5
        },
        featuredProductsLimit: 6,
        staffPicksLimit: 12,
        liveDropsEnabled: true,
        chatEnabled: true,
        moderationEnabled: true
      };
      
      // Ensure directory exists
      const dir = path.dirname(SETTINGS_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2));
    }
  } catch (error) {
    console.error('Error ensuring settings file:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  ensureSettingsFile();

  if (req.method === 'GET') {
    try {
      const fileContent = fs.readFileSync(SETTINGS_PATH, 'utf-8');
      const settings = JSON.parse(fileContent);
      res.status(200).json(settings);
    } catch (error) {
      console.error('Error reading settings:', error);
      res.status(500).json({ error: 'Failed to read settings' });
    }
  } else if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const newSettings = req.body;
      
      // Validate required fields
      if (!newSettings.siteName || !newSettings.defaultUserTier) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Read existing settings and merge
      let existingSettings = {};
      try {
        const fileContent = fs.readFileSync(SETTINGS_PATH, 'utf-8');
        existingSettings = JSON.parse(fileContent);
      } catch (error) {
        // If file doesn't exist or can't be read, start with empty object
      }

      const mergedSettings = {
        ...existingSettings,
        ...newSettings,
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(mergedSettings, null, 2));
      
      // Also update voting config if voting settings changed
      if (newSettings.maxVotesPerDay || newSettings.voteMultipliers) {
        const votingConfigPath = path.resolve('public/data/voting.json');
        try {
          let votingConfig = {};
          if (fs.existsSync(votingConfigPath)) {
            const votingContent = fs.readFileSync(votingConfigPath, 'utf-8');
            votingConfig = JSON.parse(votingContent);
          }          votingConfig = {
            ...votingConfig,
            tierLimits: newSettings.maxVotesPerDay || (votingConfig as any).tierLimits,
            tierMultipliers: newSettings.voteMultipliers || (votingConfig as any).tierMultipliers
          };

          fs.writeFileSync(votingConfigPath, JSON.stringify(votingConfig, null, 2));
        } catch (error) {
          console.error('Error updating voting config:', error);
        }
      }

      res.status(200).json({ success: true, settings: mergedSettings });
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
