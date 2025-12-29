// pages/api/migrate/admin-data.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin check - in production, use proper authentication
  const { adminPassword } = req.body;
  if (adminPassword !== process.env.ADMIN_MIGRATION_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const results = {
      auditLogs: { migrated: 0, errors: 0 },
      moderationActions: { migrated: 0, errors: 0 },
      reports: { migrated: 0, errors: 0 },
      systemSettings: { migrated: 0, errors: 0 },
      featureFlags: { migrated: 0, errors: 0 },
      analyticsEvents: { migrated: 0, errors: 0 }
    };

    // 1. Migrate Audit Logs
    console.log('Migrating audit logs...');
    const auditLogsPath = path.join(dataDir, 'audit-logs.json');
    if (fs.existsSync(auditLogsPath)) {
      const auditLogs = JSON.parse(fs.readFileSync(auditLogsPath, 'utf-8'));
      
      for (const log of auditLogs) {
        try {
          await db.logAdminAction({
            adminId: log.admin_id || log.adminId,
            action: log.action,
            targetType: log.target_type || log.targetType,
            targetId: log.target_id || log.targetId,
            details: log.details,
            ipAddress: log.ip_address || log.ipAddress
          });
          results.auditLogs.migrated++;
        } catch (error) {
          console.error(`Error migrating audit log ${log.id}:`, error);
          results.auditLogs.errors++;
        }
      }
    }

    // 2. Migrate Moderation Actions
    console.log('Migrating moderation actions...');
    const moderationPath = path.join(dataDir, 'moderation-actions.json');
    if (fs.existsSync(moderationPath)) {
      const actions = JSON.parse(fs.readFileSync(moderationPath, 'utf-8'));
      
      for (const action of actions) {
        try {
          await db.createModerationAction({
            moderatorId: action.moderator_id || action.moderatorId,
            targetUserId: action.target_user_id || action.targetUserId,
            actionType: action.action_type || action.actionType,
            reason: action.reason,
            duration: action.duration,
            details: action.details
          });
          results.moderationActions.migrated++;
        } catch (error) {
          console.error(`Error migrating moderation action ${action.id}:`, error);
          results.moderationActions.errors++;
        }
      }
    }

    // 3. Migrate Reports (from reports.json or moderation.json)
    console.log('Migrating reports...');
    const reportsPath = path.join(dataDir, 'reports.json');
    if (fs.existsSync(reportsPath)) {
      const reports = JSON.parse(fs.readFileSync(reportsPath, 'utf-8'));
      
      // Reports are already handled by existing system, just count them
      results.reports.migrated = reports.length;
    }

    // 4. Migrate System Settings
    console.log('Migrating system settings...');
    const settingsPath = path.join(dataDir, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      
      // Extract global settings (not user-specific)
      const globalSettings = Object.entries(settings).filter(([key]) => 
        !key.match(/^\d+$/) // Skip user IDs
      );

      for (const [key, value] of globalSettings) {
        try {
          await db.updateSystemSetting(
            key,
            typeof value === 'object' && value !== null ? (value as any).value || value : value,
            1, // Admin user ID
            typeof value === 'object' && value !== null ? (value as any).description : undefined
          );
          results.systemSettings.migrated++;
        } catch (error) {
          console.error(`Error migrating setting ${key}:`, error);
          results.systemSettings.errors++;
        }
      }
    }

    // 5. Migrate Feature Flags
    console.log('Migrating feature flags...');
    const featureFlagsPath = path.join(dataDir, 'feature-flags.json');
    if (fs.existsSync(featureFlagsPath)) {
      const flags = JSON.parse(fs.readFileSync(featureFlagsPath, 'utf-8'));
      
      for (const [name, flagData] of Object.entries(flags)) {
        try {
          const flag = flagData as any;
          await db.createFeatureFlag(
            name,
            flag.enabled || false,
            flag.description || '',
            1 // Admin user ID
          );
          results.featureFlags.migrated++;
        } catch (error) {
          console.error(`Error migrating feature flag ${name}:`, error);
          results.featureFlags.errors++;
        }
      }
    }

    // 6. Migrate Analytics Events (be careful - this can be large)
    console.log('Migrating analytics events (last 1000)...');
    const analyticsPath = path.join(dataDir, 'analytics-events.json');
    if (fs.existsSync(analyticsPath)) {
      const events = JSON.parse(fs.readFileSync(analyticsPath, 'utf-8'));
      
      // Only migrate recent events to avoid overwhelming the database
      const recentEvents = events.slice(-1000);
      
      for (const event of recentEvents) {
        try {
          await db.logAnalyticsEvent({
            eventType: event.event_type || event.eventType,
            userId: event.user_id || event.userId,
            sessionId: event.session_id || event.sessionId,
            eventData: event.event_data || event.eventData,
            pageUrl: event.page_url || event.pageUrl,
            referrer: event.referrer,
            userAgent: event.user_agent || event.userAgent,
            ipAddress: event.ip_address || event.ipAddress
          });
          results.analyticsEvents.migrated++;
        } catch (error) {
          console.error(`Error migrating analytics event ${event.id}:`, error);
          results.analyticsEvents.errors++;
        }
      }
    }

    console.log('Migration complete!', results);

    return res.status(200).json({
      success: true,
      message: 'Admin data migration completed',
      results
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Migration failed',
      details: error.toString()
    });
  }
}
