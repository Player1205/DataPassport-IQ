import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  Clock,
  ChevronRight,
  Copy,
  Check,
  Database
} from "lucide-react";
import RiskBadge from "@/components/RiskBadge";
import { shortAddress } from "@/lib/web3";

// Updated Interface to match your MongoDB structure
interface Dataset {
  id: string;
  name: string;
  owner: string;
  ownerAddress: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  riskScore?: number;
  records: number;
  createdAt: string;
  anchored?: boolean; 
  status?: string;
  hash?: string;
}

interface DatasetTableProps {
  datasets: Dataset[];
  loading?: boolean;
}

function Skeleton() {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-surface-2 rounded animate-pulse w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="bg-surface/30 border border-border rounded-xl p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-surface-2 rounded w-3/4" />
      <div className="h-3 bg-surface-2 rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-5 bg-surface-2 rounded-full w-20" />
        <div className="h-5 bg-surface-2 rounded-full w-16" />
      </div>
    </div>
  );
}

export default function DatasetTable({ datasets, loading }: DatasetTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Empty State ──
  if (!loading && datasets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-2">
        <Database size={32} className="mb-3 opacity-20" />
        <p className="text-sm font-medium">No datasets found in the registry.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile Card View ──────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <MobileCardSkeleton key={i} />)
          : datasets.map((ds) => (
              <Link
                key={ds.id}
                href={`/datasets/${ds.id}`}
                className="block bg-surface/30 border border-border rounded-xl p-4 hover:bg-surface/50 hover:border-accent/20 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text truncate group-hover:text-accent-2 transition-colors">
                      {ds.name}
                    </p>
                    <p className="text-[11px] text-muted-2 mt-0.5">
                      {ds.owner} · {shortAddress(ds.ownerAddress)}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted mt-0.5 shrink-0 group-hover:text-accent-2 transition-colors" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <RiskBadge
                    level={ds.riskLevel || 'low'}
                    score={ds.riskScore || 0}
                    showScore
                    size="sm"
                  />
                  {(ds.anchored === true || ds.status === "anchored") ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 size={10} />
                      Anchored
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                      <Clock size={10} />
                      Pending
                    </span>
                  )}
                  <span className="text-[10px] text-muted ml-auto">
                    {ds.createdAt ? format(new Date(ds.createdAt), "MMM d") : ''}
                  </span>
                </div>
              </Link>
            ))}
      </div>

      {/* ── Desktop Table View ────────────────────────────── */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-border bg-surface/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-void-3/60">
              {["Dataset", "Owner", "Risk", "Records", "Registered", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-widest"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)
              : datasets.map((ds) => (
                  <tr
                    key={ds.id}
                    className="hover:bg-accent/5 transition-colors group"
                  >
                    {/* Name & ID */}
                    <td className="px-4 py-4">
                      <Link
                        href={`/datasets/${ds.id}`}
                        className="flex items-start gap-2"
                      >
                        <div>
                          <p className="font-semibold text-text group-hover:text-accent-2 transition-colors flex items-center gap-1">
                            {ds.name}
                            <ChevronRight
                              size={13}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-2"
                            />
                          </p>
                          <p className="text-[10px] text-muted-2 font-mono mt-0.5">
                            {ds.id.slice(0, 24)}…
                          </p>
                        </div>
                      </Link>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-4">
                      <p className="text-text-2 text-xs font-medium">{ds.owner}</p>
                      <p className="text-[10px] text-muted font-mono mt-0.5">
                        {shortAddress(ds.ownerAddress)}
                      </p>
                    </td>

                    {/* Risk */}
                    <td className="px-4 py-4">
                      <RiskBadge 
                        level={ds.riskLevel || 'low'} 
                        score={ds.riskScore || 0} 
                        showScore 
                      />
                    </td>

                    {/* Records */}
                    <td className="px-4 py-4 text-text-2 text-xs tabular-nums">
                      {(ds.records || 0).toLocaleString()}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-muted-2 text-xs whitespace-nowrap">
                      {ds.createdAt ? format(new Date(ds.createdAt), "MMM d, yyyy") : 'N/A'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {(ds.anchored === true || ds.status === "anchored") ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={12} />
                          Anchored
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                          <Clock size={12} />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Quick Copy Action */}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => copyToClipboard(ds.hash || ds.id, ds.id)}
                        className="p-2 hover:bg-surface rounded-lg text-muted-2 hover:text-accent-2 transition-all"
                        title="Copy Hash for Verification"
                      >
                        {copiedId === ds.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>
  );
}