import Link from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";
import { LayoutGrid, PlusCircle, ShieldCheck, Hexagon } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: LayoutGrid },
  { label: "Register", href: "/datasets/new", icon: PlusCircle },
  { label: "Verify", href: "/verify", icon: ShieldCheck },
];

export default function BottomNav() {
  const { pathname } = useRouter();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-void-2/90 backdrop-blur-xl border-t border-border/80" />
      
      <div className="relative flex items-center justify-around px-6 pt-2 pb-6">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href === "/dashboard" && pathname === "/");
          return (
            <Link
              key={label}
              href={href}
              className={clsx(
                "flex flex-col items-center gap-1 min-w-[60px] py-1 transition-all duration-200",
                active ? "text-accent-2" : "text-muted-2 active:scale-95"
              )}
            >
              <div className={clsx(
                "p-2 rounded-xl transition-all duration-200",
                active ? "bg-accent/15" : "bg-transparent"
              )}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={clsx(
                "text-[10px] font-semibold tracking-wide",
                active ? "text-accent-2" : "text-muted"
              )}>{label}</span>
              {active && (
                <span className="absolute bottom-2 w-1 h-1 rounded-full bg-accent-2" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
