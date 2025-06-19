import { useEffect, useState } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import { useRouter } from "next/router";

export default function PaymentPage() {
  const [pledge, setPledge] = useState<any>(null);
  const [shipping, setShipping] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const [guildTokens, setGuildTokens] = useState(0);
  const [tokensToUse, setTokensToUse] = useState<string>("");
  const [tokensApplied, setTokensApplied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cardInfo, setCardInfo] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
  });
  const [cardError, setCardError] = useState("");
  const [walletToUse, setWalletToUse] = useState<string>("");
  const [walletApplied, setWalletApplied] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pendingPledge");
      if (stored) {
        const pledgeObj = JSON.parse(stored);
        setPledge(pledgeObj);
        setQuantity(pledgeObj.quantity || 1);
      }
      const userId = localStorage.getItem("userId");
      if (userId) {
        fetch(`/api/users`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data.users)) {
              const found = data.users.find((u: any) => String(u.id) === String(userId));
              setUser(found || null);
              setGuildTokens(found?.guildTokens || 0);
            }
          });
      }
    }
  }, []);

  if (!pledge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-yellow-400">
        No pledge to pay for.
      </div>
    );
  }

  const total = (typeof pledge.price === "number" ? pledge.price : 0) * quantity;
  const maxTokens = Math.min(guildTokens, total);
  const tokensValue = tokensApplied ? (parseFloat(tokensToUse) || 0) : 0;
  const walletAvailable = user?.wallet !== undefined && user?.wallet !== null ? Number(user.wallet) : 0;
  const walletValue = walletApplied ? (parseFloat(walletToUse) || 0) : 0;
  const maxWallet = Math.min(walletAvailable, total - tokensValue);
  const totalDue = Math.max(0, total - tokensValue - walletValue);
  const remainingTokens = Math.max(0, guildTokens - tokensValue);
  const remainingWallet = Math.max(0, walletAvailable - walletValue);
  const isFullPriceWithTokens = tokensApplied && (parseFloat(tokensToUse) || 0) >= total;

  const handleTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val === "") {
      setTokensToUse("");
      setTokensApplied(false);
      return;
    }
    let num = parseFloat(val);
    if (isNaN(num) || num < 0) num = 0;
    if (num > maxTokens) num = maxTokens;
    num = Math.floor(num * 100) / 100;
    setTokensToUse(num.toString());
    setTokensApplied(false);
  };

  const handleAddTokens = () => {
    if (tokensToUse === "") {
      setTokensToUse(maxTokens > 0 ? maxTokens.toFixed(2) : "");
      setTokensApplied(true);
    } else {
      setTokensApplied(true);
    }
  };

  const handleFulfillFullWithTokens = () => {
    const max = Math.min(guildTokens, total);
    setTokensToUse(max > 0 ? max.toFixed(2) : "");
    setTokensApplied(true);
  };

  const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val === "") {
      setWalletToUse("");
      setWalletApplied(false);
      return;
    }
    let num = parseFloat(val);
    if (isNaN(num) || num < 0) num = 0;
    if (num > maxWallet) num = maxWallet;
    num = Math.floor(num * 100) / 100;
    setWalletToUse(num.toString());
    setWalletApplied(false);
  };

  const handleAddWallet = () => {
    if (walletToUse === "") {
      setWalletToUse(maxWallet > 0 ? maxWallet.toFixed(2) : "");
      setWalletApplied(true);
    } else {
      setWalletApplied(true);
    }
  };

  const handleUseFullWallet = () => {
    const useAll = Math.min(walletAvailable, total - tokensValue);
    setWalletToUse(useAll > 0 ? useAll.toFixed(2) : "");
    setWalletApplied(true);
  };

  const updateUserBalances = async (guildTokensUsed: number, walletUsed: number) => {
    const userId = user?.id;
    if (!userId) return;
    if (guildTokensUsed > 0) {
      await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftGuildTokens: -guildTokensUsed }),
      });
      setGuildTokens(prev => Math.max(0, prev - guildTokensUsed));
      setUser((u: any) => ({ ...u, guildTokens: Math.max(0, (u?.guildTokens || 0) - guildTokensUsed) }));
    }
    if (walletUsed > 0) {
      await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: (user.wallet || 0) - walletUsed }),
      });
      setUser((u: any) => ({ ...u, wallet: Math.max(0, (u?.wallet || 0) - walletUsed) }));
    }
  };

  const submitPledgeToBackend = async () => {
    if (!pledge || !user) return;
    const pledgeObj = {
      ...pledge,
      userId: user.id,
      quantity,
      price: (typeof pledge.price === "number" ? pledge.price : 0),
      time: new Date().toISOString(),
      tokensUsed: tokensApplied ? (parseFloat(tokensToUse) || 0) : 0,
      walletUsed: walletApplied ? (parseFloat(walletToUse) || 0) : 0,
    };
    await fetch("/api/pledges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pledgeObj),
    });
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardInfo({ ...cardInfo, [e.target.name]: e.target.value });
    setCardError("");
  };

  const validateCard = () => {
    if (
      !/^\d{13,19}$/.test(cardInfo.number.replace(/\s+/g, "")) ||
      !cardInfo.name.trim() ||
      !/^\d{2}\/\d{2,4}$/.test(cardInfo.expiry) ||
      !/^\d{3,4}$/.test(cardInfo.cvc)
    ) {
      setCardError("Please enter valid card details.");
      return false;
    }
    return true;
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (paymentMethod === "card" && !isFullPriceWithTokens && !validateCard()) {
        return;
      }

      // Update balances and submit pledge
      await updateUserBalances(tokensValue, walletValue);
      await submitPledgeToBackend();
      
      // Save pledge info for thank you page
      localStorage.setItem(
        "lastPledge",
        JSON.stringify({
          ...pledge,
          quantity,
          price: (typeof pledge.price === "number" ? pledge.price : 0),
          tokensUsed: tokensApplied ? (parseFloat(tokensToUse) || 0) : 0,
          walletUsed: walletApplied ? (parseFloat(walletToUse) || 0) : 0,
        })
      );
      
      // Clear pending pledge
      localStorage.removeItem("pendingPledge");
      
      // Redirect to thank you page
      window.location.href = "/thank-you";
      
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  return (
    <>
      <Head>
        <title>Payment - MIGISTUS</title>
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-2 sm:px-8">
        <div className="w-full max-w-lg bg-zinc-900 border border-yellow-500/20 rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Complete Your Payment</h1>
          <div className="mb-6">
            <div className="flex items-center gap-4">
              {pledge.image && (
                <img src={pledge.image} alt={pledge.productName} className="w-20 h-20 object-cover rounded" />
              )}
              <div>
                <div className="text-lg font-bold text-yellow-300">{pledge.productName}</div>
                <div className="text-gray-400 text-sm">
                  <span className="text-white">Quantity: </span>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={e => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setQuantity(val);
                    }}
                    className="inline-block w-16 px-2 py-1 rounded bg-zinc-800 border border-yellow-400/40 text-yellow-300 font-bold text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    style={{ fontSize: "1rem", marginLeft: 4, marginRight: 4 }}
                  />
                </div>
                <div className="text-yellow-400 font-bold text-xl">
                  Total: ${total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          <form onSubmit={handlePayment}>
            <h2 className="text-lg font-semibold text-yellow-300 mb-2">Guild Tokens</h2>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400 font-bold">{guildTokens.toFixed(2)}</span>
                <span className="text-gray-400">available</span>
                {tokensValue > 0 && (
                  <span className="text-green-400 ml-2">
                    After: {remainingTokens.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  max={maxTokens}
                  value={tokensToUse}
                  onChange={handleTokensChange}
                  className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-400/20 text-white mb-1"
                  placeholder="Tokens to use"
                  disabled={tokensApplied}
                />
                <button
                  type="button"
                  onClick={handleAddTokens}
                  className={`bg-yellow-400 text-black font-bold px-4 py-2 rounded hover:bg-yellow-300 transition ${tokensApplied ? "opacity-60 cursor-not-allowed" : ""}`}
                  disabled={tokensApplied || (!tokensToUse && tokensToUse !== "0")}
                >
                  Add Tokens
                </button>
                {tokensApplied && (
                  <button
                    type="button"
                    onClick={() => setTokensApplied(false)}
                    className="ml-2 text-yellow-400 underline text-xs"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="mt-2 flex">
                <button
                  type="button"
                  onClick={handleFulfillFullWithTokens}
                  className="text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-3 py-1 rounded transition"
                  disabled={tokensApplied || guildTokens < total}
                >
                  Fulfill Full Price with Tokens
                </button>
              </div>
              <div className="text-xs text-gray-400">
                1 token = $1. You can use up to {maxTokens.toFixed(2)} tokens for this pledge.
              </div>
            </div>

            {/* Only show payment methods if full price is NOT fulfilled with tokens */}
            {!isFullPriceWithTokens && (
              <>
                <h2 className="text-lg font-semibold text-yellow-300 mb-2">Payment Method</h2>
                <div className="mb-6">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="payment"
                      value="wallet"
                      checked={paymentMethod === "wallet"}
                      onChange={() => setPaymentMethod("wallet")}
                      className="w-5 h-5"
                    />
                    MIGISTUS Wallet
                    <span className="ml-2 text-yellow-400 text-xs font-bold bg-zinc-800 px-2 py-1 rounded">
                      {user?.wallet !== undefined && user?.wallet !== null
                        ? `$${Number(user.wallet).toFixed(2)} available`
                        : "Loading..."}
                    </span>
                  </label>
                  {paymentMethod === "wallet" && (
                    <div className="w-full mb-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          max={maxWallet}
                          value={walletToUse}
                          onChange={handleWalletChange}
                          className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-400/20 text-white mb-1"
                          placeholder="Wallet amount to use"
                          disabled={walletApplied}
                        />
                        <button
                          type="button"
                          onClick={handleAddWallet}
                          className={`bg-yellow-400 text-black font-bold px-4 py-2 rounded hover:bg-yellow-300 transition ${walletApplied ? "opacity-60 cursor-not-allowed" : ""}`}
                          disabled={walletApplied || (!walletToUse && walletToUse !== "0")}
                        >
                          Add Wallet
                        </button>
                        <button
                          type="button"
                          onClick={handleUseFullWallet}
                          className="bg-yellow-500 text-black font-bold px-3 py-2 rounded hover:bg-yellow-400 transition"
                          disabled={walletApplied || walletAvailable <= 0}
                        >
                          Use Full
                        </button>
                      </div>
                    </div>
                  )}
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="w-5 h-5"
                    />
                    Credit/Debit Card
                  </label>
                </div>

                {/* Only show credit card fields if NOT full price with tokens and paymentMethod is card */}
                {paymentMethod === "card" && (
                  <div className="mb-4 bg-zinc-800 border border-yellow-400/20 rounded-lg p-4">
                    <div className="mb-2">
                      <label className="block text-yellow-300 mb-1 font-medium">Card Number</label>
                      <input
                        type="text"
                        name="number"
                        value={cardInfo.number}
                        onChange={handleCardChange}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-3 py-2 rounded bg-zinc-900 border border-yellow-400/20 text-white"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-yellow-300 mb-1 font-medium">Name on Card</label>
                      <input
                        type="text"
                        name="name"
                        value={cardInfo.name}
                        onChange={handleCardChange}
                        placeholder="Full Name"
                        className="w-full px-3 py-2 rounded bg-zinc-900 border border-yellow-400/20 text-white"
                      />
                    </div>
                    <div className="flex gap-4 mb-2">
                      <div className="flex-1">
                        <label className="block text-yellow-300 mb-1 font-medium">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          name="expiry"
                          value={cardInfo.expiry}
                          onChange={handleCardChange}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 rounded bg-zinc-900 border border-yellow-400/20 text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-yellow-300 mb-1 font-medium">CVC</label>
                        <input
                          type="text"
                          name="cvc"
                          value={cardInfo.cvc}
                          onChange={handleCardChange}
                          placeholder="CVC"
                          className="w-full px-3 py-2 rounded bg-zinc-900 border border-yellow-400/20 text-white"
                        />
                      </div>
                    </div>
                    {cardError && (
                      <div className="text-red-400 text-sm mt-1">{cardError}</div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Always show shipping info, even when paying with full tokens */}
            <h2 className="text-lg font-semibold text-yellow-300 mb-2">Shipping Information</h2>
            <div className="mb-4">
              <input
                name="name"
                value={shipping.name}
                onChange={handleShippingChange}
                required
                placeholder="Full Name"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-400/20 text-white mb-2"
              />
              <input
                name="address"
                value={shipping.address}
                onChange={handleShippingChange}
                required
                placeholder="Address"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-400/20 text-white mb-2"
              />
              <input
                name="city"
                value={shipping.city}
                onChange={handleShippingChange}
                required
                placeholder="City"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-400/20 text-white mb-2"
              />
              <input
                name="state"
                value={shipping.state}
                onChange={handleShippingChange}
                required
                placeholder="State"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-400/20 text-white mb-2"
              />
              <input
                name="zip"
                value={shipping.zip}
                onChange={handleShippingChange}
                required
                placeholder="ZIP Code"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-400/20 text-white mb-2"
              />
              <input
                name="country"
                value={shipping.country}
                onChange={handleShippingChange}
                required
                placeholder="Country"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-400/20 text-white"
              />
            </div>

            <div className="mb-6">
              <div className="text-lg font-bold text-yellow-400">
                Total Due: ${totalDue.toFixed(2)}
              </div>
              {tokensValue > 0 && (
                <div className="text-xs text-green-400">
                  You are using {tokensValue.toFixed(2)} guild tokens (${tokensValue.toFixed(2)} off)
                </div>
              )}
              {walletValue > 0 && (
                <div className="text-xs text-green-400">
                  You are using ${walletValue.toFixed(2)} from your MIGISTUS Wallet
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded transition"
            >
              {isFullPriceWithTokens ? "Complete Pledge" : "Pay & Complete Pledge"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
