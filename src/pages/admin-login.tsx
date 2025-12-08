import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { activityTracker } from "@/utils/activityTracker";
import { Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Track admin login attempt
    activityTracker.trackAdminAction("admin_login_attempt", {
      username: form.username,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      ip: "client-side", // Server would track actual IP
    });

    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      if (typeof window !== "undefined") {
        localStorage.setItem("isAdmin", "true");
      }

      // Track successful admin login
      activityTracker.trackAdminAction("admin_login_success", {
        username: form.username,
        redirectTo: "/kingdom",
      });

      router.push("/kingdom");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");

      // Track failed admin login
      activityTracker.trackAdminAction("admin_login_failed", {
        username: form.username,
        error: data.error || "Login failed",
      });
    }
  };

  return (
    <>
      <Head>
        <title>Admin Sign In - MIGISTUS</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-yellow-400/20 rounded-xl p-8 w-full max-w-md shadow-lg"
        >
          <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">
            Admin Sign In
          </h1>
          {error && <div className="text-red-400 mb-4">{error}</div>}
          <div className="mb-4">
            <label className="block mb-1">Username</label>
            <input
              name="username"
              type="text"
              value={form.username}
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
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </>
  );
}
