// API endpoint for getting live tracking analytics
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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
  recentActivity: TrackingEvent[];
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

  try {
    const { supplierId, type } = req.query;

    if (supplierId && typeof supplierId === 'string') {
      // Get metrics for specific supplier
      const metrics = calculateSupplierMetrics(supplierId);
      return res.status(200).json(metrics);
    }    if (type === 'summary') {
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

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting tracking analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
