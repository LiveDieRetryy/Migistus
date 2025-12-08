import MainNavbar from "@/components/nav/MainNavbar";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface PledgeHistoryItem {
  id: number;
  productId: number;
  productName: string;
  amount: number;
  status: 'active' | 'completed' | 'cancelled' | 'refunded';
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

export default function PledgeHistoryPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<PledgeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadPledgeHistory();
    }
  }, [user, isAuthenticated]);

  const loadPledgeHistory = async () => {
    try {
      // For now, get all pledges (including past ones)
      const response = await fetch('/api/account/pledges', {
        credentials: 'include' // Send cookies with request
      });
      
      if (response.status === 401) {
        router.push('/');
        return;
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setHistory(result.data);
      }
    } catch (error) {
      console.error('Failed to load pledge history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-500/20 text-green-400',
      completed: 'bg-blue-500/20 text-blue-400',
      cancelled: 'bg-gray-500/20 text-gray-400',
      refunded: 'bg-red-500/20 text-red-400',
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: '🟢 Active',
      completed: '✅ Completed',
      cancelled: '⚫ Cancelled',
      refunded: '🔴 Refunded',
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <>
      <Head>
        <title>Pledge History - MIGISTUS</title>
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-4xl bg-zinc-900 border border-yellow-500/20 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-6">Pledge History</h1>
          
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading pledge history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No pledge history yet.</p>
              <Link
                href="/products"
                className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-zinc-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{history.length}</div>
                  <div className="text-sm text-gray-400">Total Pledges</div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {history.filter(p => p.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-400">Active</div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {history.filter(p => p.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-400">Completed</div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    ${history.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">Total Amount</div>
                </div>
              </div>

              {/* Pledge List */}
              <div className="space-y-3">
                {history.map((pledge) => (
                  <div
                    key={pledge.id}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-yellow-500/30 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {pledge.productName || `Product #${pledge.productId}`}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(pledge.status)}`}>
                            {getStatusLabel(pledge.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-400">
                            Amount: <span className="text-yellow-400 font-semibold">${pledge.amount?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="text-gray-400">
                            Pledged: {new Date(pledge.createdAt).toLocaleDateString()}
                          </div>
                          {pledge.completedAt && (
                            <div className="text-gray-400">
                              Completed: {new Date(pledge.completedAt).toLocaleDateString()}
                            </div>
                          )}
                          {pledge.cancelledAt && (
                            <div className="text-gray-400">
                              Cancelled: {new Date(pledge.cancelledAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center border-t border-zinc-700 pt-6">
            <Link href="/account" className="text-yellow-400 hover:text-yellow-300 underline">
              ← Back to Account Overview
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
