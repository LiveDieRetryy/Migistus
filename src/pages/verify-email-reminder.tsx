import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { authAPI } from '@/lib/authAPI';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailReminder() {
  const router = useRouter();
  const { email, username } = router.query;
  const { setUser, setIsAuthenticated } = useAuth();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email address is missing');
      return;
    }

    setResending(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Verification code sent! Check your inbox.');
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/auth/verify-email?code=${verificationCode}`);
      const data = await response.json();

      if (response.ok) {
        setVerified(true);
        setMessage('✅ Email verified successfully! Please sign in below.');
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (error) {
      setError('An error occurred during verification');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      const response = await authAPI.login({ email: loginUsername, password: loginPassword });
      
      if (typeof window !== "undefined") {
        localStorage.setItem("isSignedIn", "true");
        localStorage.removeItem("isAdmin");
        localStorage.setItem("userId", String(response.user.id));
        localStorage.setItem("userSession", JSON.stringify({
          user: response.user,
          sessionId: response.session?.sessionId || '',
        }));
      }

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
        <title>Email Verification Required - MIGISTUS</title>
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
              <h1 className="text-2xl font-bold text-[#FFD700]">Email Verification Required</h1>
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-yellow-500 mb-2">Verify Your Email</h3>
                  <p className="text-zinc-300 text-sm">
                    {username && `Hi ${username}, y`}
                    {!username && 'Y'}our account requires email verification before you can log in.
                  </p>
                  {email && (
                    <p className="text-zinc-400 text-sm mt-2">
                      <strong>Email:</strong> {email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4 mb-6">
              <p className="text-zinc-300 text-sm">
                We've sent a 6-digit verification code to your email address. Please check your inbox (and spam folder) and enter the code below.
              </p>
            </div>

            {/* Status Messages */}
            {message && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                <p className="text-green-500 text-sm">{message}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {!verified ? (
              <>
                {/* Verification Code Input */}
                <form onSubmit={handleVerifyCode} className="space-y-4 mb-4">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-zinc-300 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                      placeholder="000000"
                      maxLength={6}
                      disabled={verifying}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verificationCode.length !== 6 || verifying}
                    className="w-full bg-gradient-to-r from-[#B8860B] to-[#FFD700] hover:from-[#FFD700] hover:to-[#B8860B] text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? 'Verifying...' : 'Verify Email'}
                  </button>
                </form>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleResendEmail}
                    disabled={resending}
                    className={`w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 px-4 rounded-lg transition-all duration-300 ${
                      resending ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {resending ? 'Sending...' : '📧 Resend Code'}
                  </button>

                  <Link 
                    href="/login"
                    className="block w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 px-4 rounded-lg transition-all duration-300 text-center"
                  >
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Login Form after verification */}
                <form onSubmit={handleLogin} className="space-y-4">
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
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
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
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                      placeholder="Enter your password"
                      required
                      disabled={loggingIn}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="w-full bg-gradient-to-r from-[#B8860B] to-[#FFD700] hover:from-[#FFD700] hover:to-[#B8860B] text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loggingIn ? 'Signing In...' : '🎮 Sign In & Start Exploring'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-sm">
              Need help?{' '}
              <a href="mailto:support@migistus.com" className="text-[#FFD700] hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
