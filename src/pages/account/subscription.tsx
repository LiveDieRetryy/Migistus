import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import MainNavbar from '@/components/nav/MainNavbar';
import SubscriptionUpgrade from '@/components/subscription/SubscriptionUpgrade';
import { AlertCircle, CheckCircle, XCircle, Crown } from 'lucide-react';
import { UserStorage3 as UserStorage } from '@/utils/userStorage';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateUser } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    // Check for success/canceled query parameters
    const handleSuccess = async () => {
      const sessionId = router.query.session_id as string;
      
      if (sessionId && router.query.success === 'true') {
        try {
          // Verify session and update tier
          const response = await fetch('/api/subscriptions/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Subscription verified:', data);
            
            // Update localStorage with the new tier
            const sessionData = localStorage.getItem('userSession');
            if (sessionData) {
              try {
                const session = JSON.parse(sessionData);
                session.user.tier = data.tier;
                if (data.subscriptionId) {
                  session.user.stripeSubscriptionId = data.subscriptionId;
                  session.user.stripeSubscriptionStatus = 'active';
                }
                localStorage.setItem('userSession', JSON.stringify(session));
                console.log('✅ Updated localStorage with new tier:', data.tier);
                
                // Also update the user context directly
                if (user) {
                  user.tier = data.tier;
                  if (data.subscriptionId) {
                    user.stripeSubscriptionId = data.subscriptionId;
                    user.stripeSubscriptionStatus = 'active';
                  }
                }
                
                // Update UserStorage profile with new tier
                if (data.userId) {
                  const existingProfile = UserStorage.getUserProfile(data.userId);
                  if (existingProfile) {
                    existingProfile.tier = data.tier;
                    UserStorage.setUserProfile(data.userId, existingProfile);
                    console.log('✅ Updated UserStorage profile with new tier:', data.tier);
                  }
                  
                  // Broadcast the tier update to all tabs/windows
                  try {
                    const broadcastChannel = new BroadcastChannel('migistus_updates');
                    broadcastChannel.postMessage({
                      type: 'tierUpdate',
                      userId: data.userId,
                      tier: data.tier
                    });
                    broadcastChannel.close();
                    
                    // Also dispatch custom event for same-window updates
                    window.dispatchEvent(new CustomEvent('tierUpdated', {
                      detail: { userId: data.userId, tier: data.tier }
                    }));
                  } catch (err) {
                    console.warn('BroadcastChannel not supported:', err);
                  }
                }
              } catch (e) {
                console.error('Error updating localStorage:', e);
              }
            }
            
            setShowSuccess(true);
            
            // Reload the page to refresh all components with new tier
            setTimeout(() => {
              window.location.href = '/account/subscription?success=true';
            }, 100);
          } else {
            console.error('Failed to verify subscription');
          }
        } catch (error) {
          console.error('Error verifying subscription:', error);
        }
      } else if (router.query.success === 'true') {
        setShowSuccess(true);
        // Clear query params after showing message
        setTimeout(() => {
          router.replace('/account/subscription', undefined, { shallow: true });
        }, 100);
      }
    };

    if (router.query.success === 'true') {
      handleSuccess();
    }
    
    if (router.query.canceled === 'true') {
      setShowCanceled(true);
      setTimeout(() => {
        router.replace('/account/subscription', undefined, { shallow: true });
      }, 100);
    }
  }, [router.query]);

  useEffect(() => {
    // Auto-dismiss messages after 5 seconds
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
    if (showCanceled) {
      const timer = setTimeout(() => setShowCanceled(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, showCanceled]);

  // Fetch fresh user data with Stripe fields on mount
  useEffect(() => {
    const refreshUserData = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const userData = await response.json();
          console.log('🔄 Refreshed user data:', userData);
          
          // Update localStorage with fresh Stripe fields
          const sessionData = localStorage.getItem('userSession');
          if (sessionData) {
            const session = JSON.parse(sessionData);
            session.user = {
              ...session.user,
              tier: userData.tier,
              stripeCustomerId: userData.stripeCustomerId,
              stripeSubscriptionId: userData.stripeSubscriptionId,
              stripeSubscriptionStatus: userData.stripeSubscriptionStatus,
              subscriptionCurrentPeriodEnd: userData.subscriptionCurrentPeriodEnd,
            };
            localStorage.setItem('userSession', JSON.stringify(session));
            
            // Trigger AuthContext update
            updateUser({
              tier: userData.tier,
              stripeCustomerId: userData.stripeCustomerId,
              stripeSubscriptionId: userData.stripeSubscriptionId,
              stripeSubscriptionStatus: userData.stripeSubscriptionStatus,
              subscriptionCurrentPeriodEnd: userData.subscriptionCurrentPeriodEnd,
            });
          }
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };
    
    refreshUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/account/subscription');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Debug logging
  console.log('📊 Subscription Page - User Data:', {
    tier: user.tier,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeCustomerId: user.stripeCustomerId
  });

  return (
    <>
      <Head>
        <title>Subscription - MIGISTUS</title>
        <meta name="description" content="Manage your MIGISTUS membership subscription" />
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in-right">
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-400 mb-1">
                    Subscription Successful!
                  </h3>
                  <p className="text-sm text-gray-300">
                    Your subscription is now active. Welcome to the {user.tier} tier!
                  </p>
                </div>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="text-gray-400 hover:text-white ml-auto"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Canceled Message */}
        {showCanceled && (
          <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in-right">
            <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-1">
                    Checkout Canceled
                  </h3>
                  <p className="text-sm text-gray-300">
                    No worries! You can upgrade anytime when you're ready.
                  </p>
                </div>
                <button
                  onClick={() => setShowCanceled(false)}
                  className="text-gray-400 hover:text-white ml-auto"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Tier Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Current Membership</p>
                  <h2 className="text-2xl font-bold text-white">{user.tier} Tier</h2>
                </div>
              </div>
              {user.tier !== 'Initiate' && (
                <div className="text-right">
                  <p className="text-blue-100 text-sm">
                    {user.stripeSubscriptionStatus === 'canceling' 
                      ? (user.tier === 'Initiate' ? 'Cancellation Date' : 'New Price Effective')
                      : 'Renewal Date'}
                  </p>
                  <p className="text-white font-semibold">
                    {user.subscriptionCurrentPeriodEnd
                      ? new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Component */}
        <SubscriptionUpgrade
          currentTier={user.tier as 'Initiate' | 'Guild' | 'MIGISTUS'}
          userId={user.id}
          email={user.email}
          username={user.username}
          stripeSubscriptionId={user.stripeSubscriptionId}
          stripeSubscriptionStatus={user.stripeSubscriptionStatus}
        />

        {/* Customer Portal Link */}
        {user.tier !== 'Initiate' && user.stripeCustomerId && (
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Manage Your Subscription
              </h3>
              <p className="text-gray-400 mb-4">
                Update payment method, view invoices, or cancel your subscription
              </p>
              <a
                href={`https://billing.stripe.com/p/login/test_${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_KEY || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Open Customer Portal
              </a>
              <p className="text-sm text-gray-500 mt-3">
                You'll be securely redirected to Stripe's billing portal
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
