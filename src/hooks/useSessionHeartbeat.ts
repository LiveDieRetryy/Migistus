import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Hook to send periodic heartbeats to update session activity
 * This keeps the user's online status active and tracks their current page
 */
export function useSessionHeartbeat(isAuthenticated: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Send initial heartbeat
    sendHeartbeat(router.pathname);

    // Send heartbeat every 30 seconds
    const interval = setInterval(() => {
      sendHeartbeat(router.pathname);
    }, 30000);

    // Send heartbeat on page change
    const handleRouteChange = (url: string) => {
      sendHeartbeat(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      clearInterval(interval);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [isAuthenticated, router]);
}

async function sendHeartbeat(currentPage: string) {
  try {
    await fetch('/api/sessions/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPage }),
      credentials: 'include', // Include cookies
    });
  } catch (error) {
    // Silently fail - heartbeats are not critical
    console.debug('Heartbeat failed:', error);
  }
}
