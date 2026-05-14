"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, LayoutDashboard, Upload, Target, Repeat2, Wallet, Code2, Brain, BookOpen, GraduationCap } from "lucide-react";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/memory", icon: Brain, label: "Memory" },
  { href: "/vault", icon: BookOpen, label: "Vault" },
  { href: "/study", icon: GraduationCap, label: "Study" },
  { href: "/ingest", icon: Upload, label: "Ingest" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/habits", icon: Repeat2, label: "Habits" },
  { href: "/budget", icon: Wallet, label: "Budget" },
  { href: "/dev", icon: Code2, label: "Dev" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 flex safe-area-pb md:hidden">
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = path === href || (href !== "/" && path.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition-colors ${
              active ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
