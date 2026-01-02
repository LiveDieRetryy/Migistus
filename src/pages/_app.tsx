import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { Web3Utils } from "@/utils/web3Utils";
import MainLayout from "@/components/layout/MainLayout";
import BetaGuard from "@/components/BetaGuard";
import "@/styles/globals.css";

// Error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Initialize Web3 error suppression
    Web3Utils.suppressMetaMaskErrors();

    const handleError = (error: ErrorEvent) => {
      // Handle MetaMask and other Web3 errors silently
      if (
        error.message?.includes("MetaMask") ||
        error.message?.includes("ethereum") ||
        error.filename?.includes("metamask") ||
        error.filename?.includes("inpage.js") ||
        error.filename?.includes("chrome-extension://")
      ) {
        console.warn("Web3/MetaMask error caught and suppressed:", error.message);
        return; // Don't show error UI for these
      }

      console.error("Application error:", error);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Handle MetaMask promise rejections
      if (
        event.reason?.message?.includes("MetaMask") ||
        event.reason?.message?.includes("ethereum") ||
        event.reason?.stack?.includes("chrome-extension://")
      ) {
        console.warn("Web3/MetaMask promise rejection suppressed:", event.reason);
        event.preventDefault(); // Prevent unhandled rejection error
        return;
      }

      console.error("Unhandled promise rejection:", event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <button
            onClick={() => {
              setHasError(false);
              window.location.reload();
            }}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    // Initialize user sync service early
    setTimeout(() => {
      if (typeof window !== "undefined" && (window as any).MigistusUserSync) {
        console.log("🚀 App: Initializing user sync service...");
        (window as any).MigistusUserSync.initialize();
      }
    }, 3000);
  }, []);

  // Check for maintenance mode
  useEffect(() => {
    const checkMaintenance = async () => {
      // Don't check if we're already on maintenance or admin pages
      if (router.pathname === '/maintenance' || router.pathname.startsWith('/kingdom') || router.pathname === '/admin-login') {
        setCheckingMaintenance(false);
        return;
      }

      try {
        const response = await fetch('/api/maintenance-status');
        const data = await response.json();
        
        if (data.maintenanceMode) {
          setMaintenanceMode(true);
          router.push('/maintenance');
        } else {
          setMaintenanceMode(false);
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
      } finally {
        setCheckingMaintenance(false);
      }
    };

    if (mounted) {
      checkMaintenance();
    }
  }, [mounted, router]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || checkingMaintenance) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }

  // Check if the page has layout options
  const getLayout = (Component as any).getLayout || ((page: any) => page);
  const showFooter = (Component as any).showFooter !== false; // Default to true unless explicitly disabled

  return (
    <ErrorBoundary>
      <BetaGuard>
        <AuthProvider>
          <ToastProvider>
            <AnalyticsProvider>
              <MainLayout showFooter={showFooter}>
                {getLayout(<Component {...pageProps} />)}
              </MainLayout>
            </AnalyticsProvider>
          </ToastProvider>
        </AuthProvider>
      </BetaGuard>
      <Analytics />
    </ErrorBoundary>
  );
}
