import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function MaintenancePage() {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Check every 3 seconds if maintenance mode is still active
    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/maintenance-status');
        const data = await response.json();
        
        if (!data.maintenanceMode) {
          // Redirect back to home if maintenance is over
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
      }
    }, 3000);

    return () => clearInterval(checkInterval);
  }, []);

  // Animated countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev === 0 ? 3 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Head>
        <title>MIGISTUS - Under Maintenance</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4 overflow-hidden relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/3 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-2xl w-full">
          <div className="bg-zinc-900/50 backdrop-blur-xl border-2 border-amber-500/20 rounded-3xl p-12 shadow-2xl shadow-amber-500/10">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/50 animate-bounce">
                  <svg className="w-12 h-12 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-black text-center mb-4 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">
              MIGISTUS
            </h1>
            
            <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-6">
              Under Maintenance
            </h2>

            {/* Message */}
            <div className="space-y-4 mb-8">
              <p className="text-center text-zinc-300 text-lg">
                We're currently performing scheduled maintenance to improve your experience.
              </p>
              <p className="text-center text-zinc-400">
                Our team is working hard to get things back up and running as soon as possible.
              </p>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="relative">
                <div className="w-4 h-4 bg-amber-500 rounded-full animate-ping absolute" />
                <div className="w-4 h-4 bg-amber-400 rounded-full relative" />
              </div>
              <span className="text-zinc-300 font-medium">System Updating...</span>
            </div>

            {/* Auto-refresh Notice */}
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-300 font-medium">Auto-checking for updates</p>
                  <p className="text-xs text-zinc-500">This page will automatically reload when we're back</p>
                </div>
                <div className="text-2xl font-bold text-amber-400 tabular-nums">
                  {countdown}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="border-t border-zinc-700/50 pt-6">
              <p className="text-center text-zinc-400 text-sm mb-4">
                Need urgent assistance?
              </p>
              <div className="flex justify-center gap-6">
                <a 
                  href="mailto:support@migistus.com" 
                  className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Email Support</span>
                </a>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-zinc-500 text-sm mt-6">
            Thank you for your patience • MIGISTUS Team
          </p>
        </div>
      </div>

      <style jsx>{`
        .delay-500 {
          animation-delay: 500ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </>
  );
}

// Don't show footer on maintenance page
(MaintenancePage as any).showFooter = false;
