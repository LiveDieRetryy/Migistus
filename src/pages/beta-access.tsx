import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { Lock, Shield } from 'lucide-react';

export default function BetaAccess() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const betaAuth = localStorage.getItem('betaAuthenticated');
    if (betaAuth === 'true') {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Beta access password - you can change this
    const BETA_PASSWORD = 'migistus2026';

    if (password === BETA_PASSWORD) {
      localStorage.setItem('betaAuthenticated', 'true');
      router.push('/');
    } else {
      setError('Invalid access code. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>MIGISTUS - Beta Access</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 50 }).map((_, i) => {
              const x = Math.random() * 100;
              const y = Math.random() * 100;
              const r = Math.random() * 1.5 + 0.3;
              const dur = (Math.random() * 3 + 2).toFixed(2);
              return (
                <circle
                  key={i}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r={r}
                  fill="#ffd700"
                  opacity="0.4"
                >
                  <animate
                    attributeName="opacity"
                    values="0.2;0.8;0.2"
                    dur={`${dur}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              );
            })}
          </svg>
        </div>

        {/* Beta Access Card */}
        <div className="relative z-10 max-w-md w-full">
          <div className="bg-zinc-900/90 backdrop-blur-xl border-2 border-yellow-500/40 rounded-2xl p-8 shadow-2xl shadow-yellow-500/20">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/images/migistus_logo.png"
                alt="MIGISTUS"
                width={120}
                height={120}
                className="transition-transform duration-300 hover:scale-110"
              />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-4">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-semibold">PRIVATE BETA</span>
              </div>
              
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 mb-3">
                Beta Access Required
              </h1>
              
              <p className="text-zinc-400 text-sm">
                MIGISTUS is currently in private beta. Enter your access code to continue.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                  Access Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                    placeholder="Enter beta access code"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Verifying...' : 'Enter MIGISTUS'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// Disable footer for this page
(BetaAccess as any).showFooter = false;
