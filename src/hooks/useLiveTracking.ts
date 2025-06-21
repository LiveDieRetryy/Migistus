// Custom hook for live tracking functionality
import { useCallback } from 'react';

interface TrackingOptions {
  userId?: string;
  supplierId?: string;
  productId?: string;
  metadata?: any;
}

export const useLiveTracking = () => {
  const track = useCallback(async (
    type: 'view' | 'vote' | 'pledge' | 'follow' | 'share' | 'like',
    options: TrackingOptions = {}
  ) => {
    try {
      await fetch('/api/tracking/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          ...options,
        }),
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, []);

  const trackView = useCallback(async (options: TrackingOptions = {}) => {
    await track('view', options);
  }, [track]);

  const trackVote = useCallback(async (options: TrackingOptions = {}) => {
    await track('vote', options);
  }, [track]);

  const trackPledge = useCallback(async (options: TrackingOptions = {}) => {
    await track('pledge', options);
  }, [track]);

  const trackFollow = useCallback(async (options: TrackingOptions = {}) => {
    await track('follow', options);
  }, [track]);

  const trackShare = useCallback(async (options: TrackingOptions = {}) => {
    await track('share', options);
  }, [track]);

  const trackLike = useCallback(async (options: TrackingOptions = {}) => {
    await track('like', options);
  }, [track]);

  return {
    track,
    trackView,
    trackVote,
    trackPledge,
    trackFollow,
    trackShare,
    trackLike,
  };
};

// Hook for getting live analytics
export const useLiveAnalytics = () => {
  const getSupplierMetrics = useCallback(async (supplierId: string) => {
    try {
      const response = await fetch(`/api/tracking/analytics?supplierId=${supplierId}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching supplier metrics:', error);
      return null;
    }
  }, []);

  const getAllSuppliersMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/tracking/analytics?type=summary');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching suppliers metrics:', error);
      return [];
    }
  }, []);

  const getTrackingStats = useCallback(async () => {
    try {
      const response = await fetch('/api/tracking/analytics');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching tracking stats:', error);
      return null;
    }
  }, []);

  return {
    getSupplierMetrics,
    getAllSuppliersMetrics,
    getTrackingStats,
  };
};
