import Head from "next/head";
import { useState } from "react";
import { 
  Crown, Users, Star, Check, X, Zap, TrendingUp, 
  Shield, Gift, Sparkles, ArrowRight, Info
} from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";

interface TierFeature {
  name: string;
  initiate: boolean | string;
  guild: boolean | string;
  migistus: boolean | string;
}

const tierFeatures: TierFeature[] = [
  {
    name: "Daily Votes",
    initiate: "1 vote",
    guild: "3 votes",
    migistus: "10 votes"
  },
  {
    name: "Voting Power",
    initiate: "1x multiplier",
    guild: "2x multiplier",
    migistus: "5x multiplier"
  },
  {
    name: "Early Product Access",
    initiate: false,
    guild: true,
    migistus: true
  },
  {
    name: "Exclusive Live Drops",
    initiate: false,
    guild: true,
    migistus: true
  },
  {
    name: "Priority Support",
    initiate: false,
    guild: true,
    migistus: true
  },
  {
    name: "Supplier Chat Access",
    initiate: false,
    guild: true,
    migistus: true
  },
  {
    name: "Custom Badge & Flair",
    initiate: false,
    guild: "Guild Badge",
    migistus: "MIGISTUS Crown"
  },
  {
    name: "Monthly Bonus Rewards",
    initiate: false,
    guild: "Standard",
    migistus: "Premium"
  },
  {
    name: "Vote History Analytics",
    initiate: "Basic",
    guild: "Advanced",
    migistus: "Premium + AI Insights"
  },
  {
    name: "Profile Customization",
    initiate: "Limited",
    guild: "Enhanced",
    migistus: "Unlimited"
  }
];

