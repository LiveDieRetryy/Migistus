// API endpoint for recording live user interactions
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

  try {
    initializeTrackingFile();

    const { type, userId, supplierId, productId, metadata } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'Event type is required' });
    }

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

    res.status(200).json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Error recording tracking event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
