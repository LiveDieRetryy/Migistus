import { useEffect, useRef } from 'react';
import { getAnalytics } from '@/lib/analytics';

/**
 * Hook to access analytics tracking methods
 */
export function useAnalytics() {
  const analytics = getAnalytics();
  return analytics;
}

/**
 * Hook to automatically track page views
 * @param pageName - Name of the page for analytics
 * @param metadata - Additional metadata to track
 */
export function usePageView(pageName: string, metadata?: Record<string, any>) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      const analytics = getAnalytics();
      analytics.trackCustom('page_view', {
        page: pageName,
        ...metadata
      });
      hasTracked.current = true;
    }
  }, [pageName, metadata]);
}

/**
 * Hook to track product views
 * @param productId - ID of the product
 * @param productName - Name of the product
 */
export function useProductView(productId: string | number | undefined, productName: string | undefined) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (productId && productName && !hasTracked.current) {
      const analytics = getAnalytics();
      analytics.trackProductView(productId, productName);
      hasTracked.current = true;
    }
  }, [productId, productName]);
}

/**
 * Hook to track time spent on page
 * @param pageName - Name of the page
 */
export function useTimeOnPage(pageName: string) {
  const startTime = useRef(Date.now());

  useEffect(() => {
    return () => {
      const timeSpent = Date.now() - startTime.current;
      const analytics = getAnalytics();
      analytics.trackCustom('time_on_page', {
        page: pageName,
        duration: timeSpent,
        durationSeconds: Math.round(timeSpent / 1000)
      });
    };
  }, [pageName]);
}
