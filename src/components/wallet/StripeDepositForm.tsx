import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface DepositFormProps {
  amount: number;
  onSuccess: (amount: number) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

function CheckoutForm({ amount, onSuccess, onError, onCancel }: DepositFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/wallet?payment=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'Payment failed');
      onError(error.message || 'Payment failed');
      setProcessing(false);
    } else {
      setMessage('Payment successful! Your wallet will be credited shortly.');
      onSuccess(amount);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30 rounded-xl p-6">
        <div className="text-center mb-4">
          <p className="text-sm font-bold text-yellow-400 mb-2">Deposit Amount</p>
          <p className="text-4xl font-black text-white">${amount.toFixed(2)}</p>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-300 font-semibold">
            ℹ️ Supports credit/debit cards, PayPal, Apple Pay, Google Pay, and more
          </p>
        </div>
      </div>

      <div className="bg-zinc-800/80 rounded-xl p-6 border border-yellow-500/20">
        <PaymentElement />
      </div>

      {message && (
        <div className={`text-sm p-4 rounded-xl font-semibold ${
          message.includes('successful')
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:from-gray-600 disabled:to-gray-700 text-black disabled:text-gray-400 font-black rounded-xl transition-all duration-300 shadow-lg hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {processing ? '⏳ Processing...' : '💳 Complete Deposit'}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-6 py-4 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white disabled:text-gray-500 font-bold rounded-xl transition-all disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
        <p className="text-xs text-gray-400 text-center">
          🔒 Secured by Stripe • Your payment information is encrypted and never stored on our servers
        </p>
      </div>
    </form>
  );
}

export default function StripeDepositForm({ amount, onSuccess, onError, onCancel }: DepositFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Create PaymentIntent as soon as the component loads
    fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          onError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((err) => {
        setError('Failed to initialize payment');
        onError('Failed to initialize payment');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [amount, onError]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-8 border border-yellow-500/20 text-center">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-white font-bold">Initializing secure payment...</p>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-2xl p-8 border-2 border-red-500/40">
        <div className="text-6xl mb-4 text-center">❌</div>
        <p className="text-red-400 font-bold text-center mb-4">{error || 'Failed to initialize payment'}</p>
        <button
          onClick={onCancel}
          className="w-full px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#eab308',
        colorBackground: '#18181b',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '12px',
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-8 border border-yellow-500/20">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm 
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
          onCancel={onCancel}
        />
      </Elements>
    </div>
  );
}
