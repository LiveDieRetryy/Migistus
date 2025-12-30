// pages/api/migrate/notification-data.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin check
  const { adminPassword } = req.body;
  if (adminPassword !== process.env.ADMIN_MIGRATION_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const results = {
      notifications: { migrated: 0, errors: 0 },
      notificationPreferences: { migrated: 0, errors: 0 },
      emailQueue: { migrated: 0, errors: 0 },
      pushSubscriptions: { migrated: 0, errors: 0 },
      realtimeSessions: { migrated: 0, errors: 0 }
    };

    // 1. Migrate Notifications
    console.log('Migrating notifications...');
    const notificationsPath = path.join(dataDir, 'notifications.json');
    if (fs.existsSync(notificationsPath)) {
      const notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'));
      
      for (const notification of notifications) {
        try {
          await db.createNotification({
            userId: notification.user_id || notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.action_url || notification.actionUrl,
            actionText: notification.action_text || notification.actionText,
            metadata: notification.metadata,
            priority: notification.priority || 'normal'
          });
          results.notifications.migrated++;
        } catch (error) {
          console.error(`Error migrating notification ${notification.id}:`, error);
          results.notifications.errors++;
        }
      }
    }

    // 2. Migrate Notification Preferences
    console.log('Migrating notification preferences...');
    const preferencesPath = path.join(dataDir, 'notification-preferences.json');
    if (fs.existsSync(preferencesPath)) {
      const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));
      
      for (const pref of preferences) {
        try {
          await db.updateNotificationPreferences(
            pref.user_id || pref.userId,
            {
              emailEnabled: pref.email_enabled || pref.emailEnabled,
              pushEnabled: pref.push_enabled || pref.pushEnabled,
              smsEnabled: pref.sms_enabled || pref.smsEnabled,
              notifyOnVotes: pref.notify_on_votes || pref.notifyOnVotes,
              notifyOnComments: pref.notify_on_comments || pref.notifyOnComments,
              notifyOnFollows: pref.notify_on_follows || pref.notifyOnFollows,
              notifyOnMessages: pref.notify_on_messages || pref.notifyOnMessages,
              notifyOnProductUpdates: pref.notify_on_product_updates || pref.notifyOnProductUpdates,
              notifyOnOrders: pref.notify_on_orders || pref.notifyOnOrders,
              quietHoursStart: pref.quiet_hours_start || pref.quietHoursStart,
              quietHoursEnd: pref.quiet_hours_end || pref.quietHoursEnd
            }
          );
          results.notificationPreferences.migrated++;
        } catch (error) {
          console.error(`Error migrating preferences for user ${pref.user_id}:`, error);
          results.notificationPreferences.errors++;
        }
      }
    }

    // 3. Migrate Email Queue
    console.log('Migrating email queue...');
    const emailQueuePath = path.join(dataDir, 'email-queue.json');
    if (fs.existsSync(emailQueuePath)) {
      const emailQueue = JSON.parse(fs.readFileSync(emailQueuePath, 'utf-8'));
      
      // Only migrate pending emails (skip sent/failed ones to avoid duplicates)
      const pendingEmails = emailQueue.filter((e: any) => e.status === 'pending');
      
      for (const email of pendingEmails) {
        try {
          await db.queueEmail({
            recipientEmail: email.recipient_email || email.recipientEmail,
            recipientName: email.recipient_name || email.recipientName,
            subject: email.subject,
            htmlContent: email.html_content || email.htmlContent,
            textContent: email.text_content || email.textContent,
            templateId: email.template_id || email.templateId,
            templateData: email.template_data || email.templateData,
            priority: email.priority || 'normal',
            scheduledFor: email.scheduled_for || email.scheduledFor
          });
          results.emailQueue.migrated++;
        } catch (error) {
          console.error(`Error migrating email ${email.id}:`, error);
          results.emailQueue.errors++;
        }
      }
    }

    // 4. Migrate Push Subscriptions
    console.log('Migrating push subscriptions...');
    const pushSubsPath = path.join(dataDir, 'push-subscriptions.json');
    if (fs.existsSync(pushSubsPath)) {
      const subscriptions = JSON.parse(fs.readFileSync(pushSubsPath, 'utf-8'));
      
      for (const sub of subscriptions) {
        try {
          if (sub.is_active !== false) { // Only migrate active subscriptions
            await db.savePushSubscription({
              userId: sub.user_id || sub.userId,
              endpoint: sub.endpoint,
              p256dh: sub.p256dh,
              auth: sub.auth,
              userAgent: sub.user_agent || sub.userAgent
            });
            results.pushSubscriptions.migrated++;
          }
        } catch (error) {
          console.error(`Error migrating push subscription ${sub.id}:`, error);
          results.pushSubscriptions.errors++;
        }
      }
    }

    // 5. Migrate Real-time Sessions (only recent ones)
    console.log('Migrating active real-time sessions...');
    const sessionsPath = path.join(dataDir, 'realtime-sessions.json');
    if (fs.existsSync(sessionsPath)) {
      const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
      
      // Only migrate sessions active in last 30 minutes
      const cutoff = new Date(Date.now() - 30 * 60 * 1000);
      const recentSessions = sessions.filter((s: any) => 
        new Date(s.last_activity || s.lastActivity) > cutoff
      );
      
      for (const session of recentSessions) {
        try {
          await db.createRealtimeSession({
            userId: session.user_id || session.userId,
            sessionId: session.session_id || session.sessionId,
            socketId: session.socket_id || session.socketId,
            ipAddress: session.ip_address || session.ipAddress,
            userAgent: session.user_agent || session.userAgent
          });
          results.realtimeSessions.migrated++;
        } catch (error) {
          console.error(`Error migrating session ${session.id}:`, error);
          results.realtimeSessions.errors++;
        }
      }
    }

    console.log('Migration complete!', results);

    return res.status(200).json({
      success: true,
      message: 'Notification data migration completed',
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
