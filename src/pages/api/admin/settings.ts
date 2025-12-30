import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, isProduction } from '@/lib/db';

const SETTINGS_PATH = path.resolve('public/data/admin-settings.json');

function ensureSettingsFile() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      const defaultSettings = {
        site: {
          siteName: 'MIGISTUS',
          siteDescription: 'The ultimate group buying platform',
          siteTagline: 'Power in Numbers',
          maintenanceMode: false,
          registrationEnabled: true,
          contactEmail: 'contact@migistus.com',
          supportEmail: 'support@migistus.com',
          logo: '/images/logo.png',
          favicon: '/favicon.ico'
        },
        voting: {
          enabled: true,
          maxVotesPerUser: 10,
          votingCooldown: 24,
          tierMultipliers: {
            initiate: 1,
            guild: 2,
            migistus: 3
          },
          autoApproveThreshold: 100
        },
        drops: {
          enabled: true,
          maxActiveDrops: 5,
          defaultDuration: 24,
          pledgeTimeLimit: 2,
          minParticipants: 10,
          maxParticipants: 1000
        },
        features: {
          chatEnabled: true,
          marketingEnabled: true,
          analyticsEnabled: true,
          notificationsEnabled: true,
          emailNotifications: true,
          pushNotifications: false,
          wishlistEnabled: true,
          reviewsEnabled: true
        },
        security: {
          maxLoginAttempts: 5,
          sessionTimeout: 60,
          passwordMinLength: 8,
          twoFactorRequired: false,
          ipWhitelist: [],
          rateLimitPerMinute: 60
        },
        updatedAt: new Date().toISOString()
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
  const useProduction = isProduction();

  if (req.method === 'GET') {
    try {
      if (useProduction) {
        // Use database in production
        const settings = await db.getAdminSettings();
        
        // If no settings exist, initialize defaults
        if (Object.keys(settings.site).length === 0) {
          const defaultSettings = await db.initializeDefaultAdminSettings();
          return res.status(200).json(defaultSettings);
        }
        
        return res.status(200).json(settings);
      } else {
        // Use file system in development
        ensureSettingsFile();
        const fileContent = fs.readFileSync(SETTINGS_PATH, 'utf-8');
        const settings = JSON.parse(fileContent);
        return res.status(200).json(settings);
      }
    } catch (error) {
      console.error('Error reading settings:', error);
      res.status(500).json({ error: 'Failed to read settings' });
    }
  } else if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const newSettings = req.body;
      
      // Validate required fields
      if (!newSettings.site?.siteName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (useProduction) {
        // Use database in production
        const updatedSettings = await db.updateAdminSettings(newSettings);
        
        return res.status(200).json({ 
          success: true, 
          message: 'Settings saved successfully',
          settings: updatedSettings 
        });
      } else {
        // Use file system in development
        ensureSettingsFile();
        
        // Read existing settings and merge deeply
        let existingSettings: any = {};
        try {
          const fileContent = fs.readFileSync(SETTINGS_PATH, 'utf-8');
          existingSettings = JSON.parse(fileContent);
        } catch (error) {
          // If file doesn't exist or can't be read, start with empty object
        }

        // Deep merge settings by category
        const mergedSettings = {
          site: { ...existingSettings.site, ...newSettings.site },
          voting: { 
            ...existingSettings.voting, 
            ...newSettings.voting,
            tierMultipliers: {
              ...existingSettings.voting?.tierMultipliers,
              ...newSettings.voting?.tierMultipliers
            }
          },
          drops: { ...existingSettings.drops, ...newSettings.drops },
          features: { ...existingSettings.features, ...newSettings.features },
          security: { ...existingSettings.security, ...newSettings.security },
          updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(mergedSettings, null, 2));
        
        return res.status(200).json({ 
          success: true, 
          message: 'Settings saved successfully',
          settings: mergedSettings 
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
