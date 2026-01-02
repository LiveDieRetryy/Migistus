import { useEffect, useState } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import { UserStorage3 as UserStorage } from "@/utils/userStorage";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";
import StripeDepositForm from "@/components/wallet/StripeDepositForm";

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [guildCoins, setGuildCoins] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [coinAmount, setCoinAmount] = useState<number>(0);
  const [recipient, setRecipient] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<number>(0);
  const [sendStatus, setSendStatus] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Account navigation items
  const getProfileSlug = () => {
    if (!user?.username) return "/account/profile";
    return `/account/profile/${user.username.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
  };

  const accountNav = [
    { label: "Account Overview", href: "/account", icon: "🏠" },
    { label: "Notifications", href: "/notifications", icon: "🔔" },
    { label: "My Current Pledges", href: "/account/pledges", icon: "🤝" },
    { label: "My Orders", href: "/account/orders", icon: "📦" },
    { label: "My Wishlist", href: "/account/wishlist", icon: "❤️" },
    { label: "My Votes", href: "/account/votes", icon: "🗳️" },
    { label: "Wallet", href: "/wallet", icon: "💰" },
    { label: "View Profile", href: getProfileSlug(), icon: "👤" },
    { label: "Account Settings", href: "/account/settings", icon: "⚙️" },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && mounted) {
      setBalance(UserStorage.getUserWalletBalance(user.id));
      setGuildCoins(UserStorage.getUserGuildCoins(user.id));
      
      // Fetch transaction history
      fetchTransactions();
    }
  }, [user, mounted]);

  // Check for successful payment return
  useEffect(() => {
    if (router.query.payment === 'success') {
      // Refresh balance and transactions after successful payment
      if (user) {
        setTimeout(() => {
          setBalance(UserStorage.getUserWalletBalance(user.id));
          fetchTransactions();
        }, 1000);
      }
      // Remove query param
      router.replace('/wallet', undefined, { shallow: true });
    }
  }, [router.query.payment, user]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoadingTransactions(true);
    try {
      const response = await fetch(`/api/wallet/transactions?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleDepositClick = () => {
    setShowDepositModal(true);
  };

  const handleDepositSuccess = () => {
    setShowDepositModal(false);
    setDepositAmount(0);
    // Refresh balance and transactions
    if (user) {
      setTimeout(() => {
        setBalance(UserStorage.getUserWalletBalance(user.id));
        fetchTransactions();
      }, 1500);
    }
  };

  const handleDepositCancel = () => {
    setShowDepositModal(false);
    setDepositAmount(0);
  };

  const handleDeposit = () => {
    if (user && amount > 0) {
      UserStorage.incrementUserWallet(user.id, amount);
      setBalance(UserStorage.getUserWalletBalance(user.id));
      setAmount(0);
    }
  };

  const handleWithdraw = () => {
    if (user && amount > 0) {
      UserStorage.decrementUserWallet(user.id, amount);
      setBalance(UserStorage.getUserWalletBalance(user.id));
      setAmount(0);
    }
  };

  // Send Guild Coins to another user by username
  const handleSendCoins = () => {
    setSendStatus("");
    if (!user) return;
    if (!recipient || sendAmount <= 0) {
      setSendStatus("Enter a valid recipient and amount.");
      return;
    }
    if (sendAmount > guildCoins) {
      setSendStatus("Insufficient Guild Coins.");
      return;
    }
    // Find recipient by username (case-insensitive)
    let foundId: number | null = null;
    try {
      const registry = JSON.parse(localStorage.getItem("migistus_user_registry") || "{}");
      for (const key in registry) {
        if (
          registry[key]?.username &&
          registry[key].username.toLowerCase() === recipient.toLowerCase()
        ) {
          foundId = registry[key].id;
          break;
        }
      }
    } catch {}
    if (!foundId || foundId === user.id) {
      setSendStatus("Recipient not found or invalid.");
      return;
    }
    // Transfer coins
    UserStorage.decrementUserGuildCoins(user.id, sendAmount);
    UserStorage.incrementUserGuildCoins(foundId, sendAmount);
    setGuildCoins(UserStorage.getUserGuildCoins(user.id));
    setSendAmount(0);
    setRecipient("");
    setSendStatus("Guild Coins sent!");
    // Trigger profile update events
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { userId: user.id } }));
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { userId: foundId } }));
  };

  if (!mounted) {
    return (
      <>
        <Head>
          <title>Wallet - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-yellow-400 text-xl">Loading...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Head>
          <title>Wallet - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center px-4">
          <div className="bg-zinc-900/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-12 text-center shadow-2xl">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Access Required</h2>
            <p className="text-gray-400 mb-6">Please sign in to view your wallet</p>
            <Link href="/login" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-lg transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Wallet - MIGISTUS</title>
        <meta name="description" content="Manage your MIGISTUS wallet balance and Guild Coins" />
      </Head>
      <MainNavbar />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 py-12 gap-8">
          
          {/* Mobile Header with Hamburger */}
          <div className="lg:hidden w-full mb-4 flex items-center justify-between">
            <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
              ← Back to Account
            </Link>
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="bg-zinc-800 p-2 rounded-lg text-yellow-400 hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            lg:w-80
            ${isMobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-80' : 'hidden'}
            lg:block lg:relative lg:z-0
          `}>
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 sticky top-8 h-full lg:h-auto overflow-y-auto">
              <div className="hidden lg:block mb-6">
                <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
                  ← Back to Account
                </Link>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-400">
                    Account Menu
                  </h2>
                  <p className="text-sm text-gray-400">{user?.username}</p>
                </div>
              </div>
              
              <ul className="space-y-2">
                {accountNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        router.pathname === item.href
                          ? "bg-yellow-400 text-black font-semibold"
                          : "text-yellow-300 hover:bg-yellow-400/10 hover:text-yellow-400"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-yellow-400 mb-2">My Wallet</h1>
              <p className="text-gray-400">Manage your balance and Guild Coins</p>
            </div>

            {/* Balance Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* USD Balance Card */}
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-8 shadow-xl hover:shadow-green-500/10 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center text-2xl">
                    💵
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">USD Balance</h2>
                    <p className="text-gray-400 text-sm">Your available funds</p>
                  </div>
                </div>
                
                <div className="text-center mb-8">
                  <div className="text-5xl font-bold text-green-400 mb-2">
                    ${balance.toFixed(2)}
                  </div>
                  <div className="text-gray-400">Available Balance</div>
                </div>

                <div className="space-y-4">
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    step="0.01"
                    value={depositAmount}
                    onChange={e => setDepositAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-zinc-800 border border-green-500/30 rounded-xl text-white placeholder-gray-400 focus:border-green-400 focus:outline-none transition-colors"
                    placeholder="Enter amount ($1 - $10,000)"
                  />
                  <button
                    onClick={handleDepositClick}
                    disabled={!depositAmount || depositAmount < 1 || depositAmount > 10000}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                  >
                    💳 Deposit with Stripe
                  </button>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Secure payment processing via Stripe
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Accepts cards, PayPal, Apple Pay & Google Pay
                    </p>
                  </div>
                </div>
              </div>

              {/* Guild Coins Card */}
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-8 shadow-xl hover:shadow-yellow-500/10 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-2xl">
                    🪙
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Guild Coins</h2>
                    <p className="text-gray-400 text-sm">Earned through rewards</p>
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-yellow-400 mb-2">
                    {guildCoins}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Worth ${guildCoins.toFixed(2)} • 1 Coin = $1.00
                  </div>
                </div>

                {/* Send Coins Section */}
                <div className="space-y-4">
                  <div className="border-t border-zinc-700 pt-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                      <span>📤</span>
                      Send Guild Coins
                    </h3>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={recipient}
                        onChange={e => setRecipient(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-xl text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none transition-colors"
                        placeholder="Recipient username"
                        autoComplete="off"
                      />
                      <input
                        type="number"
                        min={1}
                        max={guildCoins}
                        value={sendAmount}
                        onChange={e => setSendAmount(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-xl text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none transition-colors"
                        placeholder="Amount to send"
                      />
                      <button
                        onClick={handleSendCoins}
                        disabled={!recipient || sendAmount <= 0 || sendAmount > guildCoins}
                        className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                      >
                        🚀 Send Coins
                      </button>
                      
                      {sendStatus && (
                        <div className={`text-center text-sm font-medium p-3 rounded-lg ${
                          sendStatus === "Guild Coins sent!" 
                            ? "bg-green-900/50 text-green-300 border border-green-500/30" 
                            : "bg-red-900/50 text-red-300 border border-red-500/30"
                        }`}>
                          {sendStatus}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                  📊
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Transaction History</h2>
                  <p className="text-gray-400 text-sm">Your recent wallet activity</p>
                </div>
              </div>
              
              {loadingTransactions ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 animate-spin">🔄</div>
                  <p className="text-gray-500">Loading your transaction history...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-50">📉</div>
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No Transactions Found</h3>
                  <p className="text-gray-500">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx, index) => (
                    <div key={index} className="bg-zinc-800 rounded-xl p-4 shadow-md">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>{new Date(tx.date).toLocaleString()}</span>
                        <span>{tx.type === "credit" ? "🟢" : "🔴"} {tx.amount} {tx.currency}</span>
                      </div>
                      <div className="text-white">
                        {tx.description || "No description provided."}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Stripe Deposit Modal */}
      {showDepositModal && depositAmount > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-yellow-500/20 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-yellow-400">💳 Deposit Funds</h2>
                <button
                  onClick={handleDepositCancel}
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <StripeDepositForm
                amount={depositAmount}
                onSuccess={handleDepositSuccess}
                onError={(error) => console.error('Deposit failed:', error)}
                onCancel={handleDepositCancel}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
