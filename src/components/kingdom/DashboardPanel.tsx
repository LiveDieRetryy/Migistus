import React from "react";

type Props = {
  icon: React.ReactNode;
  label: string;
  value: number;
  link?: string;
  linkLabel?: string;
};

export default function DashboardPanel({ icon, label, value, link, linkLabel }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl text-yellow-400">{icon}</span>
        <span className="text-xl font-semibold">{value}</span>
      </div>
      <div className="text-sm text-zinc-300">{label}</div>
      {link && (
        <a
          href={link}
          className="text-xs text-yellow-500 hover:underline mt-2 inline-block"
        >
          → {linkLabel}
        </a>
      )}
    </div>
  );
}
