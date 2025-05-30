import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      if (typeof window !== "undefined") {
        localStorage.setItem("isAdmin", "true");
      }
      router.push("/kingdom");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
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
          <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Admin Sign In</h1>
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
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
            />
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
