// src/utils/adminStorage.ts
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const USE_DATABASE = 
  process.env.NEXT_PUBLIC_USE_DATABASE === 'true' ||
  process.env.VERCEL_ENV === 'production' ||
  process.env.NODE_ENV === 'production';

// ============ DATABASE STORAGE ============
class DatabaseAdminStorage {
  // Audit Logs
  async logAdminAction(data: {
    adminId: number;
    action: string;
    targetType?: string;
    targetId?: number;
    details?: any;
    ipAddress?: string;
  }) {
    return await db.logAdminAction(data);
  }

  async getAdminAuditLogs(limit: number = 100, offset: number = 0) {
    return await db.getAdminAuditLogs(limit, offset);
  }

  async getAuditLogsByUser(userId: number, limit: number = 50) {
    return await db.getAuditLogsByUser(userId, limit);
  }

  async getAuditLogsByAction(action: string, limit: number = 50) {
    return await db.getAuditLogsByAction(action, limit);
  }

  async getAuditLogsByDateRange(startDate: string, endDate: string) {
    return await db.getAuditLogsByDateRange(startDate, endDate);
  }

  // Moderation Actions
  async createModerationAction(data: {
    moderatorId: number;
    targetUserId: number;
    actionType: string;
    reason?: string;
    duration?: number;
    details?: any;
  }) {
    return await db.createModerationAction(data);
  }

  async getModerationActions(limit: number = 100, offset: number = 0) {
    return await db.getModerationActions(limit, offset);
  }

  async updateModerationStatus(actionId: number, status: string, resolvedBy?: number) {
    return await db.updateModerationStatus(actionId, status, resolvedBy);
  }

  async banUser(userId: number, moderatorId: number, reason: string, duration?: number) {
    return await db.banUser(userId, moderatorId, reason, duration);
  }

  async unbanUser(userId: number, moderatorId: number) {
    return await db.unbanUser(userId, moderatorId);
  }

  async getUserModerationHistory(userId: number) {
    return await db.getUserModerationHistory(userId);
  }

  // System Settings
  async getSystemSettings() {
    return await db.getSystemSettings();
  }

  async getSystemSetting(key: string) {
    return await db.getSystemSetting(key);
  }

  async updateSystemSetting(key: string, value: any, adminId: number, description?: string) {
    return await db.updateSystemSetting(key, value, adminId, description);
  }

  async deleteSystemSetting(key: string, adminId: number) {
    return await db.deleteSystemSetting(key, adminId);
  }

  // Feature Flags
  async getFeatureFlags() {
    return await db.getFeatureFlags();
  }

  async getFeatureFlag(name: string) {
    return await db.getFeatureFlag(name);
  }

  async updateFeatureFlag(name: string, enabled: boolean, adminId: number, rolloutPercentage?: number) {
    return await db.updateFeatureFlag(name, enabled, adminId, rolloutPercentage);
  }

  async createFeatureFlag(name: string, enabled: boolean, description: string, adminId: number) {
    return await db.createFeatureFlag(name, enabled, description, adminId);
  }

  async toggleMaintenanceMode(enabled: boolean, adminId: number, message?: string) {
    return await db.toggleMaintenanceMode(enabled, adminId, message);
  }

  // Analytics Events
  async logAnalyticsEvent(data: {
    eventType: string;
    userId?: number;
    sessionId?: string;
    eventData?: any;
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return await db.logAnalyticsEvent(data);
  }

  async getAnalyticsEvents(limit: number = 1000, offset: number = 0) {
    return await db.getAnalyticsEvents(limit, offset);
  }

  async getEventsByType(eventType: string, limit: number = 500) {
    return await db.getEventsByType(eventType, limit);
  }

  async getEventsByDateRange(startDate: string, endDate: string, eventType?: string) {
    return await db.getEventsByDateRange(startDate, endDate, eventType);
  }

  async getAnalyticsSummary(startDate: string, endDate: string) {
    return await db.getAnalyticsSummary(startDate, endDate);
  }

  async getUserAnalytics(userId: number, startDate?: string, endDate?: string) {
    return await db.getUserAnalytics(userId, startDate, endDate);
  }

  // Reports (moderation reports)
  async getReports(filters?: { status?: string; reason?: string }) {
    // Reports are in the existing reports system - extend if needed
    return [];
  }

  async updateReportStatus(reportId: number, status: string, actionNote?: string) {
    // Extend existing report system
    return null;
  }
}

// ============ FILE STORAGE ============
class FileAdminStorage {
  private dataDir = path.join(process.cwd(), 'public', 'data');

