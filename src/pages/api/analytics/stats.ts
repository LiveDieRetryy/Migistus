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

      // Group page views with more details
      const pageViewsDetailed = Array.from(pageCounts.entries()).map(([page, views]) => {
        const pageEvents = pageviewEvents.filter(e => e.page === page);
        const uniqueUsers = new Set(pageEvents.map(e => e.userId).filter(Boolean)).size;
        const times = pageEvents.map(e => e.data?.timeOnPage || 0).filter(t => t > 0);
        const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
        return { page, views, uniqueUsers, avgTime };
      }).sort((a, b) => b.views - a.views);

      // User actions with timestamps
      const userActionsDetailed = Array.from(actionCounts.entries()).map(([action, count]) => {
        const lastEvent = actionEvents.filter(e => e.name === action).sort((a, b) => b.receivedAt - a.receivedAt)[0];
        return { 
          action, 
          count,
          lastOccurred: lastEvent ? new Date(lastEvent.receivedAt).toISOString() : new Date().toISOString()
        };
      }).sort((a, b) => b.count - a.count);

      // Web Vitals formatted
      const webVitalsFormatted = {
        lcp: {
          avg: vitals['LCP']?.avg || 0,
          rating: vitals['LCP']?.avg < 2500 ? 'good' : vitals['LCP']?.avg < 4000 ? 'needs-improvement' : 'poor'
        },
        fid: {
          avg: vitals['FID']?.avg || 0,
          rating: vitals['FID']?.avg < 100 ? 'good' : vitals['FID']?.avg < 300 ? 'needs-improvement' : 'poor'
        },
        cls: {
          avg: vitals['CLS']?.avg || 0,
          rating: vitals['CLS']?.avg < 0.1 ? 'good' : vitals['CLS']?.avg < 0.25 ? 'needs-improvement' : 'poor'
        },
        pageLoad: {
          avg: vitals['PageLoad']?.avg || 0,
          rating: vitals['PageLoad']?.avg < 2000 ? 'good' : vitals['PageLoad']?.avg < 4000 ? 'needs-improvement' : 'poor'
        }
      };

      // Custom events detailed
      const customEventsDetailed = Array.from(customEventCounts.entries()).map(([event, count]) => {
        const eventData = events.filter(e => e.type === 'custom' && e.name === event).map(e => e.data);
        return { event, count, data: eventData[0] || {} };
      }).sort((a, b) => b.count - a.count);

      // Top products from custom events
      const productViews = events.filter(e => e.type === 'custom' && e.name === 'product_view');
      const productVotes = events.filter(e => e.type === 'custom' && e.name === 'vote');
      const productCartAdds = events.filter(e => e.type === 'custom' && e.name === 'add_to_cart');
      const productPurchases = events.filter(e => e.type === 'custom' && (e.name === 'buy_now' || e.name === 'purchase'));
      
      const productStats = new Map<number, { id: number; name: string; views: number; votes: number; cartAdds: number; purchases: number }>();
      
      productViews.forEach(e => {
        const id = e.data?.productId;
        const name = e.data?.productName;
        if (id) {
          if (!productStats.has(id)) {
            productStats.set(id, { id, name: name || 'Unknown', views: 0, votes: 0, cartAdds: 0, purchases: 0 });
          }
          productStats.get(id)!.views++;
        }
      });

      productVotes.forEach(e => {
        const id = e.data?.productId;
        if (id && productStats.has(id)) {
          productStats.get(id)!.votes++;
        }
      });

      productCartAdds.forEach(e => {
        const id = e.data?.productId;
        if (id && productStats.has(id)) {
          productStats.get(id)!.cartAdds++;
        }
      });

      productPurchases.forEach(e => {
        const id = e.data?.productId;
        if (id && productStats.has(id)) {
          productStats.get(id)!.purchases++;
        }
      });

      const topProducts = Array.from(productStats.values())
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      return res.status(200).json({
        pageViews: pageViewsDetailed,
        userActions: userActionsDetailed,
        webVitals: webVitalsFormatted,
        customEvents: customEventsDetailed,
        topProducts,
        meta: {
          totalEvents: events.length,
          uniqueSessions,
          timeWindow: window,
          timestamp: Date.now()
        }
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
