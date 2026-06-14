import Link from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";
import {
  LayoutGrid,
  Database,
  ShieldCheck,
  PlusCircle,
  BookOpen,
  Settings,
  Hexagon,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Datasets", href: "/dashboard", icon: Database },
  { label: "Register Dataset", href: "/datasets/new", icon: PlusCircle },
  { label: "Verify Hash", href: "/verify", icon: ShieldCheck },
  { label: "Docs", href: "#", icon: BookOpen },
];

export default function Sidebar() {
  const { pathname } = useRouter();

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-void-2 border-r border-border px-3 py-5 shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-8 group">
        <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
          <Hexagon size={16} className="text-accent-2 fill-accent/20" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text leading-none" style={{ fontFamily: "Syne, sans-serif" }}>
            DataPassport
          </p>
          <p className="text-[10px] text-muted-2 leading-none mt-0.5">on Shardeum</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        <p className="text-[10px] font-medium text-muted uppercase tracking-widest px-2 mb-2">
          Navigation
        </p>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150",
                active
                  ? "bg-accent/15 text-accent-2 font-medium"
                  : "text-muted-2 hover:text-text hover:bg-surface"
              )}
            >
              <Icon size={15} className={active ? "text-accent-2" : "text-muted"} />
              {label}
              {active && (
                <span className="ml-auto w-1 h-1 rounded-full bg-accent-2" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto pt-4 border-t border-border space-y-0.5">
        <Link
          href="#"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-muted-2 hover:text-text hover:bg-surface transition-colors"
        >
          <Settings size={15} className="text-muted" />
          Settings
        </Link>
        <div className="px-2.5 py-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-[10px] text-muted-2">Shardeum Sphinx</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
