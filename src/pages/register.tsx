import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json();
      setError(data.error || "Registration failed");
    }
  };

  return (
    <>
      <Head>
        <title>Register - MIGISTUS</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-yellow-400/20 rounded-xl p-8 w-full max-w-md shadow-lg"
        >
          <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Register</h1>
          {error && <div className="text-red-400 mb-4">{error}</div>}
          {success && (
            <div className="text-green-400 mb-4">
              Registration successful! <Link href="/login" className="underline">Sign in</Link>
            </div>
          )}
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
          <div className="mb-4">
            <label className="block mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
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
            Register
          </button>
          <div className="mt-4 text-center text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="underline text-yellow-400">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
