// API endpoint for recording live user interactions
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

const TRACKING_FILE = path.join(process.cwd(), 'public/data/live-tracking.json');

// Initialize tracking file if it doesn't exist
function initializeTrackingFile() {
  if (!fs.existsSync(TRACKING_FILE)) {
    const initialData: LiveTrackingData = {
      events: [],
      lastUpdated: Date.now()
    };
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(initialData, null, 2));
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const useProduction = isProduction();

  try {
    const { type, userId, supplierId, productId, metadata } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'Event type is required' });
    }

    if (useProduction) {
      // ============================================
      // PRODUCTION: Use database
      // ============================================
      const event = await db.createAnalyticsEvent({
        eventType: type,
        userId: userId ? parseInt(userId) : undefined,
        supplierId: supplierId ? parseInt(supplierId) : undefined,
        productId: productId ? parseInt(productId) : undefined,
        metadata,
        userAgent: req.headers['user-agent'] || undefined,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || undefined
      });

      return res.status(200).json({ success: true, eventId: event.id });

    } else {
      // ============================================
      // DEVELOPMENT: Use file system (legacy)
      // ============================================
      initializeTrackingFile();

      // Read current tracking data
      const trackingData: LiveTrackingData = JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8'));

      // Create new tracking event
      const event: TrackingEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        userId,
        supplierId,
        productId,
        timestamp: Date.now(),
        metadata
      };

      // Add event to tracking data
      trackingData.events.push(event);
      trackingData.lastUpdated = Date.now();

      // Keep only last 10000 events to prevent file from growing too large
      if (trackingData.events.length > 10000) {
        trackingData.events = trackingData.events.slice(-10000);
      }

      // Save updated tracking data
      fs.writeFileSync(TRACKING_FILE, JSON.stringify(trackingData, null, 2));

      return res.status(200).json({ success: true, eventId: event.id });
    }
  } catch (error) {
    console.error('Error recording tracking event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
