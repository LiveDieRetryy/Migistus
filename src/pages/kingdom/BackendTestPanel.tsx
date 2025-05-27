"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TestResults {
  [key: string]: any;
}

export default function BackendTestPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<TestResults>({});

  const testEndpoint = async (endpoint: string, method: string = 'POST') => {
    setLoading(endpoint);
    try {
      const res = await fetch(endpoint, { method });
      const data = await res.json();
      setResults(prev => ({ ...prev, [endpoint]: data }));
    } catch (error) {
      console.error(`Error testing ${endpoint}`, error);
    } finally {
      setLoading(null);
    }
  };

  const runFullTest = async () => {
    setLoading('all');

    // Create 10 users
    for (let i = 0; i < 10; i++) {
      await testEndpoint('/api/users', 'POST');
    }

    // Add 5 products
    for (let i = 0; i < 5; i++) {
      await testEndpoint('/api/products', 'POST');
    }

    // Create 3 refunds
    for (let i = 0; i < 3; i++) {
      await testEndpoint('/api/refunds', 'POST');
    }

    // Cast 7 votes
    for (let i = 0; i < 7; i++) {
      await testEndpoint('/api/vote', 'POST');
    }

    // Get current stats
    await testEndpoint('/api/users', 'GET');
    await testEndpoint('/api/products', 'GET');
    await testEndpoint('/api/refunds', 'GET');
    await testEndpoint('/api/voting-config', 'GET');

    setLoading(null);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-xl max-w-sm">
      <h3 className="text-sm font-bold text-[#FFD700] mb-3">🧪 Backend Test Panel</h3>

      <div className="space-y-2">
        <Button
          size="sm"
          onClick={() => testEndpoint('/api/users', 'POST')}
          disabled={loading === '/api/users'}
          className="w-full justify-start"
        >
          👤 Create User
        </Button>

        <Button
          size="sm"
          onClick={() => testEndpoint('/api/products', 'POST')}
          disabled={loading === '/api/products'}
          className="w-full justify-start"
        >
          📦 Add Product
        </Button>

        <Button
          size="sm"
          onClick={() => testEndpoint('/api/refunds', 'POST')}
          disabled={loading === '/api/refunds'}
          className="w-full justify-start"
        >
          💰 Create Refund
        </Button>

        <Button
          size="sm"
          onClick={() => testEndpoint('/api/vote', 'POST')}
          disabled={loading === '/api/vote'}
          className="w-full justify-start"
        >
          🗳️ Cast Vote
        </Button>

        <hr className="border-zinc-700" />

        <Button
          size="sm"
          onClick={runFullTest}
          disabled={loading === 'all'}
          className="w-full bg-[#FFD700] text-black hover:bg-[#FFD700]/80"
        >
          🚀 Run Full Test (10 users, 5 products, 3 refunds, 7 votes)
        </Button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="mt-4 text-xs">
          <h4 className="font-semibold text-white mb-2">Latest Results</h4>
          <pre className="bg-black/50 p-2 rounded text-green-400 overflow-auto max-h-32">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      {loading && (
        <div className="mt-2 text-xs text-yellow-400">
          {loading === 'all' ? 'Running full test...' : `Testing ${loading}...`}
        </div>
      )}
    </div>
  );
}
