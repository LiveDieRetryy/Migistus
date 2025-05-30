import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  votes?: number;
  image?: string;
  slug?: string;
  liveDrop?: boolean;
  staffPick?: boolean;
  comingSoon?: boolean;
};

type Vote = {
  productId: number;
};

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

export default function VotingStatsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffPickIds, setStaffPickIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"votes" | "name" | "category">("votes");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(res => res.json()),
      fetch("/api/votes").then(res => res.json())
    ]).then(([prodData, voteData]) => {
      let allProducts = Array.isArray(prodData.products) ? prodData.products : [];
      // Only show products NOT in liveDrop, staffPick, or comingSoon
      allProducts = allProducts.filter(
        (p: Product) =>
          !p.liveDrop && !p.staffPick && !p.comingSoon
      );
      setProducts(allProducts);
      setVotes(Array.isArray(voteData) ? voteData : []);
      setLoading(false);
    });
  }, []);

  // Map productId to vote count
  const voteCounts: Record<number, number> = {};
  votes.forEach(vote => {
    if (vote.productId in voteCounts) {
      voteCounts[vote.productId]++;
    } else {
      voteCounts[vote.productId] = 1;
    }
  });

  // Group products by category
  const productsByCategory: Record<string, Product[]> = {};
  products.forEach(product => {
    const cat = product.category || "Uncategorized";
    if (!productsByCategory[cat]) productsByCategory[cat] = [];
    productsByCategory[cat].push(product);
  });

  // Handle staff pick selection
  const toggleStaffPick = (productId: number) => {
    setStaffPickIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Save staff picks to backend
  const saveStaffPicks = async () => {
    setSaving(true);
    try {
      // Fetch all products to update staffPick field
      const res = await fetch("/api/products");
      const data = await res.json();
      let allProducts = Array.isArray(data.products) ? data.products : [];
      // Update staffPick field
      const updated = allProducts.map((p: Product) =>
        staffPickIds.includes(p.id)
          ? { ...p, staffPick: true }
          : { ...p, staffPick: false }
      );
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setSaving(false);
      // Optionally, refresh products
      setProducts(updated.filter(
        (p: Product) =>
          !p.liveDrop && !p.staffPick && !p.comingSoon
      ));
    } catch (err) {
      setSaving(false);
      alert("Failed to save staff picks.");
    }
  };

  // Collect all unique categories for the category dropdown
  const allCategories = Array.from(
    new Set(products.map((p) => p.category || "Uncategorized"))
  );

  // Category filter state for sort bar
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Sort and filter products in each category
  function sortProducts(prods: Product[]) {
    let filtered = prods;
    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    return [...filtered].sort((a, b) => {
      if (sortBy === "votes") {
        const va = voteCounts[a.id] || 0;
        const vb = voteCounts[b.id] || 0;
        return sortDir === "desc" ? vb - va : va - vb;
      }
      if (sortBy === "name") {
        return sortDir === "desc"
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      }
      if (sortBy === "category") {
        return sortDir === "desc"
          ? (b.category || "").localeCompare(a.category || "")
          : (a.category || "").localeCompare(b.category || "");
      }
      return 0;
    });
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Voting Stats by Category - King's Domain</title>
      </Head>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-2xl">📊</span>
          <h1 className="text-2xl font-bold text-yellow-400">Voting Stats by Category</h1>
        </div>
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link
            href="/kingdom/voting-config"
            className="text-yellow-400 hover:underline"
          >
            ← Back to Voting Config
          </Link>
          <button
            onClick={saveStaffPicks}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded transition disabled:opacity-60"
            disabled={saving || staffPickIds.length === 0}
          >
            {saving ? "Saving..." : "Set as Staff Picks"}
          </button>
        </div>
        {/* Sort Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8 relative">
          <label className="text-yellow-300 font-semibold">Sort by:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as "votes" | "name" | "category")}
            className="bg-zinc-900 border border-yellow-400/30 rounded px-3 py-2 text-yellow-300"
            onMouseOver={e => {
              if ((e.target as HTMLSelectElement).value === "category") {
                setShowCategoryDropdown(true);
              }
            }}
            onMouseOut={e => {
              setTimeout(() => setShowCategoryDropdown(false), 200);
            }}
          >
            <option value="votes">Votes</option>
            <option value="name">Name</option>
            <option value="category">Category</option>
          </select>
          <button
            onClick={() => setSortDir(d => (d === "desc" ? "asc" : "desc"))}
            className="bg-zinc-900 border border-yellow-400/30 rounded px-3 py-2 text-yellow-300 hover:bg-yellow-400/10"
            title={`Sort ${sortDir === "desc" ? "Descending" : "Ascending"}`}
          >
            {sortDir === "desc" ? "↓" : "↑"}
          </button>
          {/* Category dropdown on hover */}
          <div
            className="relative"
            onMouseEnter={() => setShowCategoryDropdown(true)}
            onMouseLeave={() => setShowCategoryDropdown(false)}
            style={{ display: sortBy === "category" ? "block" : "none" }}
          >
            <button
              className="ml-2 px-3 py-2 bg-zinc-900 border border-yellow-400/30 rounded text-yellow-300 hover:bg-yellow-400/10"
              style={{ minWidth: 120 }}
              tabIndex={-1}
            >
              {categoryFilter ? categoryFilter : "All Categories"}
            </button>
            {showCategoryDropdown && (
              <div className="absolute left-0 mt-2 z-20 bg-zinc-900 border border-yellow-400/30 rounded shadow-lg min-w-[180px]">
                <div
                  className={`px-4 py-2 hover:bg-yellow-400/10 cursor-pointer text-yellow-300 ${!categoryFilter ? "font-bold" : ""}`}
                  onClick={() => setCategoryFilter(null)}
                >
                  All Categories
                </div>
                {allCategories.map((cat) => (
                  <div
                    key={cat}
                    className={`px-4 py-2 hover:bg-yellow-400/10 cursor-pointer text-yellow-300 ${categoryFilter === cat ? "font-bold" : ""}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {loading ? (
          <div className="text-yellow-400 text-xl p-8">Loading voting stats...</div>
        ) : (
          <div className="space-y-10">
            {Object.entries(productsByCategory).map(([category, prods]) => {
              // If filtering by category, only show that category
              if (categoryFilter && category !== categoryFilter) return null;
              return (
                <div key={category} className="bg-zinc-900/80 rounded-xl border border-yellow-400/10 p-6 shadow">
                  <h2 className="text-xl font-bold text-yellow-300 mb-4">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortProducts(prods).map(product => (
                      <div key={product.id} className="flex items-center gap-4 bg-zinc-800/60 rounded-lg p-4 border border-yellow-400/10">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg border border-yellow-400/20"
                          />
                        )}
                        <div className="flex-1">
                          <Link
                            href={`/products/${product.slug || slugify(product.name)}`}
                            className="text-lg font-semibold text-yellow-400 hover:underline"
                          >
                            {product.name}
                          </Link>
                          <div className="text-gray-400 text-sm">
                            {voteCounts[product.id] || 0} votes
                          </div>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={staffPickIds.includes(product.id)}
                              onChange={() => toggleStaffPick(product.id)}
                              className="w-5 h-5 accent-yellow-400"
                            />
                            <span className="text-yellow-400 text-sm">Staff Pick</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
