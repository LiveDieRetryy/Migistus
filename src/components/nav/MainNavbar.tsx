// components/nav/MainNavbar.tsx
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function MainNavbar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [forceDesktop, setForceDesktop] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
      setForceDesktop(localStorage.getItem("forceDesktopView") === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (forceDesktop) {
        document.body.classList.add("force-desktop");
        localStorage.setItem("forceDesktopView", "true");
      } else {
        document.body.classList.remove("force-desktop");
        localStorage.setItem("forceDesktopView", "false");
      }
    }
  }, [forceDesktop]);

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
          </div>
        </div>

        {/* Auth links */}
        <div className="order-3 w-full sm:w-auto flex justify-center sm:justify-end">
          <div className="flex items-center text-sm font-medium text-white">
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
          </div>
        </div>

        {/* Desktop/Mobile Switch Button (visible on mobile only) */}
        <div className="absolute right-2 top-2 sm:static sm:right-auto sm:top-auto z-50">
          <button
            className="sm:hidden bg-yellow-500 text-black font-bold px-3 py-1 rounded shadow hover:bg-yellow-400 transition text-xs"
            onClick={() => setForceDesktop((v) => !v)}
            aria-pressed={forceDesktop}
            title={forceDesktop ? "Switch to Mobile View" : "Switch to Desktop View"}
          >
            {forceDesktop ? "Mobile View" : "Desktop View"}
          </button>
        </div>
      </div>
    </nav>
  );
}