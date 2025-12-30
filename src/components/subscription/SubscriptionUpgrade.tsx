import React, { useState } from 'react';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';

interface SubscriptionUpgradeProps {
  currentTier: 'Initiate' | 'Guild' | 'MIGISTUS';
  userId: number;
  email: string;
  username: string;
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
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plans: Plan[] = [
    {
      id: 'initiate',
      name: 'Initiate',
      displayName: 'Free Tier',
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
        const errorData = await customerResponse.json();
        throw new Error(errorData.error || 'Failed to create customer');
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

  const currentPlanIndex = getCurrentPlanIndex();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Choose Your Membership Tier
        </h1>
        <p className="text-xl text-gray-400">
          Unlock exclusive benefits and features with a MIGISTUS membership
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
          {error}
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
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                {plan.price > 0 && (
                  <span className="text-gray-400 ml-2">/{plan.interval}</span>
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
                  if (isUpgrade && plan.id !== 'initiate') {
                    handleUpgrade(plan.id as 'guild' | 'elite');
                  }
                }}
                disabled={isCurrent || isDowngrade || loading || plan.id === 'initiate'}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                  isCurrent
                    ? 'bg-gray-700 text-gray-400 cursor-default'
                    : isDowngrade
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : plan.id === 'initiate'
                    ? 'bg-gray-700 text-gray-400 cursor-default'
                    : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 hover:scale-105`
                } ${loading ? 'opacity-50 cursor-wait' : ''}`}
              >
                {loading
                  ? 'Processing...'
                  : isCurrent
                  ? 'Current Plan'
                  : isDowngrade
                  ? 'Contact Support'
                  : plan.id === 'initiate'
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
    </div>
  );
};

export default SubscriptionUpgrade;
