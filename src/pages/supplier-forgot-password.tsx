import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function SupplierForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [supplierCode, setSupplierCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // In a real app, this would send a password reset email
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSuccess(true);
    } catch (error) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Password Reset Sent - MIGISTUS</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-zinc-900/50 border border-green-500/20 rounded-xl p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">📧</span>
              </div>              <h1 className="text-2xl font-bold text-green-400 mb-4">Need Login Help?</h1>
              <p className="text-gray-300 mb-6">
                If you have your email and supplier code, you can login directly. No password is required - your supplier code serves as your authentication.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/supplier-login"
                  className="block w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-medium rounded-lg transition-all"
                >
                  Back to Login
                </Link>
                <Link 
                  href="/suppliers"
                  className="block w-full px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-all"
                >
                  Supplier Information
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>        <title>Login Help - MIGISTUS Supplier</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent mb-2">
              Login Help
            </h1>
            <p className="text-gray-400">No password required - just email and supplier code</p>
          </div>

          {/* Info Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-8 shadow-lg backdrop-blur-sm"
          >
            <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Login Information</h2>
            
            <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 p-4 rounded-lg mb-6">
              <p className="text-sm">
                <strong>No password needed!</strong> To login, you only need:
                <br />• Your registered email address
                <br />• Your unique supplier code (e.g., SUP-COMP1234)
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="supplier@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Supplier Code
                </label>
                <input
                  type="text"
                  value={supplierCode}
                  onChange={(e) => setSupplierCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="SUP-XXXX"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter your unique supplier code for verification
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? "Checking..." : "Verify My Information"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <div className="text-gray-400 text-sm">
              Ready to login?{" "}
              <Link href="/supplier-login" className="text-yellow-400 hover:text-yellow-300 underline transition-colors">
                Go to Login
              </Link>
            </div>
            <div className="text-gray-400 text-sm">
              Need help?{" "}
              <a href="mailto:suppliers@migistus.com" className="text-yellow-400 hover:text-yellow-300 underline transition-colors">
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
