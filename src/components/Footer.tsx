import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full text-center py-8 bg-black border-t border-zinc-800 text-zinc-500 text-sm mt-16">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
        <div>
          © {new Date().getFullYear()}{" "}
          <span className="text-yellow-400 font-bold">MIGISTUS</span> — The
          Guilded Marketplace
        </div>
        <div className="flex gap-6">
          <Link
            href="/about"
            className="hover:text-yellow-400 transition"
          >
            About
          </Link>
          <Link
            href="/terms"
            className="hover:text-yellow-400 transition"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="hover:text-yellow-400 transition"
          >
            Privacy
          </Link>
          <Link
            href="/contact"
            className="hover:text-yellow-400 transition"
          >
            Contact
          </Link>
          <Link
            href="/suppliers"
            className="hover:text-yellow-400 transition"
          >
            Suppliers
          </Link>
        </div>
      </div>
    </footer>
  );
}
