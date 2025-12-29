import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function VerifySuccess() {
  const router = useRouter();
  const { username } = router.query;

  return (
    <>
      <Head>
        <title>Welcome to MIGISTUS! - Email Verified</title>
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
              <h1 className="text-2xl font-bold text-[#FFD700]">Email Verified!</h1>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
                <svg className="w-20 h-20 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-3xl font-bold text-green-500 mb-4">Welcome to MIGISTUS{username ? `, ${username}` : ''}!</h2>
                <p className="text-zinc-300 text-lg mb-2">🎉 Your email has been successfully verified!</p>
                <p className="text-zinc-400">You're now ready to explore The Guilded Marketplace.</p>
              </div>

              {/* What's Next */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 mb-6 text-left">
                <h3 className="text-[#FFD700] font-semibold text-lg mb-3">What's Next?</h3>
                <ul className="space-y-2 text-zinc-300 text-sm">
                  <li className="flex items-start">
                    <span className="text-[#FFD700] mr-2">✓</span>
                    <span>Browse exclusive drops from top creators</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FFD700] mr-2">✓</span>
                    <span>Join the community and connect with other members</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FFD700] mr-2">✓</span>
                    <span>Participate in limited-time offerings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FFD700] mr-2">✓</span>
                    <span>Track your orders and manage your account</span>
                  </li>
                </ul>
              </div>

              {/* Login Button */}
              <Link 
                href="/login"
                className="block w-full bg-gradient-to-r from-[#B8860B] to-[#FFD700] hover:from-[#FFD700] hover:to-[#B8860B] text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Continue to Login →
              </Link>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-sm">
              Need help getting started?{' '}
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
