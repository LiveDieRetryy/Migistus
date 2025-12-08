import MainNavbar from "@/components/nav/MainNavbar";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface Vote {
  id: number;
  userId: number;
  productId: number;
  productName: string;
  voteType: 'upvote' | 'downvote';
  votedAt: string;
}

export default function MyVotesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadVotes();
    }
  }, [user, isAuthenticated]);

  const loadVotes = async () => {
    try {
      const response = await fetch('/api/account/votes', {
        credentials: 'include' // Send cookies with request
      });
      
      if (response.status === 401) {
        router.push('/');
        return;
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setVotes(result.data);
      }
    } catch (error) {
      console.error('Failed to load votes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>My Votes - MIGISTUS</title>
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-4xl bg-zinc-900 border border-yellow-500/20 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-6">My Votes</h1>
          
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading votes...</div>
          ) : votes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">You haven't voted on any products yet.</p>
              <Link
                href="/voting"
                className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Explore Products to Vote
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {votes.map((vote) => (
                <div
                  key={vote.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex justify-between items-center hover:border-yellow-500/30 transition-colors"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white">{vote.productName}</h3>
                    <p className="text-sm text-gray-400">
                      Voted on {new Date(vote.votedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-semibold ${
                    vote.voteType === 'upvote' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {vote.voteType === 'upvote' ? '👍 Upvote' : '👎 Downvote'}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center border-t border-zinc-700 pt-6">
            <p className="text-gray-400 mb-4">Total Votes: {votes.length}</p>
            <Link href="/account" className="text-yellow-400 hover:text-yellow-300 underline">
              ← Back to Account Overview
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
