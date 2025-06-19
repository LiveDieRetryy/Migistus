// components/nav/MainNavbar.tsx
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// Helper to create slug from username
function createSlug(username: string) {
  return username
    ? username.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    : "";
}

export default function MainNavbar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  // Track user info for unique account links
  const [user, setUser] = useState<{ id: number; username: string; email: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
      setIsSignedIn(
        localStorage.getItem("isSignedIn") === "true" ||
        localStorage.getItem("isAdmin") === "true"
      );
      // Get user from session
      const session = localStorage.getItem("userSession");
      if (session) {
        try {
          const parsed = JSON.parse(session);
          if (parsed.user) setUser(parsed.user);
        } catch {}
      }
    }
    // Listen for login/logout in other tabs/windows
    const sync = () => {
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
      setIsSignedIn(
        localStorage.getItem("isSignedIn") === "true" ||
        localStorage.getItem("isAdmin") === "true"
      );
      // Sync user info
      const session = localStorage.getItem("userSession");
      if (session) {
        try {
          const parsed = JSON.parse(session);
          if (parsed.user) setUser(parsed.user);
        } catch {}
      } else {
        setUser(null);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Categories", href: "/categories" },
    { name: "Drops", href: "/drops" },
    { name: "Users", href: "/users" }, // <-- Add this line
    { name: "Coming Soon", href: "/coming-soon" },
    { name: "Vote", href: "/voting" },
    ...(isAdmin ? [{ name: "Kingdom", href: "/kingdom" }] : [])
  ];

  // Generate unique accountNav links for the current user
  const profileSlug = user?.username ? createSlug(user.username) : "";
  const accountNav = [
    { label: "Account Overview", href: "/account" },
    { label: "My Current Pledges", href: "/account/pledges" },
    { label: "Pledge History", href: "/account/pledge-history" },
    { label: "My Wishlist", href: "/account/wishlist" },
    { label: "My Votes", href: "/account/votes" },
    { label: "Wallet", href: "/wallet" }, // <-- Add this line
    // Profile page is unique per user
    { label: "Edit Social Profile", href: profileSlug ? `/account/profile/${profileSlug}` : "/account/profile" },
    { label: "Account Settings", href: "/account/settings" },
  ];

  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className="w-full px-2 sm:px-12 py-4 sm:py-6 bg-zinc-950 border-b border-yellow-500 shadow-md">
      <div className="max-w-8xl mx-auto flex flex-col sm:flex-row items-center justify-between relative">
        {/* Center Logo */}
        <div className="order-1 sm:order-2 flex justify-center w-full sm:w-auto mb-2 sm:mb-0">
          <Link
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity duration-200"
          >
            <Image
              src="/images/migistus_logo.png"
              alt="MIGISTUS"
              width={180}
              height={60}
              className="object-contain mx-auto"
              priority
            />
          </Link>
        </div>

        {/* Nav Items */}
        <div className="order-2 sm:order-1 w-full sm:w-auto flex justify-center sm:justify-start mb-2 sm:mb-0">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-0 sm:flex-row items-center text-sm font-medium text-white">
            {navItems.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-3 py-2 sm:px-2 sm:py-0 rounded hover:text-yellow-400 transition-colors duration-200 whitespace-nowrap ${
                  isActive(item.href)
                    ? "text-yellow-400 border-b-2 border-yellow-400"
                    : "text-gray-300"
                }`}
              >
                <span className="relative group">
                  {item.name}
                  <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                </span>
              </Link>
            ))}
            {isAdmin && (
              <span className="ml-2 px-2 py-1 bg-yellow-400 text-black rounded">
                MIGISTUS
              </span>
            )}
          </div>
        </div>

        {/* Auth links */}
        <div className="order-3 w-full sm:w-auto flex justify-center sm:justify-end">
          <div className="flex items-center text-sm font-medium text-white gap-4">
            {/* Only show Sign In/Register if NOT signed in (any user or admin) */}
            {!isSignedIn && (
              <>
                <Link
                  href="/login"
                  className="ml-0 sm:ml-6 px-4 py-2 rounded bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="ml-2 px-4 py-2 rounded border border-yellow-500 text-yellow-400 font-bold hover:bg-yellow-500 hover:text-black transition"
                >
                  Register
                </Link>
              </>
            )}
            {/* Show Account Dropdown if signed in (any user or admin) */}
            {isSignedIn && (
              <div
                className="relative"
                onMouseEnter={() => setShowAccountDropdown(true)}
                onMouseLeave={() => setShowAccountDropdown(false)}
              >
                <button
                  className="text-yellow-400 hover:text-yellow-300 font-semibold transition flex items-center gap-1 px-4 py-2 rounded"
                  onClick={() => setShowAccountDropdown((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={showAccountDropdown}
                >
                  My Account
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showAccountDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-yellow-500/20 rounded-xl shadow-lg z-50"
                    onClick={() => setShowAccountDropdown(false)}
                  >
                    <ul className="py-2">
                      {accountNav.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`block px-4 py-2 text-white hover:bg-yellow-400/10 hover:text-yellow-400 transition-colors`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {/* Show Sign Out if signed in (any user or admin) */}
            {isSignedIn && (
              <button
                className="ml-4 px-4 py-2 rounded bg-zinc-800 border border-yellow-500 text-yellow-400 font-bold hover:bg-yellow-500 hover:text-black transition"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("isSignedIn");
                    localStorage.removeItem("isAdmin");
                  }
                  window.location.href = "/";
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}