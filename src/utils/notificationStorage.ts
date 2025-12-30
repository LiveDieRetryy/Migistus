// src/utils/notificationStorage.ts
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const USE_DATABASE = 
  process.env.NEXT_PUBLIC_USE_DATABASE === 'true' ||
  process.env.VERCEL_ENV === 'production' ||
  process.env.NODE_ENV === 'production';

// ============ DATABASE STORAGE ============
class DatabaseNotificationStorage {
  // Notifications
  async createNotification(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    metadata?: any;
    priority?: string;
  }) {
    return await db.createNotification(data);
  }

  async getNotifications(userId: number, limit: number = 50, offset: number = 0) {
    return await db.getNotifications(userId, limit, offset);
  }

  async getUnreadNotifications(userId: number) {
    return await db.getUnreadNotifications(userId);
  }

  async getUnreadCount(userId: number) {
    return await db.getUnreadCount(userId);
  }

  async markAsRead(notificationId: number) {
    return await db.markAsRead(notificationId);
  }

  async markAllAsRead(userId: number) {
    return await db.markAllAsRead(userId);
  }

  async deleteNotification(notificationId: number) {
    return await db.deleteNotification(notificationId);
  }

  async deleteAllNotifications(userId: number) {
    return await db.deleteAllNotifications(userId);
  }

  async getNotificationsByType(userId: number, type: string, limit: number = 20) {
    return await db.getNotificationsByType(userId, type, limit);
  }

  // Notification Preferences
  async getNotificationPreferences(userId: number) {
    return await db.getNotificationPreferences(userId);
  }

  async updateNotificationPreferences(userId: number, preferences: any) {
    return await db.updateNotificationPreferences(userId, preferences);
  }

  // Email Queue
  async queueEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    templateId?: string;
    templateData?: any;
    priority?: string;
    scheduledFor?: string;
  }) {
    return await db.queueEmail(data);
  }

  async getQueuedEmails(status: string = 'pending', limit: number = 100) {
    return await db.getQueuedEmails(status, limit);
  }

  async markEmailSent(emailId: number) {
    return await db.markEmailSent(emailId);
  }

  async markEmailFailed(emailId: number, error: string) {
    return await db.markEmailFailed(emailId, error);
  }

  async retryFailedEmail(emailId: number) {
    return await db.retryFailedEmail(emailId);
  }

  async getEmailStatus(emailId: number) {
    return await db.getEmailStatus(emailId);
  }

  async cleanupOldEmails(daysOld: number = 30) {
    return await db.cleanupOldEmails(daysOld);
  }

  // Push Subscriptions
  async savePushSubscription(data: {
    userId: number;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
    deviceType?: string;
  }) {
    return await db.savePushSubscription(data);
  }

  async removePushSubscription(endpoint: string) {
    return await db.deletePushSubscription(endpoint);
  }

  async getUserPushSubscriptions(userId: number) {
    return await db.getUserPushSubscriptions(userId);
  }

  async getAllActivePushSubscriptions() {
    return await db.getAllActivePushSubscriptions();
  }

  async deactivatePushSubscription(endpoint: string) {
    return await db.deactivatePushSubscription(endpoint);
  }

  // Real-time Sessions
  async createRealtimeSession(data: {
    userId: number;
    sessionId: string;
    socketId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return await db.createRealtimeSession(data);
  }

  async updateRealtimeSession(socketId: string, lastActivity?: string) {
    return await db.updateRealtimeSession(socketId, lastActivity);
  }

  async removeRealtimeSession(socketId: string) {
    return await db.removeRealtimeSession(socketId);
  }

  async getActiveSessions(userId?: number) {
    return await db.getActiveSessions(userId);
  }

  async getUserSessionCount(userId: number) {
    return await db.getUserSessionCount(userId);
  }

  async cleanupStaleRealtimeSessions(minutesOld: number = 30) {
    return await db.cleanupStaleRealtimeSessions(minutesOld);
  }
}

// ============ FILE STORAGE ============
class FileNotificationStorage {
  private dataDir = path.join(process.cwd(), 'public', 'data');

