import Link from "next/link";

export default function AdminTopNav() {
  return (
    <nav className="w-full bg-[#0a0a0f] border-b border-zinc-800 px-10 py-4 text-[#FFD700] font-[Cinzel] text-sm tracking-wide">
      <div className="flex items-center justify-between w-full">
        {/* Left navigation links */}
        <div className="flex gap-[40px]">
          {[
            { label: "Dashboard", href: "/kingdom" },
            { label: "🔄 Lifecycle Control", href: "/kingdom/lifecycle" },
            { label: "Product Pool", href: "/kingdom/products" },
            { label: "Moderation", href: "/moderation" },
            { label: "User Management", href: "/kingdom/users" },
            { label: "Settings", href: "/kingdom/settings" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="no-underline text-[#FFD700] hover:text-white hover:drop-shadow-[0_0_6px_silver] transition duration-200"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right-side links */}
        <div className="flex gap-[32px]">
          <Link
            href="/account"
            className="no-underline text-[#FFD700] hover:text-white hover:drop-shadow-[0_0_6px_silver] transition duration-200"
          >
            Account
          </Link>
          <Link
            href="/support"
            className="no-underline text-[#FFD700] hover:text-white hover:drop-shadow-[0_0_6px_silver] transition duration-200"
          >
            Support
          </Link>
        </div>
      </div>
    </nav>
  );
}
