import Link from "next/link";

export default function AdminTopNav() {
  return (
    <nav className="w-full bg-[#0a0a0f] border-b border-zinc-800 px-10 py-4 text-[#FFD700] font-[Cinzel] text-sm tracking-wide">
      <div className="flex items-center justify-between w-full">
        {/* Left navigation links */}
        <div className="flex gap-[40px]">
          {[
            { label: "Dashboard", href: "/kingdom/dashboard" },
            { label: "Product Pool", href: "/kingdom/product-pool" },
            { label: "Moderation", href: "/kingdom/moderation" },
            { label: "Tiers", href: "/kingdom/tiers" },
            { label: "Voting", href: "/kingdom/voting" },
            { label: "Refunds", href: "/kingdom/refunds" },
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
