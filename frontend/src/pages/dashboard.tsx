import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import { Database, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import DatasetTable from "@/components/DatasetTable";
import { useDatasets } from "@/hooks/useDataset";

export default function Dashboard() {
  const router = useRouter();
  const { datasets, loading, error } = useDatasets();

  // The Safety Net! We ensure this is always an array
  const safeDatasets = datasets || [];
  const totalDatasets = safeDatasets.length;
  
  // Quick stats calculation
  const highRiskCount = safeDatasets.filter(
    (d) => d.riskLevel === "high" || d.riskLevel === "critical"
  ).length;

  return (
    <>
      <Head>
        <title>Dashboard | DataPassport</title>
      </Head>

      <div className="flex min-h-screen bg-void">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar title="Dashboard" subtitle="Live dataset registry" />

          <main className="flex-1 px-6 py-6 max-w-6xl w-full mx-auto animate-in">
            {/* ── Stats Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-surface/40 border border-border rounded-xl p-5 flex items-start gap-4 transition-all hover:bg-surface/60">
                <div className="p-2.5 bg-surface rounded-lg border border-border">
                  <Database size={20} className="text-muted" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-2 font-bold uppercase tracking-wider mb-1">Total Datasets</p>
                  <p className="text-2xl font-semibold text-text" style={{ fontFamily: "Syne, sans-serif" }}>
                    {totalDatasets}
                  </p>
                </div>
              </div>

              <div className="bg-surface/40 border border-border rounded-xl p-5 flex items-start gap-4 transition-all hover:bg-surface/60">
                <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <ShieldCheck size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-2 font-bold uppercase tracking-wider mb-1">System Status</p>
                  <p className="text-lg font-semibold text-text" style={{ fontFamily: "Syne, sans-serif" }}>Active</p>
                  <p className="text-xs text-emerald-400/80 mt-0.5">Node: Online</p>
                </div>
              </div>

              <div className="bg-surface/40 border border-border rounded-xl p-5 flex items-start gap-4 transition-all hover:bg-surface/60">
                <div className="p-2.5 bg-rose-500/10 rounded-lg border border-rose-500/20">
                  <AlertTriangle size={20} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-2 font-bold uppercase tracking-wider mb-1">Risk Filter</p>
                  <p className="text-lg font-semibold text-text" style={{ fontFamily: "Syne, sans-serif" }}>
                    {highRiskCount > 0 ? `${highRiskCount} Flagged` : "All Clear"}
                  </p>
                  <p className="text-xs text-rose-400/80 mt-0.5">Active selection</p>
                </div>
              </div>

              <div className="bg-surface/40 border border-border rounded-xl p-5 flex items-start gap-4 transition-all hover:bg-surface/60">
                <div className="p-2.5 bg-surface rounded-lg border border-border">
                  <Activity size={20} className="text-muted" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-2 font-bold uppercase tracking-wider mb-1">Registry Pages</p>
                  <p className="text-lg font-semibold text-text" style={{ fontFamily: "Syne, sans-serif" }}>1</p>
                </div>
              </div>
            </div>

            {/* ── Table Header Controls ────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-base font-semibold text-text flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
                  Registry Explorer
                  {loading && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span></span>}
                </h2>
                <p className="text-xs text-text-2 mt-0.5">Showing {totalDatasets} results</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/datasets/new')}
                  className="btn-primary bg-accent text-void px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Database size={14} />
                  Register Dataset
                </button>
              </div>
            </div>

            {/* ── Dataset Table Area ───────────────────────────────── */}
            {error ? (
              <div className="py-12 text-center border border-rose-500/20 bg-rose-500/5 rounded-xl">
                <AlertTriangle size={32} className="text-rose-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-rose-300 mb-1">Failed to load registry</p>
                <p className="text-xs text-rose-400/70">{error}</p>
              </div>
            ) : (
              <div className="bg-surface/40 border border-border rounded-xl overflow-hidden min-h-[300px]">
                {/* FIX: We cast ds to 'any' and provide strict defaults so TypeScript passes compilation seamlessly */}
                <DatasetTable
                  datasets={safeDatasets.map((ds: any) => ({
                    ...ds,
                    verified: false,
                    provenanceSteps: [],
                    tags: ds.tags || [],
                    txHash: ds.txHash || "Pending",
                    blockNumber: ds.blockNumber || 0,
                    chainId: ds.chainId || 8082,
                    updatedAt: ds.updatedAt || ds.createdAt || new Date().toISOString(),
                  }))}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}