  private readJSON(filename: string): any {
    const filePath = path.join(this.dataDir, filename);
    if (!fs.existsSync(filePath)) {
      return filename === 'moderation.json' ? { profanityList: [], filterSettings: {} } : [];
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  private writeJSON(filename: string, data: any): void {
    const filePath = path.join(this.dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  // Audit Logs (file-based simulation)
  async logAdminAction(data: {
    adminId: number;
    action: string;
    targetType?: string;
    targetId?: number;
    details?: any;
    ipAddress?: string;
  }) {
    const logs = this.readJSON('audit-logs.json');
    const newLog = {
      id: logs.length + 1,
      admin_id: data.adminId,
      action: data.action,
      target_type: data.targetType,
      target_id: data.targetId,
      details: data.details,
      ip_address: data.ipAddress,
      created_at: new Date().toISOString()
    };
    logs.push(newLog);
    this.writeJSON('audit-logs.json', logs);
    return newLog;
  }

  async getAdminAuditLogs(limit: number = 100, offset: number = 0) {
    const logs = this.readJSON('audit-logs.json');
    return logs.slice(offset, offset + limit);
  }

  async getAuditLogsByUser(userId: number, limit: number = 50) {
    const logs = this.readJSON('audit-logs.json');
    return logs.filter((log: any) => log.admin_id === userId).slice(0, limit);
  }

  async getAuditLogsByAction(action: string, limit: number = 50) {
    const logs = this.readJSON('audit-logs.json');
    return logs.filter((log: any) => log.action === action).slice(0, limit);
  }

  async getAuditLogsByDateRange(startDate: string, endDate: string) {
    const logs = this.readJSON('audit-logs.json');
    return logs.filter((log: any) => {
      const logDate = new Date(log.created_at);
      return logDate >= new Date(startDate) && logDate <= new Date(endDate);
    });
  }

  // Moderation Actions
  async createModerationAction(data: {
    moderatorId: number;
    targetUserId: number;
    actionType: string;
    reason?: string;
    duration?: number;
    details?: any;
  }) {
    const actions = this.readJSON('moderation-actions.json');
    const newAction = {
      id: actions.length + 1,
      moderator_id: data.moderatorId,
      target_user_id: data.targetUserId,
      action_type: data.actionType,
      reason: data.reason,
      duration: data.duration,
      details: data.details,
      status: 'active',
      created_at: new Date().toISOString()
    };
    actions.push(newAction);
    this.writeJSON('moderation-actions.json', actions);

    // Also log in audit logs
    await this.logAdminAction({
      adminId: data.moderatorId,
      action: `moderation_${data.actionType}`,
      targetType: 'user',
      targetId: data.targetUserId,
      details: { reason: data.reason, duration: data.duration }
    });

    return newAction;
  }

  async getModerationActions(limit: number = 100, offset: number = 0) {
    const actions = this.readJSON('moderation-actions.json');
    return actions.slice(offset, offset + limit);
  }

  async updateModerationStatus(actionId: number, status: string, resolvedBy?: number) {
    const actions = this.readJSON('moderation-actions.json');
    const action = actions.find((a: any) => a.id === actionId);
    if (action) {
      action.status = status;
      action.resolved_by = resolvedBy;
      action.resolved_at = new Date().toISOString();
      this.writeJSON('moderation-actions.json', actions);
    }
    return action;
  }

  async banUser(userId: number, moderatorId: number, reason: string, duration?: number) {
    // Create moderation action
    const action = await this.createModerationAction({
      moderatorId,
      targetUserId: userId,
      actionType: 'ban',
      reason,
      duration
    });

    // Update user in users.json
    const users = this.readJSON('users.json');
    const user = users.find((u: any) => u.id === userId);
    if (user) {
      user.is_banned = true;
      user.banned_until = duration ? new Date(Date.now() + duration * 1000).toISOString() : null;
      user.banned_reason = reason;
      this.writeJSON('users.json', users);
    }

    return user;
  }

  async unbanUser(userId: number, moderatorId: number) {
    // Create moderation action
    await this.createModerationAction({
      moderatorId,
      targetUserId: userId,
      actionType: 'unban',
      reason: 'Ban lifted'
    });

    // Update user in users.json
    const users = this.readJSON('users.json');
    const user = users.find((u: any) => u.id === userId);
    if (user) {
      user.is_banned = false;
      user.banned_until = null;
      user.banned_reason = null;
      this.writeJSON('users.json', users);
    }

    return user;
  }

  async getUserModerationHistory(userId: number) {
    const actions = this.readJSON('moderation-actions.json');
    return actions.filter((a: any) => a.target_user_id === userId);
  }

  // System Settings
  async getSystemSettings() {
    const settings = this.readJSON('settings.json');
    return settings;
  }

  async getSystemSetting(key: string) {
    const settings = this.readJSON('settings.json');
    return settings[key] || null;
  }

  async updateSystemSetting(key: string, value: any, adminId: number, description?: string) {
    const settings = this.readJSON('settings.json');
    settings[key] = {
      value,
      type: typeof value,
      description,
      updated_at: new Date().toISOString()
    };
    this.writeJSON('settings.json', settings);

    // Log the change
    await this.logAdminAction({
      adminId,
      action: 'update_system_setting',
      targetType: 'setting',
      details: { key, value }
    });

    return settings[key];
  }

  async deleteSystemSetting(key: string, adminId: number) {
    const settings = this.readJSON('settings.json');
    const oldValue = settings[key];
    delete settings[key];
    this.writeJSON('settings.json', settings);

    await this.logAdminAction({
      adminId,
      action: 'delete_system_setting',
      targetType: 'setting',
      details: { key, value: oldValue }
    });
  }

  // Feature Flags
  async getFeatureFlags() {
    const flags = this.readJSON('feature-flags.json');
    return flags;
  }

  async getFeatureFlag(name: string) {
    const flags = this.readJSON('feature-flags.json');
    return flags[name] || null;
  }

  async updateFeatureFlag(name: string, enabled: boolean, adminId: number, rolloutPercentage?: number) {
    const flags = this.readJSON('feature-flags.json');
    if (!flags[name]) {
      flags[name] = { enabled: false, description: '', rollout_percentage: 100 };
    }
    flags[name].enabled = enabled;
    if (rolloutPercentage !== undefined) {
      flags[name].rollout_percentage = rolloutPercentage;
    }
    flags[name].updated_at = new Date().toISOString();
    this.writeJSON('feature-flags.json', flags);

    await this.logAdminAction({
      adminId,
      action: 'update_feature_flag',
      targetType: 'feature_flag',
      details: { name, enabled, rolloutPercentage }
    });

    return flags[name];
  }

  async createFeatureFlag(name: string, enabled: boolean, description: string, adminId: number) {
    const flags = this.readJSON('feature-flags.json');
    flags[name] = {
      enabled,
      description,
      rollout_percentage: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.writeJSON('feature-flags.json', flags);

    await this.logAdminAction({
      adminId,
      action: 'create_feature_flag',
      targetType: 'feature_flag',
      details: { name, enabled, description }
    });

    return flags[name];
  }

  async toggleMaintenanceMode(enabled: boolean, adminId: number, message?: string) {
    await this.updateSystemSetting('maintenance_mode', enabled, adminId, 'Maintenance mode status');
    
    if (message) {
      await this.updateSystemSetting('maintenance_message', message, adminId, 'Maintenance mode message');
    }

    await this.logAdminAction({
      adminId,
      action: enabled ? 'enable_maintenance_mode' : 'disable_maintenance_mode',
      details: { message }
    });
  }

  // Analytics Events
  async logAnalyticsEvent(data: {
    eventType: string;
    userId?: number;
    sessionId?: string;
    eventData?: any;
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const events = this.readJSON('analytics-events.json');
    const newEvent = {
      id: events.length + 1,
      event_type: data.eventType,
      user_id: data.userId,
      session_id: data.sessionId,
      event_data: data.eventData,
      page_url: data.pageUrl,
      referrer: data.referrer,
      user_agent: data.userAgent,
      ip_address: data.ipAddress,
      created_at: new Date().toISOString()
    };
    events.push(newEvent);
    // Keep only last 10000 events to prevent file from growing too large
    if (events.length > 10000) {
      events.shift();
    }
    this.writeJSON('analytics-events.json', events);
    return newEvent;
  }

  async getAnalyticsEvents(limit: number = 1000, offset: number = 0) {
    const events = this.readJSON('analytics-events.json');
    return events.slice(offset, offset + limit);
  }

  async getEventsByType(eventType: string, limit: number = 500) {
    const events = this.readJSON('analytics-events.json');
    return events.filter((e: any) => e.event_type === eventType).slice(0, limit);
  }

  async getEventsByDateRange(startDate: string, endDate: string, eventType?: string) {
    const events = this.readJSON('analytics-events.json');
    return events.filter((e: any) => {
      const eventDate = new Date(e.created_at);
      const matchesDate = eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
      const matchesType = !eventType || e.event_type === eventType;
      return matchesDate && matchesType;
    });
  }

  async getAnalyticsSummary(startDate: string, endDate: string) {
    const events = await this.getEventsByDateRange(startDate, endDate);
    const summary: any = {};
    
    events.forEach((event: any) => {
      if (!summary[event.event_type]) {
        summary[event.event_type] = {
          event_count: 0,
          unique_users: new Set(),
          unique_sessions: new Set()
        };
      }
      summary[event.event_type].event_count++;
      if (event.user_id) summary[event.event_type].unique_users.add(event.user_id);
      if (event.session_id) summary[event.event_type].unique_sessions.add(event.session_id);
    });

    // Convert Sets to counts
    return Object.keys(summary).map(eventType => ({
      event_type: eventType,
      event_count: summary[eventType].event_count,
      unique_users: summary[eventType].unique_users.size,
      unique_sessions: summary[eventType].unique_sessions.size
    }));
  }

  async getUserAnalytics(userId: number, startDate?: string, endDate?: string) {
    const events = this.readJSON('analytics-events.json');
    let userEvents = events.filter((e: any) => e.user_id === userId);
    
    if (startDate && endDate) {
      userEvents = userEvents.filter((e: any) => {
        const eventDate = new Date(e.created_at);
        return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
      });
    }
    
    return userEvents.slice(0, 1000);
  }

  // Reports
  async getReports(filters?: { status?: string; reason?: string }) {
    const reports = this.readJSON('reports.json');
    let filtered = reports;

    if (filters?.status) {
      filtered = filtered.filter((r: any) => r.status === filters.status);
    }

    if (filters?.reason) {
      filtered = filtered.filter((r: any) => r.reason === filters.reason);
    }

    return filtered;
  }

  async updateReportStatus(reportId: number, status: string, actionNote?: string) {
    const reports = this.readJSON('reports.json');
    const report = reports.find((r: any) => r.id === reportId);
    
    if (report) {
      report.status = status;
      report.action_note = actionNote;
      report.resolved_at = new Date().toISOString();
      this.writeJSON('reports.json', reports);
    }

    return report;
  }
}

// ============ EXPORT SINGLETON ============
export const adminStorage = USE_DATABASE ? new DatabaseAdminStorage() : new FileAdminStorage();

console.log(`[AdminStorage] Using ${USE_DATABASE ? 'DATABASE' : 'FILE'} storage`);