  private readJSON(filename: string): any {
    const filePath = path.join(this.dataDir, filename);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  private writeJSON(filename: string, data: any): void {
    const filePath = path.join(this.dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  // Notifications
  async createNotification(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    metadata?: any;
    priority?: string;
  }) {
    const notifications = this.readJSON('notifications.json');
    const newNotification = {
      id: notifications.length + 1,
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      action_url: data.actionUrl,
      action_text: data.actionText,
      metadata: data.metadata || {},
      priority: data.priority || 'normal',
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString()
    };
    notifications.push(newNotification);
    this.writeJSON('notifications.json', notifications);
    return newNotification;
  }

  async getNotifications(userId: number, limit: number = 50, offset: number = 0) {
    const notifications = this.readJSON('notifications.json');
    return notifications
      .filter((n: any) => n.user_id === userId)
      .slice(offset, offset + limit);
  }

  async getUnreadNotifications(userId: number) {
    const notifications = this.readJSON('notifications.json');
    return notifications.filter((n: any) => n.user_id === userId && !n.is_read);
  }

  async getUnreadCount(userId: number) {
    const notifications = this.readJSON('notifications.json');
    return notifications.filter((n: any) => n.user_id === userId && !n.is_read).length;
  }

  async markAsRead(notificationId: number) {
    const notifications = this.readJSON('notifications.json');
    const notification = notifications.find((n: any) => n.id === notificationId);
    if (notification) {
      notification.is_read = true;
      notification.read_at = new Date().toISOString();
      this.writeJSON('notifications.json', notifications);
    }
    return notification;
  }

  async markAllAsRead(userId: number) {
    const notifications = this.readJSON('notifications.json');
    const updated = notifications.filter((n: any) => n.user_id === userId && !n.is_read);
    updated.forEach((n: any) => {
      n.is_read = true;
      n.read_at = new Date().toISOString();
    });
    this.writeJSON('notifications.json', notifications);
    return updated;
  }

  async deleteNotification(notificationId: number) {
    const notifications = this.readJSON('notifications.json');
    const filtered = notifications.filter((n: any) => n.id !== notificationId);
    this.writeJSON('notifications.json', filtered);
  }

  async deleteAllNotifications(userId: number) {
    const notifications = this.readJSON('notifications.json');
    const filtered = notifications.filter((n: any) => n.user_id !== userId);
    this.writeJSON('notifications.json', filtered);
  }

  async getNotificationsByType(userId: number, type: string, limit: number = 20) {
    const notifications = this.readJSON('notifications.json');
    return notifications
      .filter((n: any) => n.user_id === userId && n.type === type)
      .slice(0, limit);
  }

  // Notification Preferences
  async getNotificationPreferences(userId: number) {
    const preferences = this.readJSON('notification-preferences.json');
    return preferences.find((p: any) => p.user_id === userId) || null;
  }

  async updateNotificationPreferences(userId: number, prefs: any) {
    const preferences = this.readJSON('notification-preferences.json');
    const existing = preferences.find((p: any) => p.user_id === userId);
    
    if (existing) {
      Object.assign(existing, prefs);
      existing.updated_at = new Date().toISOString();
    } else {
      preferences.push({
        user_id: userId,
        ...prefs,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    this.writeJSON('notification-preferences.json', preferences);
    return preferences.find((p: any) => p.user_id === userId);
  }

  // Email Queue
  async queueEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    templateId?: string;
    templateData?: any;
    priority?: string;
    scheduledFor?: string;
  }) {
    const queue = this.readJSON('email-queue.json');
    const newEmail = {
      id: queue.length + 1,
      recipient_email: data.recipientEmail,
      recipient_name: data.recipientName,
      subject: data.subject,
      html_content: data.htmlContent,
      text_content: data.textContent,
      template_id: data.templateId,
      template_data: data.templateData || {},
      priority: data.priority || 'normal',
      scheduled_for: data.scheduledFor,
      status: 'pending',
      attempts: 0,
      created_at: new Date().toISOString()
    };
    queue.push(newEmail);
    this.writeJSON('email-queue.json', queue);
    return newEmail;
  }

  async getQueuedEmails(status: string = 'pending', limit: number = 100) {
    const queue = this.readJSON('email-queue.json');
    const now = new Date();
    
    return queue
      .filter((e: any) => {
        if (e.status !== status) return false;
        if (e.scheduled_for && new Date(e.scheduled_for) > now) return false;
        return true;
      })
      .sort((a: any, b: any) => {
        // Priority: high > normal > low
        const priorityOrder: any = { high: 3, normal: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by creation date
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, limit);
  }

  async markEmailSent(emailId: number) {
    const queue = this.readJSON('email-queue.json');
    const email = queue.find((e: any) => e.id === emailId);
    if (email) {
      email.status = 'sent';
      email.sent_at = new Date().toISOString();
      email.attempts = (email.attempts || 0) + 1;
      this.writeJSON('email-queue.json', queue);
    }
    return email;
  }

  async markEmailFailed(emailId: number, error: string) {
    const queue = this.readJSON('email-queue.json');
    const email = queue.find((e: any) => e.id === emailId);
    if (email) {
      email.status = 'failed';
      email.last_error = error;
      email.attempts = (email.attempts || 0) + 1;
      email.last_attempt_at = new Date().toISOString();
      this.writeJSON('email-queue.json', queue);
    }
    return email;
  }

  async retryFailedEmail(emailId: number) {
    const queue = this.readJSON('email-queue.json');
    const email = queue.find((e: any) => e.id === emailId);
    if (email) {
      email.status = 'pending';
      email.last_error = null;
      this.writeJSON('email-queue.json', queue);
    }
    return email;
  }

  async getEmailStatus(emailId: number) {
    const queue = this.readJSON('email-queue.json');
    return queue.find((e: any) => e.id === emailId) || null;
  }

  async cleanupOldEmails(daysOld: number = 30) {
    const queue = this.readJSON('email-queue.json');
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const filtered = queue.filter((e: any) => {
      if (e.status !== 'sent') return true;
      if (!e.sent_at) return true;
      return new Date(e.sent_at) > cutoffDate;
    });
    
    this.writeJSON('email-queue.json', filtered);
  }

  // Push Subscriptions
  async savePushSubscription(data: {
    userId: number;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
    deviceType?: string;
  }) {
    const subscriptions = this.readJSON('push-subscriptions.json');
    const existing = subscriptions.find((s: any) => s.endpoint === data.endpoint);
    
    if (existing) {
      existing.user_id = data.userId;
      existing.p256dh = data.p256dh;
      existing.auth = data.auth;
      existing.user_agent = data.userAgent;
      existing.device_type = data.deviceType;
      existing.updated_at = new Date().toISOString();
    } else {
      subscriptions.push({
        id: subscriptions.length + 1,
        user_id: data.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent,
        device_type: data.deviceType || 'unknown',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    this.writeJSON('push-subscriptions.json', subscriptions);
    return subscriptions.find((s: any) => s.endpoint === data.endpoint);
  }

  async removePushSubscription(endpoint: string) {
    const subscriptions = this.readJSON('push-subscriptions.json');
    const filtered = subscriptions.filter((s: any) => s.endpoint !== endpoint);
    this.writeJSON('push-subscriptions.json', filtered);
  }

  async getUserPushSubscriptions(userId: number) {
    const subscriptions = this.readJSON('push-subscriptions.json');
    return subscriptions.filter((s: any) => s.user_id === userId);
  }

  async getAllActivePushSubscriptions() {
    const subscriptions = this.readJSON('push-subscriptions.json');
    return subscriptions.filter((s: any) => s.is_active);
  }

  async deactivatePushSubscription(endpoint: string) {
    const subscriptions = this.readJSON('push-subscriptions.json');
    const subscription = subscriptions.find((s: any) => s.endpoint === endpoint);
    if (subscription) {
      subscription.is_active = false;
      this.writeJSON('push-subscriptions.json', subscriptions);
    }
    return subscription;
  }

  // Real-time Sessions
  async createRealtimeSession(data: {
    userId: number;
    sessionId: string;
    socketId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const sessions = this.readJSON('realtime-sessions.json');
    const newSession = {
      id: sessions.length + 1,
      user_id: data.userId,
      session_id: data.sessionId,
      socket_id: data.socketId,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    sessions.push(newSession);
    this.writeJSON('realtime-sessions.json', sessions);
    return newSession;
  }

  async updateRealtimeSession(socketId: string, lastActivity?: string) {
    const sessions = this.readJSON('realtime-sessions.json');
    const session = sessions.find((s: any) => s.socket_id === socketId);
    if (session) {
      session.last_activity = lastActivity || new Date().toISOString();
      this.writeJSON('realtime-sessions.json', sessions);
    }
    return session;
  }

  async removeRealtimeSession(socketId: string) {
    const sessions = this.readJSON('realtime-sessions.json');
    const filtered = sessions.filter((s: any) => s.socket_id !== socketId);
    this.writeJSON('realtime-sessions.json', filtered);
  }

  async getActiveSessions(userId?: number) {
    const sessions = this.readJSON('realtime-sessions.json');
    const cutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
    
    return sessions.filter((s: any) => {
      const lastActivity = new Date(s.last_activity);
      if (lastActivity < cutoff) return false;
      if (userId && s.user_id !== userId) return false;
      return true;
    });
  }

  async getUserSessionCount(userId: number) {
    const activeSessions = await this.getActiveSessions(userId);
    return activeSessions.length;
  }

  async cleanupStaleRealtimeSessions(minutesOld: number = 30) {
    const sessions = this.readJSON('realtime-sessions.json');
    const cutoff = new Date(Date.now() - minutesOld * 60 * 1000);
    
    const filtered = sessions.filter((s: any) => {
      return new Date(s.last_activity) > cutoff;
    });
    
    this.writeJSON('realtime-sessions.json', filtered);
  }
}

// ============ EXPORT SINGLETON ============
export const notificationStorage = USE_DATABASE ? new DatabaseNotificationStorage() : new FileNotificationStorage();

console.log(`[NotificationStorage] Using ${USE_DATABASE ? 'DATABASE' : 'FILE'} storage`);
