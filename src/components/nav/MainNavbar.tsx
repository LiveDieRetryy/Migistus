// components/nav/MainNavbar.tsx
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function MainNavbar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
    }
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Categories", href: "/categories" },
    { name: "Drops", href: "/drops" },
    { name: "Coming Soon", href: "/coming-soon" }, // <-- Add this line
    { name: "Vote", href: "/voting" },
    ...(isAdmin ? [{ name: "Kingdom", href: "/kingdom" }] : [])
  ];

  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className="w-full px-12 py-6 bg-zinc-950 border-b border-yellow-500 shadow-md">
      <div className="max-w-8xl mx-auto flex items-center justify-between relative">
        {/* Left Spacer */}
        <div className="flex-1"></div>

        {/* Center Logo - Much Bigger */}
        <div className="flex-shrink-0">
          <Link
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity duration-200"
          >
            <Image
              src="/images/migistus_logo.png"
              alt="MIGISTUS"
              width={250}
              height={80}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Right Menu Items */}
        <div className="flex-1 flex justify-end">
          <div className="flex items-center text-sm font-medium text-white">
            {navItems.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative hover:text-yellow-400 transition-colors duration-200 whitespace-nowrap ${
                  isActive(item.href)
                    ? "text-yellow-400 border-b-2 border-yellow-400"
                    : "text-gray-300"
                }`}
                style={{
                  marginRight: index < navItems.length - 1 ? '32px' : '0',
                  paddingLeft: '8px',
                  paddingRight: '8px',
                }}
              >
                <span className="relative group">
                  {item.name}
                  <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                </span>
              </Link>
            ))}
            {/* Auth links */}
            <Link
              href="/login"
              className="ml-6 px-4 py-2 rounded bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
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
      </div>
    </nav>
  );
}