export default function Subscription() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const currentTier = user?.tier || "Initiate";

  const handleUpgrade = (tier: string) => {
    if (!isAuthenticated) {
      // Open auth modal if not logged in
      if (typeof window !== 'undefined' && (window as any).openAuthModal) {
        (window as any).openAuthModal('register');
      }
      return;
    }

    // Redirect to subscription page for proper upgrade/downgrade handling
    router.push('/account/subscription');
  };

  const handleDowngrade = (tier: string) => {
    if (!isAuthenticated) {
      return;
    }
    
    // Redirect to subscription page for proper downgrade handling
    router.push('/account/subscription');
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="w-5 h-5 text-green-400 mx-auto" />;
    } else if (value === false) {
      return <X className="w-5 h-5 text-zinc-600 mx-auto" />;
    } else {
      return <span className="text-sm text-zinc-300">{value}</span>;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Initiate":
        return <Users className="w-8 h-8 text-zinc-400" />;
      case "Guild":
        return <Star className="w-8 h-8 text-yellow-400" />;
      case "MIGISTUS":
        return <Crown className="w-8 h-8 text-purple-400" />;
      default:
        return <Users className="w-8 h-8 text-zinc-400" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Initiate":
        return "from-zinc-700 to-zinc-800 border-zinc-600";
      case "Guild":
        return "from-yellow-900 to-yellow-800 border-yellow-500";
      case "MIGISTUS":
        return "from-purple-900 to-purple-800 border-purple-500";
      default:
        return "from-zinc-700 to-zinc-800 border-zinc-600";
    }
  };

  const getTierPrice = (tier: string) => {
    switch (tier) {
      case "Initiate":
        return { monthly: "Free", annual: "Free" };
      case "Guild":
        return { monthly: "$9.99", annual: "$99.99" };
      case "MIGISTUS":
        return { monthly: "$29.99", annual: "$299.99" };
      default:
        return { monthly: "Free", annual: "Free" };
    }
  };

  return (
    <>
      <Head>
        <title>Subscription - MIGISTUS</title>
        <meta name="description" content="Manage your subscription and unlock more voting power" />
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white pt-20">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-purple-500/20 px-6 py-2 rounded-full border border-yellow-500/30 mb-6">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">Unlock Your Full Potential</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-yellow-400 via-orange-400 to-purple-400 bg-clip-text text-transparent">
            Upgrade Your Guild Tier
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4">
            Choose the tier that matches your ambition. More votes, more power, more influence.
          </p>

          {isAuthenticated && user && (
            <div className="inline-flex items-center gap-2 bg-zinc-800/50 px-6 py-3 rounded-full border border-zinc-700">
              {getTierIcon(currentTier)}
              <span className="text-zinc-400">Current Tier:</span>
              <span className="font-bold text-white">{currentTier}</span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Initiate Tier */}
            <div className={`relative bg-gradient-to-b ${getTierColor("Initiate")} border-2 rounded-3xl p-8 ${currentTier === "Initiate" ? "ring-4 ring-green-500/50" : ""}`}>
              {currentTier === "Initiate" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                  Current Tier
                </div>
              )}
              
              <div className="text-center mb-8">
                {getTierIcon("Initiate")}
                <h3 className="text-2xl font-bold mt-4 mb-2">Initiate</h3>
                <p className="text-zinc-400 text-sm mb-4">Perfect for getting started</p>
                <div className="text-4xl font-black text-white mb-2">FREE</div>
                <div className="text-sm text-zinc-400">Forever</div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>1 vote per day</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>1x voting power</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Basic profile access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Community features</span>
                </div>
              </div>

              <button
                onClick={() => currentTier !== "Initiate" && handleDowngrade("Initiate")}
                disabled={currentTier === "Initiate"}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  currentTier === "Initiate"
                    ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                }`}
              >
                {currentTier === "Initiate" ? "Current Tier" : "Downgrade"}
              </button>
            </div>

            {/* Guild Tier */}
            <div className={`relative bg-gradient-to-b ${getTierColor("Guild")} border-2 rounded-3xl p-8 transform md:scale-105 shadow-2xl shadow-yellow-500/20 ${currentTier === "Guild" ? "ring-4 ring-green-500/50" : ""}`}>
              {currentTier === "Guild" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                  Current Tier
                </div>
              )}
              
              <div className="absolute -top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-1 rounded-full text-xs font-bold">
                POPULAR
              </div>

              <div className="text-center mb-8">
                {getTierIcon("Guild")}
                <h3 className="text-2xl font-bold mt-4 mb-2 text-yellow-400">Guild</h3>
                <p className="text-zinc-300 text-sm mb-4">For serious voters</p>
                <div className="text-4xl font-black text-yellow-400 mb-2">$9.99</div>
                <div className="text-sm text-zinc-400">per month</div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span className="font-semibold">3 votes per day</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span className="font-semibold">2x voting power</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span>Early product access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span>Exclusive live drops</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span>Priority support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span>Guild badge & flair</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (currentTier === "Guild") return;
                  if (currentTier === "MIGISTUS" || currentTier === "Admin") {
                    handleDowngrade("Guild");
                  } else {
                    handleUpgrade("Guild");
                  }
                }}
                disabled={currentTier === "Guild"}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  currentTier === "Guild" 
                    ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                    : currentTier === "MIGISTUS" || currentTier === "Admin"
                    ? "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black transform hover:scale-105"
                }`}
              >
                {currentTier === "Guild" ? "Current Tier" : currentTier === "MIGISTUS" || currentTier === "Admin" ? "Downgrade" : "Upgrade to Guild"}
              </button>
            </div>

            {/* MIGISTUS Tier */}
            <div className={`relative bg-gradient-to-b ${getTierColor("MIGISTUS")} border-2 rounded-3xl p-8 ${currentTier === "MIGISTUS" ? "ring-4 ring-green-500/50" : ""}`}>
              {currentTier === "MIGISTUS" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                  Current Tier
                </div>
              )}
              
              <div className="absolute -top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                ELITE
              </div>

              <div className="text-center mb-8">
                {getTierIcon("MIGISTUS")}
                <h3 className="text-2xl font-bold mt-4 mb-2 text-purple-400">MIGISTUS</h3>
                <p className="text-zinc-300 text-sm mb-4">Maximum influence</p>
                <div className="text-4xl font-black text-purple-400 mb-2">$29.99</div>
                <div className="text-sm text-zinc-400">per month</div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span className="font-semibold">10 votes per day</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span className="font-semibold">5x voting power</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span>All Guild benefits</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span>MIGISTUS crown badge</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span>Premium monthly rewards</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span>AI-powered analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span>Unlimited customization</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (currentTier === "MIGISTUS" || currentTier === "Admin") return;
                  handleUpgrade("MIGISTUS");
                }}
                disabled={currentTier === "MIGISTUS" || currentTier === "Admin"}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  currentTier === "MIGISTUS" || currentTier === "Admin"
                    ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transform hover:scale-105"
                }`}
              >
                {currentTier === "MIGISTUS" || currentTier === "Admin" ? "Current Tier" : "Upgrade to MIGISTUS"}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Complete Feature Comparison</h2>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800/50 border-b border-zinc-700">
                    <th className="text-left p-6 font-bold text-lg">Feature</th>
                    <th className="text-center p-6">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-6 h-6 text-zinc-400" />
                        <span className="font-bold">Initiate</span>
                      </div>
                    </th>
                    <th className="text-center p-6">
                      <div className="flex flex-col items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-400" />
                        <span className="font-bold text-yellow-400">Guild</span>
                      </div>
                    </th>
                    <th className="text-center p-6">
                      <div className="flex flex-col items-center gap-2">
                        <Crown className="w-6 h-6 text-purple-400" />
                        <span className="font-bold text-purple-400">MIGISTUS</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tierFeatures.map((feature, index) => (
                    <tr key={index} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                      <td className="p-6 font-medium">{feature.name}</td>
                      <td className="p-6 text-center">{renderFeatureValue(feature.initiate)}</td>
                      <td className="p-6 text-center">{renderFeatureValue(feature.guild)}</td>
                      <td className="p-6 text-center">{renderFeatureValue(feature.migistus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 pb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Can I change my tier at any time?</h3>
                  <p className="text-zinc-400">Yes! You can upgrade or downgrade your tier at any time. Upgrades take effect immediately, while downgrades take effect at the end of your billing cycle.</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">What happens to my votes when I upgrade?</h3>
                  <p className="text-zinc-400">When you upgrade, your vote count resets to your new tier's daily limit immediately. Your voting power multiplier also updates right away.</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Do votes carry over to the next day?</h3>
                  <p className="text-zinc-400">No, votes reset daily at midnight UTC. Use them or lose them! This keeps the voting system fair and dynamic.</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Is there a money-back guarantee?</h3>
                  <p className="text-zinc-400">We offer a 7-day satisfaction guarantee. If you're not happy with your tier upgrade, contact support within 7 days for a full refund.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
