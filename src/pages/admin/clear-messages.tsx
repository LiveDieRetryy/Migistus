import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import MainNavbar from '@/components/nav/MainNavbar';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function ClearMessagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.tier !== 'Admin')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // Don't render if not admin
  if (!isAuthenticated || user?.tier !== 'Admin') {
    return null;
  }

  const handleClearMessages = async () => {
    if (!confirm('Are you sure you want to delete ALL messages and conversations? This cannot be undone!')) {
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/messages/clear-all', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setResult('✅ Success! All messages and conversations have been deleted.');
        // Redirect to messages page after 2 seconds
        setTimeout(() => {
          router.push('/messages');
        }, 2000);
      } else {
        setResult(`❌ Error: ${data.error || 'Failed to clear messages'}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900">
      <MainNavbar />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-white">Clear All Messages</h1>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-200 text-sm">
              <strong>Warning:</strong> This will permanently delete all conversations and messages from the database. 
              This action cannot be undone and is intended for development/testing purposes only.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-300">
              Use this to clear all test messages and start fresh. Only admin users can perform this action.
            </p>

            <button
              onClick={handleClearMessages}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  <span>Clear All Messages</span>
                </>
              )}
            </button>

            {result && (
              <div className={`p-4 rounded-lg ${
                result.startsWith('✅') 
                  ? 'bg-green-500/10 border border-green-500/30 text-green-200' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-200'
              }`}>
                {result}
              </div>
            )}

            <button
              onClick={() => router.push('/messages')}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Back to Messages
            </button>
          </div>
        </div>

        <div className="mt-6 bg-zinc-900/30 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Alternative: Browser Console Method</h2>
          <p className="text-gray-400 mb-3">You can also clear messages using the browser console:</p>
          <div className="bg-black/50 border border-zinc-700 rounded p-3">
            <code className="text-green-400 text-sm">
              fetch('/api/messages/clear-all', {'{'} method: 'POST', credentials: 'include' {'}'}).then(r =&gt; r.json()).then(console.log)
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
