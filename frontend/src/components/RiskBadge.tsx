import clsx from "clsx";

/**
 * Updated Interface
 * Changed 'level' to string to handle various backend responses safely.
 */
interface RiskBadgeProps {
  level?: string | any;
  score?: number;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

const RISK_CONFIG: Record<
  string,
  { label: string; classes: string; dot: string }
> = {
  low: {
    label: "Low Risk",
    classes: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  medium: {
    label: "Medium Risk",
    classes: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dot: "bg-amber-400",
  },
  high: {
    label: "High Risk",
    classes: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    dot: "bg-orange-400",
  },
  critical: {
    label: "Critical",
    classes: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    dot: "bg-rose-400 animate-pulse",
  },
  // ── FALLBACK STATE ──
  // Handles cases where the audit hasn't run yet
  pending: {
    label: "Pending Audit",
    classes: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
    dot: "bg-gray-500",
  },
};

const SIZE_CLASSES = {
  sm: "text-[10px] px-1.5 py-0.5 gap-1",
  md: "text-xs px-2 py-0.5 gap-1.5",
  lg: "text-sm px-2.5 py-1 gap-2",
};

export default function RiskBadge({
  level,
  score,
  showScore = false,
  size = "md",
}: RiskBadgeProps) {
  // 1. THE FIX: Normalize the incoming level string and handle null/undefined
  const normalizedLevel = (level || "pending").toString().toLowerCase();
  
  // 2. Safely find the configuration, or default to 'pending' if the key doesn't exist
  const cfg = RISK_CONFIG[normalizedLevel] || RISK_CONFIG.pending;

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-medium",
        cfg.classes, // No longer undefined
        SIZE_CLASSES[size]
      )}
    >
      <span className={clsx("rounded-full flex-shrink-0", cfg.dot, {
        "w-1.5 h-1.5": size === "sm" || size === "md",
        "w-2 h-2": size === "lg",
      })} />
      {cfg.label}
      {showScore && score !== undefined && (
        <span className="opacity-60 ml-0.5">({score})</span>
      )}
    </span>
  );
}