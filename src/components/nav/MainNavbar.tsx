// components/nav/MainNavbar.tsx
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function MainNavbar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
      setIsSignedIn(
        localStorage.getItem("isSignedIn") === "true" ||
        localStorage.getItem("isAdmin") === "true"
      );
    }
    // Listen for login/logout in other tabs/windows
    const sync = () => {
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
      setIsSignedIn(
        localStorage.getItem("isSignedIn") === "true" ||
        localStorage.getItem("isAdmin") === "true"
      );
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Categories", href: "/categories" },
    { name: "Drops", href: "/drops" },
    { name: "Coming Soon", href: "/coming-soon" },
    { name: "Vote", href: "/voting" },
    ...(isAdmin ? [{ name: "Kingdom", href: "/kingdom" }] : [])
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
            {/* Show Sign Out if signed in (any user or admin) */}
            {isSignedIn && (
              <>
                <Link
                  href="/account"
                  className="text-yellow-400 hover:text-yellow-300 font-semibold transition"
                >
                  My Account
                </Link>
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
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}