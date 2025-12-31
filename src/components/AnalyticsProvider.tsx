import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAnalytics } from '@/lib/analytics';
import { useAuth } from '@/context/AuthContext';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const analytics = getAnalytics();

  useEffect(() => {
    // Set user ID when available
    if (user?.id) {
      analytics.setUserId(user.id);
    }
  }, [user, analytics]);

  useEffect(() => {
    // Track route changes
    const handleRouteChange = (url: string) => {
      analytics.track('pageview', url, {
        referrer: document.referrer,
        title: document.title
      });
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, analytics]);

  return <>{children}</>;
}
