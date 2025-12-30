// API endpoint for getting live tracking analytics
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { db, isProduction } from '@/lib/db';

interface TrackingEvent {
  id: string;
  type: 'view' | 'vote' | 'pledge' | 'follow' | 'share' | 'like';
  userId?: string;
  supplierId?: string;
  productId?: string;
  timestamp: number;
  metadata?: any;
}

interface LiveTrackingData {
  events: TrackingEvent[];
  lastUpdated: number;
}

interface SupplierMetrics {
  supplierId: string;
  totalViews: number;
  totalVotes: number;
  totalPledges: number;
  totalFollows: number;
  totalShares: number;
  totalLikes: number;
  uniqueUsers: number;
  recentActivity: any[];
  hourlyData: { hour: number; views: number; interactions: number }[];
  topProducts: { productId: string; views: number; votes: number; pledges: number }[];
}

const TRACKING_FILE = path.join(process.cwd(), 'public/data/live-tracking.json');

function getTrackingData(): LiveTrackingData {
  if (!fs.existsSync(TRACKING_FILE)) {
    return { events: [], lastUpdated: Date.now() };
  }
  return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8'));
}

function calculateSupplierMetrics(supplierId: string): SupplierMetrics {
  const trackingData = getTrackingData();
  const supplierEvents = trackingData.events.filter(event => event.supplierId === supplierId);
  
  // Calculate basic metrics
  const totalViews = supplierEvents.filter(e => e.type === 'view').length;
  const totalVotes = supplierEvents.filter(e => e.type === 'vote').length;
  const totalPledges = supplierEvents.filter(e => e.type === 'pledge').length;
  const totalFollows = supplierEvents.filter(e => e.type === 'follow').length;
  const totalShares = supplierEvents.filter(e => e.type === 'share').length;
  const totalLikes = supplierEvents.filter(e => e.type === 'like').length;
  
  // Calculate unique users
  const uniqueUsers = new Set(supplierEvents.map(e => e.userId).filter(Boolean)).size;
  
  // Get recent activity (last 50 events)
  const recentActivity = supplierEvents
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);
  
  // Calculate hourly data for the last 24 hours
  const now = Date.now();
  const dayAgo = now - (24 * 60 * 60 * 1000);
  const recentEvents = supplierEvents.filter(e => e.timestamp > dayAgo);
  
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = 23 - i;
    const hourStart = now - (hour * 60 * 60 * 1000);
    const hourEnd = hourStart + (60 * 60 * 1000);
    
    const hourEvents = recentEvents.filter(e => e.timestamp >= hourStart && e.timestamp < hourEnd);
    
    return {
      hour,
      views: hourEvents.filter(e => e.type === 'view').length,
      interactions: hourEvents.filter(e => ['vote', 'pledge', 'follow', 'share', 'like'].includes(e.type)).length
    };
  });
  
  // Calculate top products
  const productMetrics = new Map<string, { views: number; votes: number; pledges: number }>();
  
  supplierEvents.forEach(event => {
    if (event.productId) {
      if (!productMetrics.has(event.productId)) {
        productMetrics.set(event.productId, { views: 0, votes: 0, pledges: 0 });
      }
      const metrics = productMetrics.get(event.productId)!;
      
      if (event.type === 'view') metrics.views++;
      else if (event.type === 'vote') metrics.votes++;
      else if (event.type === 'pledge') metrics.pledges++;
    }
  });
  
  const topProducts = Array.from(productMetrics.entries())
    .map(([productId, metrics]) => ({ productId, ...metrics }))
    .sort((a, b) => (b.views + b.votes + b.pledges) - (a.views + a.votes + a.pledges))
    .slice(0, 10);
  
  return {
    supplierId,
    totalViews,
    totalVotes,
    totalPledges,
    totalFollows,
    totalShares,
    totalLikes,
    uniqueUsers,
    recentActivity,
    hourlyData,
    topProducts
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const useProduction = isProduction();

  try {
    const { supplierId, type } = req.query;

    if (useProduction) {
      // ============================================
      // PRODUCTION: Use database
      // ============================================
      
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
        const stats = await db.getEventStats({});
        
        // Group by supplier
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

    } else {
      // ============================================
      // DEVELOPMENT: Use file system (legacy)
      // ============================================
      
      if (supplierId && typeof supplierId === 'string') {
        // Get metrics for specific supplier
        const metrics = calculateSupplierMetrics(supplierId);
        return res.status(200).json(metrics);
      }

      if (type === 'summary') {
        // Get summary of all suppliers
        const trackingData = getTrackingData();
        const supplierIds = Array.from(new Set(trackingData.events.map(e => e.supplierId).filter(Boolean)));
        
        const summary = supplierIds.map(id => {
          const metrics = calculateSupplierMetrics(id!);
          return {
            supplierId: id,
            totalViews: metrics.totalViews,
            totalVotes: metrics.totalVotes,
            totalPledges: metrics.totalPledges,
            totalFollows: metrics.totalFollows,
            uniqueUsers: metrics.uniqueUsers
          };
        });
        
        return res.status(200).json(summary);
      }

      // Get general tracking stats
      const trackingData = getTrackingData();
      const stats = {
        totalEvents: trackingData.events.length,
        lastUpdated: trackingData.lastUpdated,
        eventTypes: {
          views: trackingData.events.filter(e => e.type === 'view').length,
          votes: trackingData.events.filter(e => e.type === 'vote').length,
          pledges: trackingData.events.filter(e => e.type === 'pledge').length,
          follows: trackingData.events.filter(e => e.type === 'follow').length,
          shares: trackingData.events.filter(e => e.type === 'share').length,
          likes: trackingData.events.filter(e => e.type === 'like').length,
        }
      };

      return res.status(200).json(stats);
    }
  } catch (error) {
    console.error('Error getting tracking analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
