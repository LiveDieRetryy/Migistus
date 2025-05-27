import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useSpring, animated } from "@react-spring/web";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  href?: string;
}

export default function StatCard({ icon, label, value, href }: StatCardProps) {
  const [mounted, setMounted] = useState(false);

  const { number } = useSpring({
    from: { number: 0 },
    to: { number: mounted ? value : 0 },
    config: { mass: 1, tension: 170, friction: 22 },
    delay: 200,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const Card = (
    <div
      className="bg-[#12121a]/60 text-zinc-300 w-[260px] h-[140px] rounded-xl border border-[#FFD700]/30
        shadow-md hover:shadow-yellow-400/20 transition-all duration-300 hover:scale-105 px-6 py-4 flex flex-col justify-between"
    >
      {/* Top: Label and Icon */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium group-hover:text-white group-hover:drop-shadow-[0_0_4px_silver] transition">
          {label}
        </span>
        <div className="text-[#FFD700] text-xl">{icon}</div>
      </div>

      {/* Bottom: Animated Value */}
      <div className="text-4xl font-bold text-zinc-200 text-right group-hover:text-white group-hover:drop-shadow-[0_0_6px_silver] transition">
        <animated.span>{number.to((n) => Math.floor(n))}</animated.span>
      </div>
    </div>
  );

  return href ? <Link href={href} className="no-underline">{Card}</Link> : Card;
}
