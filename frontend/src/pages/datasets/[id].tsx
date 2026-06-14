// @ts-nocheck
import { useRouter } from "next/router";
import Head from "next/head";
import { 
  ShieldCheck, 
  Zap, 
  Anchor, 
  ArrowLeft, 
  Clock, 
  FileText,
  AlertCircle,
  Loader2
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useDataset } from "@/hooks/useDataset";
import RiskBadge from "@/components/RiskBadge";
import { datasetsApi } from "@/lib/apiClient";
import { useState } from "react";

export default function DatasetDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { dataset, loading, error, refetch } = useDataset(id as string);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      console.log("Starting Deep AI Audit for:", id);
      await datasetsApi.analyze(id as string);
      await refetch();
    } catch (err) {
      console.error("Analysis failed. Check backend console.", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnchor = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      console.log("Initiating Blockchain Anchor for:", id);
      await datasetsApi.anchor(id as string);
      await refetch();
    } catch (err) {
      console.error("Anchoring failed.", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></div>;
  if (!dataset) return <div className="p-20 text-center text-rose-400">Dataset not found.</div>;

  const isAnchored = dataset.status === "anchored" || dataset.anchored;

  return (
    <>
      <Head><title>{dataset.name} | DataPassport</title></Head>
      <div className="flex min-h-screen bg-void text-text font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar title="Dataset Explorer" subtitle={`Managing: ${dataset.name}`} />
          
          <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-xs text-muted-2 hover:text-text mb-6 transition-colors font-bold uppercase tracking-widest">
              <ArrowLeft size={14} /> Back to Dashboard
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="card-lg p-8 border border-border bg-surface/20 rounded-2xl shadow-xl">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{dataset.name}</h1>
                      <p className="text-muted-2 font-mono text-[10px] uppercase tracking-widest">{dataset.id}</p>
                    </div>
                    {/* Passing backend riskLevel/riskScore to the Badge component */}
                    <RiskBadge level={dataset.riskLevel || 'low'} score={dataset.riskScore || 0} />
                  </div>
                  <p className="text-text-2 mb-8 leading-relaxed text-sm">{dataset.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-8 border-t border-border/40">
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Owner</p>
                      <p className="text-xs font-medium text-text">{dataset.owner}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">License</p>
                      <p className="text-xs font-medium text-text">{dataset.license || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Records</p>
                      <p className="text-xs font-medium text-text">{dataset.records?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="card-lg p-8 border border-border bg-surface/20 rounded-2xl shadow-xl">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-accent-2">
                    <FileText size={16} /> Data Integrity & Hash
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-muted-2 uppercase font-bold mb-2 tracking-widest">Content SHA-256 Fingerprint</p>
                      <code className="block bg-void/50 p-4 rounded-xl text-[11px] text-accent-2 border border-border/40 break-all font-mono leading-relaxed">
                        {dataset.hash || "0x0000000000000000000000000000000000000000000000000000000000000000"}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* ── BLOCKCHAIN STATUS ─────────────────────────── */}
                <div className={`p-6 rounded-2xl border ${isAnchored ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20 shadow-lg'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    {isAnchored ? <ShieldCheck className="text-emerald-400" size={24} /> : <Clock className="text-amber-400" size={24} />}
                    <h3 className={`font-bold text-sm uppercase tracking-wider ${isAnchored ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isAnchored ? 'Anchored on Blockchain' : 'Pending Anchoring'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-muted-2 mb-6 leading-relaxed">
                    {isAnchored ? 'This record is notarized on the blockchain.' : 'Data is registered locally. Click to secure it on the blockchain.'}
                  </p>
                  {!isAnchored && (
                    <button 
                      onClick={handleAnchor}
                      disabled={actionLoading}
                      className="w-full py-3 bg-accent text-void rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <Anchor size={14} />}
                      Anchor to Blockchain
                    </button>
                  )}
                </div>

                {/* ── AI RISK SUMMARY (FIXED KEY) ───────────────── */}
                <div className="p-6 rounded-2xl border border-border bg-surface/20 shadow-xl">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-accent-2">
                    <Zap size={14} /> AI Risk Assessment
                  </h3>
                  <div className="space-y-5">
                    <div className="p-4 bg-void/30 rounded-xl border border-border/40">
                      <p className="text-[9px] text-muted-2 uppercase font-bold mb-2 tracking-widest">AI Audit Summary</p>
                      <p className="text-[11px] leading-relaxed text-text-2">
                        {/* FIX: Use aiSummary instead of aiAnalysis */}
                        {dataset.aiSummary || "Pending full AI analysis scan."}
                      </p>
                    </div>
                    <button 
                      onClick={handleAnalyze}
                      disabled={actionLoading} 
                      className="w-full py-3 border border-accent-2/30 text-accent-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-accent-2/10 transition-all active:scale-95"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                      Run Deep Audit
                    </button>
                  </div>
                </div>

                {/* ── ANOMALIES LIST (FIXED KEY) ─────────────────── */}
                <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-lg">
                   <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-rose-400">
                    <AlertCircle size={14} /> Detected Anomalies
                  </h3>
                  <ul className="space-y-3">
                    {/* FIX: Use dataset.anomalies instead of riskFlags */}
                    {(dataset.anomalies && dataset.anomalies.length > 0) ? dataset.anomalies.map((flag, i) => (
                      <li key={i} className="text-[10px] text-rose-300/80 flex items-start gap-2 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                        <span className="mt-1 h-1 w-1 rounded-full bg-rose-400 shrink-0" />
                        {flag}
                      </li>
                    )) : (
                      <li className="text-[10px] text-muted-2 italic">No security anomalies detected.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}