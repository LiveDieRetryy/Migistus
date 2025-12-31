import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { analyticsStore } from './track';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Require admin access
    const session = await getSessionFromRequest(req);
    if (!session || session.tier !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      const { timeWindow, type } = req.query;
      const window = timeWindow ? parseInt(timeWindow as string) : 3600000; // Default 1 hour
      const cutoff = Date.now() - window;

      // Filter events by time window
      let events = analyticsStore.events.filter(e => e.receivedAt > cutoff);

      // Filter by type if specified
      if (type) {
        events = events.filter(e => e.type === type);
      }

      // Calculate stats
      const pageviews = events.filter(e => e.type === 'pageview').length;
      const actions = events.filter(e => e.type === 'action').length;
      const customEvents = events.filter(e => e.type === 'custom').length;

      // Top pages
      const pageviewEvents = events.filter(e => e.type === 'pageview');
      const pageCounts = new Map<string, number>();
      pageviewEvents.forEach(e => {
        const page = e.page || 'unknown';
        pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
      });
      const topPages = Array.from(pageCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([page, count]) => ({ page, count }));

      // Top actions
      const actionEvents = events.filter(e => e.type === 'action');
      const actionCounts = new Map<string, number>();
      actionEvents.forEach(e => {
        actionCounts.set(e.name, (actionCounts.get(e.name) || 0) + 1);
      });
      const topActions = Array.from(actionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      // Web Vitals
      const vitalEvents = events.filter(e => e.type === 'vital');
      const vitals: Record<string, { good: number; needsImprovement: number; poor: number; avg: number }> = {};
      
      vitalEvents.forEach(e => {
        if (!vitals[e.name]) {
          vitals[e.name] = { good: 0, needsImprovement: 0, poor: 0, avg: 0 };
        }
        const rating = e.data?.rating;
        if (rating === 'good') vitals[e.name].good++;
        else if (rating === 'needs-improvement') vitals[e.name].needsImprovement++;
        else if (rating === 'poor') vitals[e.name].poor++;
      });

      // Calculate averages
      Object.keys(vitals).forEach(name => {
        const vitalEvents = events.filter(e => e.type === 'vital' && e.name === name);
        const sum = vitalEvents.reduce((acc, e) => acc + (e.data?.value || 0), 0);
        vitals[name].avg = vitalEvents.length > 0 ? Math.round(sum / vitalEvents.length) : 0;
      });

      // Unique sessions
      const uniqueSessions = new Set(events.map(e => e.sessionId).filter(Boolean)).size;

      // Custom events breakdown
      const customEventCounts = new Map<string, number>();
      events.filter(e => e.type === 'custom').forEach(e => {
        customEventCounts.set(e.name, (customEventCounts.get(e.name) || 0) + 1);
      });

      return res.status(200).json({
        success: true,
        timeWindow: window,
        stats: {
          totalEvents: events.length,
          pageviews,
          actions,
          customEvents,
          uniqueSessions,
          topPages,
          topActions,
          vitals,
          customEventBreakdown: Object.fromEntries(customEventCounts)
        },
        timestamp: Date.now()
      });
    }

    if (req.method === 'DELETE') {
      // Clear analytics data
      analyticsStore.events = [];
      return res.status(200).json({ success: true, message: 'Analytics cleared' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Analytics stats error:', error);
    return res.status(500).json({ error: error.message });
  }
}
