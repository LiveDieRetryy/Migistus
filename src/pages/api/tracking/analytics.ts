// API endpoint for getting live tracking analytics
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { supplierId, type } = req.query;
    
    if (supplierId && typeof supplierId === 'string') {
      // Get metrics for specific supplier
      const supplierIdNum = parseInt(supplierId);
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get basic event stats
      const stats = await db.getEventStats({
        supplierId: supplierIdNum,
        startDate: dayAgo.toISOString()
      });

      // Get recent events
      const recentEvents = await db.getAnalyticsEvents({
        supplierId: supplierIdNum,
        limit: 50
      });

      // Transform stats into metrics format
      const metrics: any = {
        supplierId,
        totalViews: 0,
        totalVotes: 0,
        totalPledges: 0,
        totalFollows: 0,
        totalShares: 0,
        totalLikes: 0,
        uniqueUsers: 0,
        recentActivity: recentEvents
      };

      stats.forEach((stat: any) => {
        if (stat.event_type === 'view') metrics.totalViews = stat.count;
        else if (stat.event_type === 'vote') metrics.totalVotes = stat.count;
        else if (stat.event_type === 'pledge') metrics.totalPledges = stat.count;
        else if (stat.event_type === 'follow') metrics.totalFollows = stat.count;
        else if (stat.event_type === 'share') metrics.totalShares = stat.count;
        else if (stat.event_type === 'like') metrics.totalLikes = stat.count;
        
        metrics.uniqueUsers = Math.max(metrics.uniqueUsers, stat.unique_users);
      });

      return res.status(200).json(metrics);
    }

    if (type === 'summary') {
      // Get summary of all suppliers
      const supplierMap = new Map();
      
      const allEvents = await db.getAnalyticsEvents({ limit: 10000 });
      allEvents.forEach((event: any) => {
        if (event.supplier_id) {
          if (!supplierMap.has(event.supplier_id)) {
            supplierMap.set(event.supplier_id, {
              supplierId: event.supplier_id,
              totalViews: 0,
              totalVotes: 0,
              totalPledges: 0,
              totalFollows: 0,
              uniqueUsers: new Set()
            });
          }
          const data = supplierMap.get(event.supplier_id);
          if (event.event_type === 'view') data.totalViews++;
          else if (event.event_type === 'vote') data.totalVotes++;
          else if (event.event_type === 'pledge') data.totalPledges++;
          else if (event.event_type === 'follow') data.totalFollows++;
          if (event.user_id) data.uniqueUsers.add(event.user_id);
        }
      });

      const summary = Array.from(supplierMap.values()).map(data => ({
        supplierId: data.supplierId,
        totalViews: data.totalViews,
        totalVotes: data.totalVotes,
        totalPledges: data.totalPledges,
        totalFollows: data.totalFollows,
        uniqueUsers: data.uniqueUsers.size
      }));

      return res.status(200).json(summary);
    }

    // Get general tracking stats
    const stats = await db.getEventStats({});
    const totalEvents = stats.reduce((sum: number, stat: any) => sum + stat.count, 0);
    
    const eventTypes = {
      views: 0,
      votes: 0,
      pledges: 0,
      follows: 0,
      shares: 0,
      likes: 0
    };

    stats.forEach((stat: any) => {
      if (stat.event_type === 'view') eventTypes.views = stat.count;
      else if (stat.event_type === 'vote') eventTypes.votes = stat.count;
      else if (stat.event_type === 'pledge') eventTypes.pledges = stat.count;
      else if (stat.event_type === 'follow') eventTypes.follows = stat.count;
      else if (stat.event_type === 'share') eventTypes.shares = stat.count;
      else if (stat.event_type === 'like') eventTypes.likes = stat.count;
    });

    return res.status(200).json({
      totalEvents,
      lastUpdated: Date.now(),
      eventTypes
    });
  } catch (error) {
    console.error('Error getting tracking analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
