"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Brain,
  BookOpen,
  Upload,
  Target,
  Repeat2,
  Wallet,
  Code2,
  ChevronRight,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";

const NAV_CATEGORIES = [
  {
    name: "AI & Knowledge",
    items: [
      { href: "/chat", icon: MessageSquare, label: "Chat" },
      { href: "/memory", icon: Brain, label: "Memory" },
      { href: "/vault", icon: BookOpen, label: "Vault" },
      { href: "/study", icon: GraduationCap, label: "Study" },
    ],
  },
  {
    name: "Personal",
    items: [
      { href: "/goals", icon: Target, label: "Goals" },
      { href: "/habits", icon: Repeat2, label: "Habits" },
      { href: "/budget", icon: Wallet, label: "Budget" },
    ],
  },
  {
    name: "System",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Home" },
      { href: "/ingest", icon: Upload, label: "Ingest" },
      { href: "/dev", icon: Code2, label: "Dev" },
    ],
  },
];

export default function Sidebar() {
  const path = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "AI & Knowledge": true,
    Personal: true,
    System: true,
  });

  const toggleCategory = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full hidden md:flex">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-zinc-100">Heimdall</h1>
        <p className="text-xs text-zinc-500">Personal AI Server</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-4">
        {NAV_CATEGORIES.map((category) => (
          <div key={category.name} className="space-y-1">
            <button
              onClick={() => toggleCategory(category.name)}
              className="flex items-center justify-between w-full text-xs font-medium text-zinc-400 uppercase tracking-wider hover:text-zinc-300 transition-colors px-2 py-1"
            >
              {category.name}
              {expanded[category.name] ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            {expanded[category.name] && (
              <div className="ml-2 space-y-1">
                {category.items.map(({ href, icon: Icon, label }) => {
                  const active = path === href || (href !== "/" && path.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active ? "bg-violet-600/20 text-violet-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                      }`}
                    >
                      <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">v0.1.0</p>
      </div>
    </aside>
  );
}
