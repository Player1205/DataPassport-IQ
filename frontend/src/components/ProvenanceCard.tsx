import { format } from "date-fns";
import {
  Shield,
  Hash,
  Layers,
  ExternalLink,
  CheckCircle2,
  Clock,
  User,
  Tag,
  FileText,
  ArrowRight,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import RiskBadge from "@/components/RiskBadge";
import { shortAddress } from "@/lib/web3";
import clsx from "clsx";
import type { BackendDataset, BackendProvenanceStep } from "@/lib/apiClient";

interface ProvenanceCardProps {
  dataset: BackendDataset;
} //refined provenence card for better ui/ux and more details, also added a timeline of actions taken on the dataset

// Use LucideIcon (the correct type exported by lucide-react) instead of
// ComponentType<{ size?: number; className?: string }> which conflicts
// with lucide's own prop types.
function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0",
        className
      )}
    >
      <Icon size={14} className="text-muted mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-2 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p
          className={clsx("text-sm text-text break-all", {
            "font-mono text-xs": mono,
          })}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ProvenanceTimeline({ steps }: { steps: BackendProvenanceStep[] }) {
  const explorerBase = "https://explorer-sphinx.shardeum.org";
  return (
    <ol className="relative space-y-4">
      {steps.map((step, i) => (
        <li key={step._id ?? i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-[10px] font-bold text-accent-2 shrink-0">
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1.5 min-h-[16px]" />
            )}
          </div>
          <div className="pb-4 last:pb-0">
            <p className="text-xs font-medium text-text leading-snug">
              {step.action}
            </p>
            <p className="text-[10px] text-muted-2 mt-0.5">{step.actor}</p>
            {step.actorAddress && (
              <p className="text-[10px] text-muted font-mono">
                {shortAddress(step.actorAddress)}
              </p>
            )}
            <p className="text-[10px] text-muted mt-0.5">
              {format(new Date(step.timestamp), "MMM d, yyyy · HH:mm")}
            </p>
            {step.notes && (
              <p className="text-[10px] text-text-2 mt-0.5 italic">
                {step.notes}
              </p>
            )}
            {step.txHash && (
              <a
                href={`${explorerBase}/transaction/${step.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-accent-2 hover:underline mt-0.5"
              >
                {step.txHash.slice(0, 14)}…
                <ArrowRight size={9} />
              </a>
            )}
            {step.blockNumber && (
              <p className="text-[10px] text-muted mt-0.5">
                Block {step.blockNumber.toLocaleString()}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function ProvenanceCard({ dataset: ds }: ProvenanceCardProps) {
  const explorerBase = "https://explorer-sphinx.shardeum.org";
  const steps: BackendProvenanceStep[] = ds.provenanceCard?.steps ?? [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* ── Left: Core Info ───────────────────────────────────────── */}
      <div className="xl:col-span-2 space-y-5">
        {/* Header */}
        <div className="card-lg">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div className="min-w-0">
              <h2
                className="text-xl font-bold text-text truncate"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {ds.name}
              </h2>
              <p className="text-xs text-muted-2 font-mono mt-1 truncate">
                {ds.id}
              </p>
            </div>
            <RiskBadge
              level={ds.riskLevel}
              score={ds.riskScore}
              showScore
              size="lg"
            />
          </div>
          <p className="text-sm text-text-2 leading-relaxed">{ds.description}</p>

          {(ds.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {ds.tags!.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                             bg-accent/10 text-accent-2 border border-accent/20 text-[10px] font-medium"
                >
                  <Tag size={9} />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="card">
          <p className="text-xs font-semibold text-text-2 uppercase tracking-wider mb-1">
            Dataset Metadata
          </p>
          <InfoRow
            icon={User}
            label="Owner"
            value={`${ds.owner} · ${shortAddress(ds.ownerAddress)}`}
          />
          <InfoRow icon={FileText} label="License" value={ds.license} />
          <InfoRow
            icon={Layers}
            label="Records"
            value={ds.records != null ? ds.records.toLocaleString() : "—"}
          />
          <InfoRow icon={Tag} label="Version" value={ds.version} />
          {ds.size && (
            <InfoRow icon={Layers} label="Size" value={ds.size} />
          )}
          <InfoRow
            icon={Clock}
            label="Registered"
            value={format(new Date(ds.createdAt), "PPP")}
          />
          <InfoRow
            icon={Clock}
            label="Last Updated"
            value={format(new Date(ds.updatedAt || ds.createdAt), "PPP")}
          />
          {ds.notes && (
            <InfoRow icon={FileText} label="Notes" value={ds.notes} />
          )}
        </div>

        {/* Blockchain Record */}
        <div className="card">
          <p className="text-xs font-semibold text-text-2 uppercase tracking-wider mb-1">
            On-Chain Record
          </p>
          <InfoRow
            icon={Hash}
            label="Dataset Hash (SHA-256)"
            value={ds.hash}
            mono
          />
          {ds.txHash ? (
            <InfoRow
              icon={ExternalLink}
              label="Transaction Hash"
              value={
                <a
                  href={`${explorerBase}/transaction/${ds.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-2 hover:underline flex items-center gap-1"
                >
                  {ds.txHash.slice(0, 20)}…{ds.txHash.slice(-8)}
                  <ExternalLink size={10} />
                </a>
              }
              mono
            />
          ) : (
            <InfoRow
              icon={AlertTriangle}
              label="Transaction Hash"
              value={
                <span className="text-amber-400 text-xs">
                  Not anchored yet — use the Anchor button above
                </span>
              }
            />
          )}
          {ds.blockNumber != null && (
            <InfoRow
              icon={Layers}
              label="Block Number"
              value={ds.blockNumber.toLocaleString()}
              mono
            />
          )}
          {ds.chainId != null && (
            <InfoRow
              icon={Layers}
              label="Chain ID"
              value={ds.chainId.toString()}
              mono
            />
          )}
          {ds.ipfsCid && (
            <InfoRow
              icon={Hash}
              label="IPFS CID"
              value={
                <a
                  href={`https://ipfs.io/ipfs/${ds.ipfsCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-2 hover:underline flex items-center gap-1"
                >
                  {ds.ipfsCid.slice(0, 28)}…
                  <ExternalLink size={10} />
                </a>
              }
              mono
            />
          )}
        </div>
      </div>

      {/* ── Right: Timeline + Risk ─────────────────────────────────── */}
      <div className="space-y-5">
        {/* Verification status */}
        <div
          className={clsx("card flex items-center gap-3", {
            "bg-emerald-500/5 border-emerald-500/20": ds.anchored,
            "bg-amber-500/5 border-amber-500/20": !ds.anchored,
          })}
        >
          {ds.anchored ? (
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          ) : (
            <Clock size={20} className="text-amber-400 shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-text">
              {ds.anchored ? "Verified On-Chain" : "Pending Anchor"}
            </p>
            <p className="text-xs text-muted-2 mt-0.5">
              {ds.anchored
                ? ds.anchoredAt
                  ? `Anchored ${format(new Date(ds.anchoredAt), "PPP")}`
                  : "Hash confirmed on blockchain."
                : "Use Anchor button to register on Shardeum."}
            </p>
          </div>
        </div>

        {/* AI analysis summary */}
        {ds.aiAnalysis && (
          <div className="card bg-accent/5 border-accent/20">
            <p className="text-xs font-semibold text-accent-2 uppercase tracking-wider mb-2">
              AI Analysis
            </p>
            <p className="text-xs text-text-2 leading-relaxed">{ds.aiAnalysis}</p>
          </div>
        )}

        {/* Risk flags */}
        {(ds.riskFlags?.length ?? 0) > 0 && (
          <div className="card bg-rose-500/5 border-rose-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-rose-400" />
              <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                Risk Flags
              </p>
            </div>
            <ul className="space-y-2">
              {ds.riskFlags!.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-2">
                  <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Provenance timeline */}
        <div className="card">
          <p className="text-xs font-semibold text-text-2 uppercase tracking-wider mb-4">
            Provenance Timeline{" "}
            {steps.length > 0 && (
              <span className="text-muted normal-case font-normal">
                ({steps.length} steps)
              </span>
            )}
          </p>
          {steps.length > 0 ? (
            <ProvenanceTimeline steps={steps} />
          ) : (
            <p className="text-xs text-muted-2 text-center py-4">
              No provenance steps yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
