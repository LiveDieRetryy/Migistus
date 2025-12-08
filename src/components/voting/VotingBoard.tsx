import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserStorage3 as UserStorage } from "@/utils/userStorage";
import type { Product } from "@/types/product";

export default function VotingBoard() {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchVotes();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVotes = async () => {
    try {
      const res = await fetch("/api/votes");
      const data = await res.json();
      setVotes(Array.isArray(data) ? data : []);
    } catch (error) {
      setVotes([]);
    }
  };

  // Returns true if the current user has voted for this product
  const hasVoted = (productId: number) => {
    if (!user) return false;
    return votes.some(
      (vote) => vote.productId === productId && vote.userId === user.id
    );
  };

  // Returns the total vote count for a product
  const getVoteCount = (productId: number) => {
    return votes.filter((vote) => vote.productId === productId).length;
  };

  // Submit a vote for a product
  const handleVote = async (productId: number) => {
    if (!isAuthenticated || !user) return;
    
    // Get user tier from UserStorage
    const userProfile = UserStorage.getUserProfile(user.id);
    const userTier = userProfile?.tier || "Initiate";
    
    try {
      await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          userId: user.id,
          tier: userTier,
          value: 1,
        }),
      });
      await fetchVotes();
    } catch (error) {
      // Optionally show error
    }
  };

  if (loading) {
    return <div>Loading voting board...</div>;
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
        >
          <div>
            <h3 className="text-lg font-medium text-white">{product.name}</h3>
            <p className="text-sm text-gray-400">
              {getVoteCount(product.id)} votes
            </p>
          </div>
          <button
            onClick={() => handleVote(product.id)}
            disabled={!isAuthenticated || hasVoted(product.id)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              hasVoted(product.id)
                ? "bg-green-600 text-white cursor-not-allowed"
                : "bg-yellow-400 text-black hover:bg-yellow-300"
            }`}
          >
            {hasVoted(product.id) ? "Voted" : "Vote"}
          </button>
        </div>
      ))}
    </div>
  );
}
