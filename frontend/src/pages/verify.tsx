import Head from "next/head";
import { useState } from "react";
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  ExternalLink, 
  Database,
  Fingerprint,
  History
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useVerify } from "@/hooks/useDataset";
import RiskBadge from "@/components/RiskBadge";

export default function VerifyPage() {
  const [inputHash, setInputHash] = useState("");
  const { result, loading, error, searched, verify, reset } = useVerify();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputHash.trim()) {
      verify(inputHash.trim());
    }
  };

  return (
    <>
      <Head>
        <title>Verify Hash | DataPassport</title>
      </Head>

      <div className="flex min-h-screen bg-void">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar title="Verify Integrity" subtitle="Check dataset authenticity on-chain" />

          <main className="flex-1 px-6 py-6 max-w-4xl w-full mx-auto">
            {/* ── Search Section ────────────────────────────────── */}
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-text mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
                Authenticity Lookup
              </h2>
              <p className="text-sm text-text-2 max-w-lg mx-auto mb-8">
                Paste a dataset's SHA-256 hash to verify its provenance and ensure it hasn't been tampered with since registration.
              </p>

              <form onSubmit={handleVerify} className="relative max-w-2xl mx-auto">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Fingerprint size={20} className="text-muted" />
                </div>
                <input
                  type="text"
                  placeholder="Enter SHA-256 Hash (e.g. 0x1dbd...)"
                  className="w-full bg-surface/40 border border-border rounded-2xl py-4 pl-12 pr-32 text-sm focus:border-accent/50 outline-none transition-all text-text font-mono"
                  value={inputHash}
                  onChange={(e) => setInputHash(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loading || !inputHash.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-accent text-void px-6 rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Verify
                </button>
              </form>
            </div>

            {/* ── Loading State ────────────────────────────────── */}
            {loading && (
              <div className="py-20 text-center animate-pulse">
                <Loader2 size={40} className="text-accent mx-auto mb-4 animate-spin" />
                <p className="text-sm text-muted">Consulting Shardeum Explorer...</p>
              </div>
            )}

            {/* ── Result: Verified / Found ─────────────────────── */}
            {searched && !loading && (result as any)?.verified && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-400">Authenticity Confirmed</h3>
                    <p className="text-xs text-emerald-400/70">This dataset hash matches a record anchored on the Shardeum blockchain.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dataset Details */}
                  <div className="card-lg bg-surface/40 border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Database size={16} className="text-accent-2" />
                      <h4 className="text-sm font-semibold text-text">Dataset Details</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-muted-2 uppercase font-bold tracking-widest mb-1">Name</p>
                        <p className="text-sm text-text font-medium">{(result as any).dataset?.name}</p>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-[10px] text-muted-2 uppercase font-bold tracking-widest mb-1">Risk Score</p>
                          <RiskBadge level={(result as any).dataset?.riskLevel} score={(result as any).dataset?.riskScore} />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-2 uppercase font-bold tracking-widest mb-1">Records</p>
                          <p className="text-sm text-text">{(result as any).dataset?.records?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Provenance */}
                  <div className="card-lg bg-surface/40 border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <History size={16} className="text-accent-2" />
                      <h4 className="text-sm font-semibold text-text">On-Chain Evidence</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-muted-2 uppercase font-bold tracking-widest mb-1">Transaction Hash</p>
                        <p className="text-[11px] font-mono text-accent-2 break-all">{(result as any).dataset?.txHash || "0x..."}</p>
                      </div>
                      <div className="pt-2">
                        <a 
                          href={`https://explorer-sphinx.shardeum.org/tx/${(result as any).dataset?.txHash}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 bg-surface border border-border rounded-lg text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
                        >
                          View on Explorer
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Result: Not Found / Error ───────────────────── */}
            {searched && !loading && !(result as any)?.verified && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-10 text-center animate-in fade-in slide-in-from-bottom-4">
                <ShieldAlert size={48} className="text-rose-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-rose-400 mb-2">Verification Failed</h3>
                <p className="text-sm text-rose-400/70 max-w-md mx-auto">
                  The hash you provided does not match any anchored records in our registry. This data may be tampered with, unverified, or private.
                </p>
                <button 
                  onClick={reset}
                  className="mt-6 text-xs font-bold text-text hover:underline"
                >
                  Try another hash
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}