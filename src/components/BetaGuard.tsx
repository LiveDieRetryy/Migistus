import { useEffect } from 'react';
import { useRouter } from 'next/router';

interface BetaGuardProps {
  children: React.ReactNode;
}

export default function BetaGuard({ children }: BetaGuardProps) {
  const router = useRouter();

  useEffect(() => {
    // Skip beta check for the beta-access page itself
    if (router.pathname === '/beta-access') {
      return;
    }

    // Check if beta mode is enabled by admin - default to true if not set
    const betaModeValue = localStorage.getItem('betaModeEnabled');
    const betaModeEnabled = betaModeValue === null ? true : betaModeValue === 'true';
    
    // If beta mode is disabled, allow access
    if (!betaModeEnabled) {
      return;
    }

    // Check if user has beta access
    const betaAuth = localStorage.getItem('betaAuthenticated');
    
    if (betaAuth !== 'true') {
      router.push('/beta-access');
    }
  }, [router.pathname, router]);

  return <>{children}</>;
}
