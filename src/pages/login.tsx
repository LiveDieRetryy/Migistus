import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authAPI } from "@/lib/authAPI";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setUser, setIsAuthenticated } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Try admin login first
      try {
        const adminResponse = await authAPI.adminLogin(form.email, form.password);
        
        // Store admin session
        if (typeof window !== "undefined") {
          localStorage.setItem("isAdmin", "true");
          localStorage.setItem("isSignedIn", "true");
          localStorage.setItem("userId", String(adminResponse.user.id));
          localStorage.setItem("userSession", JSON.stringify({
            user: adminResponse.user,
            sessionId: adminResponse.session?.sessionId || '',
          }));
        }
        
        setUser({ ...adminResponse.user, sessionId: adminResponse.session?.sessionId || '' });
        setIsAuthenticated(true);
        router.push("/kingdom");
        return;
      } catch (adminError) {
        // Not an admin, try regular user login
      }

      // Regular user login
      const response = await authAPI.login({
        email: form.email,
        password: form.password
      });

      // Store user session
      if (typeof window !== "undefined") {
        localStorage.setItem("isSignedIn", "true");
        localStorage.removeItem("isAdmin");
        localStorage.setItem("userId", String(response.user.id));
        localStorage.setItem("userSession", JSON.stringify({
          user: response.user,
          sessionId: response.session?.sessionId || '',
        }));
      }

      setUser({ ...response.user, sessionId: response.session?.sessionId || '' });
      setIsAuthenticated(true);
      
      // Update activity tracker
      await authAPI.updateActivity('/');
      
      router.push("/");
    } catch (err: any) {
      // Check if error is due to unverified email
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        const { email, username } = err.response.data;
        router.push(`/verify-email-reminder?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username || '')}`);
        return;
      }
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - MIGISTUS</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-yellow-400/20 rounded-xl p-8 w-full max-w-md shadow-lg"
        >
          <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Sign In</h1>
          {error && <div className="text-red-400 mb-4">{error}</div>}
          <div className="mb-4">
            <label className="block mb-1">Email or Username</label>
            <input
              name="email"
              type="text"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 pr-10 rounded bg-zinc-800 border border-zinc-700 text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 disabled:cursor-not-allowed text-black font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <div className="mt-4 text-center text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline text-yellow-400">
              Register
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
