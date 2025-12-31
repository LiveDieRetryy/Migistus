import type { NextApiRequest, NextApiResponse } from 'next';

interface AnalyticsEvent {
  type: 'pageview' | 'action' | 'vital' | 'custom';
  name: string;
  data?: Record<string, any>;
  timestamp: number;
  sessionId?: string;
  userId?: number;
  page?: string;
}

// In-memory storage for demo (in production, use database)
const analyticsStore = {
  events: [] as (AnalyticsEvent & { receivedAt: number })[],
  maxEvents: 10000 // Keep last 10k events
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { events } = req.body as { events: AnalyticsEvent[] };

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid events format' });
    }

    // Store events with received timestamp
    const receivedAt = Date.now();
    events.forEach(event => {
      analyticsStore.events.push({
        ...event,
        receivedAt
      });
    });

    // Trim to max size
    if (analyticsStore.events.length > analyticsStore.maxEvents) {
      analyticsStore.events = analyticsStore.events.slice(-analyticsStore.maxEvents);
    }

    return res.status(200).json({ 
      success: true, 
      received: events.length,
      total: analyticsStore.events.length
    });
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Export store for stats endpoint
export { analyticsStore };
