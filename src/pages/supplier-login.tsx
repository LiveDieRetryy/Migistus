import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function SupplierLoginPage() {  const [form, setForm] = useState({ 
    email: "", 
    supplierCode: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/supplier-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("isSupplier", "true");
          localStorage.setItem("isSignedIn", "true");
          localStorage.setItem("supplierId", String(data.supplier.id));
          localStorage.setItem("supplierName", data.supplier.name);
          localStorage.removeItem("isAdmin");
          localStorage.removeItem("userId");
        }
        router.push("/supplier-dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Supplier Login - MIGISTUS</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent mb-2">
              Supplier Portal
            </h1>
            <p className="text-gray-400">Access your supplier dashboard</p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-8 shadow-lg backdrop-blur-sm"
          >            <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">Sign In</h2>
            
            <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 p-3 rounded-lg mb-6 text-sm">
              <strong>No password required!</strong> Login with just your email and supplier code.
            </div>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="supplier@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Supplier Code
                </label>
                <input
                  name="supplierCode"
                  type="text"
                  value={form.supplierCode}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="SUP-XXXX"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter the unique supplier code provided by MIGISTUS
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <div className="text-gray-400 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/supplier-registration" className="text-yellow-400 hover:text-yellow-300 underline transition-colors">
                Apply to become a supplier
              </Link>
            </div>
            <div className="text-gray-400 text-sm">
              <Link href="/supplier-forgot-password" className="text-yellow-400 hover:text-yellow-300 underline transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="text-gray-400 text-sm">
              Back to{" "}
              <Link href="/suppliers" className="text-yellow-400 hover:text-yellow-300 underline transition-colors">
                supplier information
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
