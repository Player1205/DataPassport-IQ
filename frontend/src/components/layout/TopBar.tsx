import { Bell, Search } from "lucide-react";
import WalletButton from "@/components/WalletButton";

// The complete interface defining everything TopBar is allowed to receive
interface TopBarProps {
  title?: string;
  subtitle?: string;
  onSearch?: (val: string) => void;
  searchValue?: string;
}

export default function TopBar({ 
  title = "Dashboard", 
  subtitle, 
  onSearch, 
  searchValue = "" 
}: TopBarProps) {
  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-border bg-void-2/60 backdrop-blur-sm sticky top-0 z-30">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1
          className="text-base font-semibold text-text truncate leading-none"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-muted-2 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div className="relative hidden sm:block">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Search datasets…"
          className="pl-8 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg
                     text-text placeholder:text-muted focus:outline-none focus:border-accent/50
                     focus:ring-1 focus:ring-accent/20 transition-all w-48 lg:w-64"
        />
      </div>

      {/* Notifications */}
      <button className="relative w-8 h-8 flex items-center justify-center rounded-lg
                         text-muted-2 hover:text-text hover:bg-surface transition-colors">
        <Bell size={15} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
      </button>

      <WalletButton />
    </header>
  );
}