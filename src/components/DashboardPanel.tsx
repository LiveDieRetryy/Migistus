import Link from "next/link";
import { ReactNode } from "react";

interface DashboardPanelProps {
  icon: ReactNode;
  label: string;
  value: number;
  link?: string;
  linkLabel?: string;
}

export default function DashboardPanel({
  icon,
  label,
  value,
  link,
  linkLabel,
}: DashboardPanelProps) {
  return (
    <div className="bg-zinc-800 rounded-lg p-4 shadow-md border border-yellow-600">
      <div className="flex items-center justify-between mb-2 text-yellow-400">
        <span className="text-xl">{icon}</span>
        <span className="text-lg font-semibold">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {link && linkLabel && (
        <Link href={link} className="block mt-3 text-sm text-yellow-400 underline hover:text-yellow-300">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
