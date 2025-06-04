import { useEffect, useState } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import { useRouter } from "next/router";

const accountNav = [
  { label: "Account Overview", href: "/account" },
  { label: "My Current Pledges", href: "/account/pledges" },
  { label: "Pledge History", href: "/account/pledge-history" },
  { label: "My Wishlist", href: "/account/wishlist" },
  { label: "My Votes", href: "/account/votes" },
  { label: "Edit Social Profile", href: "/account/profile" },
  { label: "Account Settings", href: "/account/settings" },
  // Add more as needed
];

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Example: load user info from localStorage or fetch from backend
    if (typeof window !== "undefined") {
      const userId = localStorage.getItem("userId");
      if (userId) {
        fetch(`/api/users`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data.users)) {
              const found = data.users.find((u: any) => String(u.id) === String(userId));
              setUser(found || null);
            }
          });
      }
    }
  }, []);

  return (
    <>
      <Head>
        <title>My Account - MIGISTUS</title>
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-black text-white flex flex-col md:flex-row items-start py-12 px-2 sm:px-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 mb-8 md:mb-0 md:mr-8">
          <nav className="bg-zinc-900 border border-yellow-500/20 rounded-2xl shadow-lg p-6 sticky top-8">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Account Menu</h2>
            <ul className="space-y-2">
              {accountNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-2 rounded-lg transition-colors ${
                      router.pathname === item.href
                        ? "bg-yellow-400 text-black font-semibold"
                        : "text-yellow-300 hover:bg-yellow-400/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 w-full max-w-2xl bg-zinc-900 border border-yellow-500/20 rounded-2xl shadow-lg p-8 mx-auto">
          <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">My Account</h1>
          {!user ? (
            <div className="text-gray-400 text-center">Loading your account...</div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="text-sm text-gray-400">Username</div>
                <div className="text-lg font-semibold">{user.username}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Email</div>
                <div className="text-lg font-semibold">{user.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Tier</div>
                <div className="text-lg font-semibold">{user.tier || "Initiate"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Status</div>
                <div className="text-lg font-semibold">
                  {user.banned ? (
                    <span className="text-red-400">Banned</span>
                  ) : (
                    <span className="text-green-400">Active</span>
                  )}
                </div>
              </div>
              {/* Add more user info or actions as needed */}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
