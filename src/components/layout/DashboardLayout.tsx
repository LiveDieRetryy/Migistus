import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {children}
    </div>
  );
}
