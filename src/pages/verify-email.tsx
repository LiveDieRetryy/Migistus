import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { authAPI } from '@/lib/authAPI';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmail() {
  const router = useRouter();
  const { setUser, setIsAuthenticated } = useAuth();
  const [status, setStatus] = useState<'input' | 'loading' | 'success' | 'error'>('input');
  const [message, setMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setStatus('error');
      setMessage('Please enter a valid 6-digit code');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch(`/api/auth/verify-email?code=${verificationCode}`);
      const data = await response.json();

      console.log('Verification response:', { status: response.status, ok: response.ok, data });

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      const response = await authAPI.login({ email: username, password });
      
      // Store user session
      if (typeof window !== "undefined") {
        localStorage.setItem("isSignedIn", "true");
        localStorage.removeItem("isAdmin");
        localStorage.setItem("userId", String(response.user.id));
        localStorage.setItem("userSession", JSON.stringify({
          user: response.user,
          sessionId: response.session?.sessionId || '',
        }));
      }

      // Update auth context
      setUser({ ...response.user, sessionId: response.session?.sessionId || '' });
      setIsAuthenticated(true);

      router.push('/');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <>
      <Head>
        <title>Verify Email - MIGISTUS</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <img 
                src="/images/migistus_logo.png" 
                alt="MIGISTUS" 
                className="h-36 mx-auto mb-1"
              />
              <h1 className="text-2xl font-bold text-[#FFD700]">Email Verification</h1>
            </div>

            {/* Status Message */}
            <div className="text-center">
              {status === 'input' && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <p className="text-zinc-400 mb-6">Enter the 6-digit code we sent to your email</p>
                  
                  <div>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verificationCode.length !== 6}
                    className="w-full bg-gradient-to-r from-[#B8860B] to-[#FFD700] hover:from-[#FFD700] hover:to-[#B8860B] text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify Email
                  </button>

                  <p className="text-zinc-500 text-sm mt-4">
                    Didn't receive the code?{' '}
                    <Link href="/verify-email-reminder" className="text-[#FFD700] hover:underline">
                      Resend Code
                    </Link>
                  </p>
                </form>
              )}

              {status === 'loading' && (
                <div>
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-zinc-700 border-t-[#FFD700] mb-4"></div>
                  <p className="text-zinc-400">Verifying your email address...</p>
                </div>
              )}

              {status === 'success' && (
                <div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                    <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <h2 className="text-xl font-bold text-green-500 mb-2">Welcome to MIGISTUS! 🎉</h2>
                    <p className="text-zinc-300">{message}</p>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={handleLogin} className="space-y-4 text-left">
                    <p className="text-zinc-400 text-center mb-4">Sign in to start exploring The Guilded Marketplace</p>
                    
                    {loginError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{loginError}</p>
                      </div>
                    )}

                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
                        Username or Email
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                        placeholder="Enter your username or email"
                        required
                        disabled={loggingIn}
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                        placeholder="Enter your password"
                        required
                        disabled={loggingIn}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loggingIn}
                      className="w-full bg-gradient-to-r from-[#B8860B] to-[#FFD700] hover:from-[#FFD700] hover:to-[#B8860B] text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loggingIn ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        '🎮 Sign In & Start Exploring'
                      )}
                    </button>

                    <div className="text-center">
                      <Link href="/forgot-password" className="text-sm text-[#FFD700] hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                  </form>
                </div>
              )}

              {status === 'error' && (
                <div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <h2 className="text-xl font-bold text-red-500 mb-2">Verification Failed</h2>
                    <p className="text-zinc-300 mb-4">{message}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Link 
                      href="/login"
                      className="block w-full bg-[#B8860B] hover:bg-[#FFD700] text-black font-semibold py-3 px-4 rounded-lg transition-all duration-300"
                    >
                      Go to Login
                    </Link>
                    <button
                      onClick={() => router.push('/')}
                      className="block w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 px-4 rounded-lg transition-all duration-300"
                    >
                      Back to Home
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Help Text */}
          {status === 'error' && (
            <div className="mt-6 text-center">
              <p className="text-zinc-500 text-sm">
                Need help?{' '}
                <a href="mailto:support@migistus.com" className="text-[#FFD700] hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
