import React, { useState } from 'react';
import { Check, Crown, Sparkles, Zap, AlertCircle } from 'lucide-react';

interface SubscriptionUpgradeProps {
  currentTier: 'Initiate' | 'Guild' | 'MIGISTUS';
  userId: number;
  email: string;
  username: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: 'initiate' | 'guild' | 'elite';
  name: string;
  displayName: string;
  price: number;
  interval: string;
  icon: React.ReactNode;
  color: string;
  features: PlanFeature[];
  popular?: boolean;
}

const SubscriptionUpgrade: React.FC<SubscriptionUpgradeProps> = ({
  currentTier,
  userId,
  email,
  username,
  stripeSubscriptionId,
  stripeSubscriptionStatus,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [targetTier, setTargetTier] = useState<'initiate' | 'guild' | 'elite' | null>(null);

  const plans: Plan[] = [
    {
      id: 'initiate',
      name: 'Initiate',
      displayName: 'Initiate',
      price: 0,
      interval: 'forever',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-gray-400 to-gray-600',
      features: [
        { text: 'Basic marketplace access', included: true },
        { text: '1 vote per product', included: true },
        { text: 'Community forum access', included: true },
        { text: 'Standard product pricing', included: true },
        { text: 'Limited messaging', included: true },
        { text: 'Priority support', included: false },
        { text: 'Exclusive perks', included: false },
      ],
    },
    {
      id: 'guild',
      name: 'Guild',
      displayName: 'Guild Member',
      price: 9.99,
      interval: 'month',
      icon: <Crown className="w-6 h-6" />,
      color: 'from-blue-500 to-purple-600',
      popular: true,
      features: [
        { text: 'All Initiate features', included: true },
        { text: '3 votes per product', included: true },
        { text: 'Priority customer support', included: true },
        { text: 'Unlimited messaging', included: true },
        { text: 'Early product access', included: true },
        { text: 'Guild-only marketplace', included: true },
        { text: 'Monthly bonus rewards', included: true },
      ],
    },
    {
      id: 'elite',
      name: 'MIGISTUS',
      displayName: 'MIGISTUS Elite',
      price: 19.99,
      interval: 'month',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-600',
      features: [
        { text: 'All Guild Member features', included: true },
        { text: '10 votes per product', included: true },
        { text: 'Premium support (24/7)', included: true },
        { text: 'VIP marketplace access', included: true },
        { text: 'First access to new products', included: true },
        { text: 'Influencer program access', included: true },
        { text: 'Monthly premium rewards', included: true },
      ],
    },
  ];

  const getCurrentPlanIndex = () => {
    const tierMap: Record<typeof currentTier, string> = {
      Initiate: 'initiate',
      Guild: 'guild',
      MIGISTUS: 'elite',
    };
    return plans.findIndex(p => p.id === tierMap[currentTier]);
  };

  const handleUpgrade = async (planId: 'guild' | 'elite') => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create or get Stripe customer
      const customerResponse = await fetch('/api/subscriptions/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, username }),
      });

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        let errorMessage = 'Failed to create customer';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch {
          errorMessage += `: ${errorText || 'Unknown error'}`;
        }
        throw new Error(errorMessage);
      }

      const { customerId } = await customerResponse.json();

      // Step 2: Create checkout session
      const sessionResponse = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tier: planId,
          customerId,
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await sessionResponse.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start upgrade process');
      setLoading(false);
    }
  };

  const handleDowngrade = async (planId: 'initiate' | 'guild' | 'elite') => {
    if (!stripeSubscriptionId) {
      setError('No active subscription found');
      return;
    }

    // Store which tier they're downgrading to and show confirmation modal
    setTargetTier(planId);
    setShowConfirmModal(true);
  };

  const confirmDowngrade = async () => {
    setShowConfirmModal(false);
    setCancelLoading(true);
    setError(null);

    const targetTierName = targetTier === 'initiate' ? 'Initiate' : targetTier === 'guild' ? 'Guild' : 'MIGISTUS';

    try {
      const response = await fetch('/api/subscriptions/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscriptionId: stripeSubscriptionId,
          targetTier: targetTierName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      const data = await response.json();
      
      // Update localStorage immediately
      const sessionData = localStorage.getItem('userSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.user.tier = targetTierName;
        session.user.stripeSubscriptionStatus = 'canceling';
        localStorage.setItem('userSession', JSON.stringify(session));
      }
      
      setSuccessMessage(`Subscription will be canceled at the end of your billing period${data.periodEnd ? `: ${data.periodEnd}` : ''}. You'll retain access until then.`);
      // Reload after 3 seconds to show the message
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error('Cancel error:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setCancelLoading(false);
    }
  };

  const currentPlanIndex = getCurrentPlanIndex();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          {currentTier === 'MIGISTUS' && stripeSubscriptionStatus === 'active' 
            ? 'You are part of the Elite MIGISTUS Users' 
            : currentTier === 'Guild' && stripeSubscriptionStatus === 'active'
            ? 'You are a Guild Member'
            : 'Choose Your Membership Tier'}
        </h1>
        <p className="text-xl text-gray-400">
          {currentTier === 'MIGISTUS' && stripeSubscriptionStatus === 'active'
            ? 'You can downgrade or unsubscribe at any time, but you will lose your elite perks'
            : currentTier === 'Guild' && stripeSubscriptionStatus === 'active'
            ? 'You can upgrade or unsubscribe at any time, but you will lose your Guild perks if you cancel'
            : 'Unlock exclusive benefits and features with a MIGISTUS membership'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-400">
          {successMessage}
        </div>
      )}

      {/* Canceling Status Banner */}
      {stripeSubscriptionStatus === 'canceling' && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-semibold mb-1">
                {currentTier !== 'Initiate' ? 'Downgrading Subscription' : 'Subscription Canceling'}
              </h3>
              <p className="text-gray-300 text-sm">
                You still have access to your premium features until the end of your billing period. 
                {currentTier !== 'Initiate' ? ' Your new tier will take effect at the start of your next billing cycle.' : ' You can reactivate your subscription at any time before it expires.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, index) => {
          const isCurrent = index === currentPlanIndex;
          const isDowngrade = index < currentPlanIndex;
          const isUpgrade = index > currentPlanIndex;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-2 border-blue-500'
                  : 'bg-gray-800/50 border border-gray-700'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Badge */}
              {isCurrent && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${plan.color} mb-4`}>
                {plan.icon}
              </div>

              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.displayName}</h3>

              {/* Price */}
              <div className="mb-6">
                {plan.price === 0 ? (
                  <span className="text-4xl font-bold text-green-400">free</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400 ml-2">/{plan.interval}</span>
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        feature.included ? 'text-green-400' : 'text-gray-600'
                      }`}
                    />
                    <span
                      className={feature.included ? 'text-gray-300' : 'text-gray-600'}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <button
                onClick={() => {
                  if ((isUpgrade || (isCurrent && stripeSubscriptionStatus === 'canceling')) && plan.id !== 'initiate') {
                    handleUpgrade(plan.id as 'guild' | 'elite');
                  } else if (isDowngrade && stripeSubscriptionId) {
                    handleDowngrade(plan.id);
                  }
                }}
                disabled={
                  (isCurrent && stripeSubscriptionStatus !== 'canceling') || 
                  (isDowngrade && !stripeSubscriptionId) || 
                  loading || 
                  cancelLoading
                }
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                  isCurrent && stripeSubscriptionStatus === 'canceling'
                    ? `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 hover:scale-105`
                    : isCurrent
                    ? 'bg-gray-700 text-gray-400 cursor-default'
                    : isDowngrade && stripeSubscriptionId
                    ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
                    : isDowngrade && !stripeSubscriptionId
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : plan.id === 'initiate' && !stripeSubscriptionId
                    ? 'bg-gray-700 text-gray-400 cursor-default'
                    : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 hover:scale-105`
                } ${loading || cancelLoading ? 'opacity-50 cursor-wait' : ''}`}
              >
                {loading || cancelLoading
                  ? 'Processing...'
                  : isCurrent && stripeSubscriptionStatus === 'canceling'
                  ? 'Current Subscription'
                  : isCurrent
                  ? 'Current Plan'
                  : isDowngrade && stripeSubscriptionId
                  ? 'Downgrade'
                  : isDowngrade && !stripeSubscriptionId
                  ? 'Contact Support'
                  : plan.id === 'initiate' && !stripeSubscriptionId
                  ? 'Free Forever'
                  : 'Upgrade Now'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center text-gray-400 text-sm">
        <p>All plans include a 30-day money-back guarantee.</p>
        <p className="mt-2">
          Cancel anytime. No questions asked. Payments processed securely via Stripe.
        </p>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">
              Are you sure you want to downgrade your subscription?
            </h3>
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">
              Your subscription will remain active until the end of your current billing period.
              {targetTier === 'initiate' ? (
                <span className="block mt-2 text-gray-300">After that, you will lose access to premium features and your subscription will be canceled.</span>
              ) : (
                <span className="block mt-2 text-gray-300">
                  Your next billing cycle will be <span className="font-semibold text-white">${plans.find(p => p.id === targetTier)?.price}/month</span> instead of <span className="font-semibold text-white">${plans.find(p => p.id === currentTier.toLowerCase() as 'guild' | 'elite')?.price}/month</span>.
                </span>
              )}
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDowngrade}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionUpgrade;
