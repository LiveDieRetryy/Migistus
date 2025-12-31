// Client-side analytics tracking
interface AnalyticsEvent {
  type: 'pageview' | 'action' | 'vital' | 'custom';
  name: string;
  data?: Record<string, any>;
  timestamp: number;
  sessionId?: string;
  userId?: number;
  page?: string;
}

class Analytics {
  private sessionId: string;
  private queue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private userId?: number;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startAutoFlush();
    this.initializeTracking();
  }

  private getOrCreateSessionId(): string {
    const key = 'analytics_session_id';
    let sessionId = sessionStorage.getItem(key);
    
    if (!sessionId) {
      sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(key, sessionId);
    }
    
    return sessionId;
  }

  setUserId(userId: number) {
    this.userId = userId;
  }

  private initializeTracking() {
    if (typeof window === 'undefined') return;

    // Track page views on route change
    this.trackPageView();

    // Track Web Vitals
    this.trackWebVitals();

    // Track clicks on important elements
    this.trackClicks();

    // Track form submissions
    this.trackForms();
  }

  private trackPageView() {
    this.track('pageview', window.location.pathname, {
      referrer: document.referrer,
      title: document.title
    });
  }

  private trackWebVitals() {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.track('vital', 'LCP', {
            value: lastEntry.startTime,
            rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {}

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            this.track('vital', 'FID', {
              value: fid,
              rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor'
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {}

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.track('vital', 'CLS', {
            value: clsValue,
            rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {}
    }

    // Fallback: Track page load time
    if ('performance' in window && 'timing' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          this.track('vital', 'PageLoad', {
            value: loadTime,
            rating: loadTime < 2000 ? 'good' : loadTime < 4000 ? 'needs-improvement' : 'poor'
          });
        }, 0);
      });
    }
  }

  private trackClicks() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button')!;
        this.track('action', 'button_click', {
          text: button.textContent?.trim().substring(0, 50),
          className: button.className,
          id: button.id
        });
      }

      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = (target.tagName === 'A' ? target : target.closest('a')!) as HTMLAnchorElement;
        this.track('action', 'link_click', {
          href: link.href,
          text: link.textContent?.trim().substring(0, 50),
          external: !link.href.startsWith(window.location.origin)
        });
      }
    });
  }

  private trackForms() {
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      this.track('action', 'form_submit', {
        action: form.action,
        method: form.method,
        id: form.id,
        className: form.className
      });
    });
  }

  track(type: AnalyticsEvent['type'], name: string, data?: Record<string, any>) {
    const event: AnalyticsEvent = {
      type,
      name,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      page: typeof window !== 'undefined' ? window.location.pathname : undefined
    };

    this.queue.push(event);

    // Flush if queue is large
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  // Custom event tracking for business logic
  trackCustom(eventName: string, data?: Record<string, any>) {
    this.track('custom', eventName, data);
  }

  // Track specific business events
  trackPurchase(productId: string | number, amount: number) {
    this.trackCustom('purchase', { productId, amount });
  }

  trackVote(productId: string | number, voteType: string) {
    this.trackCustom('vote', { productId, voteType });
  }

  trackProductView(productId: string | number, productName: string) {
    this.trackCustom('product_view', { productId, productName });
  }

  trackSearch(query: string, resultsCount: number) {
    this.trackCustom('search', { query, resultsCount });
  }

  private startAutoFlush() {
    // Flush every 10 seconds
    this.flushInterval = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, 10000);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });
    }
  }

  private async flush(useBeacon = false) {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      if (useBeacon && 'sendBeacon' in navigator) {
        // Use sendBeacon for guaranteed delivery on page unload
        const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/track', blob);
      } else {
        // Regular fetch for normal flushes
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
          keepalive: true
        });
      }
    } catch (error) {
      console.error('Failed to send analytics:', error);
      // Re-queue events on failure
      this.queue.unshift(...events);
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Singleton instance
let analyticsInstance: Analytics | null = null;

export function getAnalytics(): Analytics {
  if (typeof window === 'undefined') {
    // Return mock for SSR - cast to unknown first to avoid private property issues
    return {
      setUserId: () => {},
      track: () => {},
      trackPageView: () => {},
      trackCustom: () => {},
      trackPurchase: () => {},
      trackVote: () => {},
      trackProductView: () => {},
      trackSearch: () => {},
      flush: () => {},
      destroy: () => {}
    } as unknown as Analytics;
  }

  if (!analyticsInstance) {
    analyticsInstance = new Analytics();
  }

  return analyticsInstance;
}

export const analytics = typeof window !== 'undefined' ? getAnalytics() : null;
