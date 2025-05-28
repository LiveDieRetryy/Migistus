// components/nav/MainNavbar.tsx
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Drops", href: "/drops" },
  { name: "Vote", href: "/voting" },
  { name: "Kingdom", href: "/kingdom" }
];

export default function MainNavbar() {
  const router = useRouter();
  
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
          </div>
        </div>
      </div>
    </nav>
  );
}