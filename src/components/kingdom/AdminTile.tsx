import Link from "next/link";
import { ReactNode } from "react";

interface AdminTileProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  href?: string; // optional route
}

export default function AdminTile({ title, value, icon, href }: AdminTileProps) {
  const content = (
    <div className="flex flex-col justify-between bg-zinc-800 rounded-xl p-4 border border-zinc-700 hover:bg-zinc-700 transition cursor-pointer">
      <div className="flex justify-between items-center">
        <div className="text-3xl">{icon}</div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-zinc-400">{title}</div>
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
