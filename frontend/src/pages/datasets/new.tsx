import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import {
  Upload, Hash, Tag, FileText, AlertCircle,
  CheckCircle2, Loader2, Link2, Zap, ArrowRight,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

// ── Types ─────────────────────────────────────────────────────────────────

type Mode = "url" | "manual";
type Step = "form" | "scanning" | "hashing" | "analyzing" | "submitting" | "done" | "error";

const LICENSE_OPTIONS = [
  "CC BY 4.0", "CC BY-NC 4.0", "CC0 1.0",
  "Apache 2.0", "MIT", "Proprietary", "Research Only", "Other",
];

interface FormState {
  name: string; description: string; owner: string; license: string;
  tags: string; version: string; size: string; records: string;
  ipfsCid: string; notes: string;
}

const INITIAL: FormState = {
  name: "", description: "", owner: "", license: "CC BY 4.0",
  tags: "", version: "1.0.0", size: "", records: "", ipfsCid: "", notes: "",
};

interface DoneResult {
  datasetId: string;
  hash: string;
  name: string;
  riskLevel?: string;
  riskScore?: number;
  riskFlags?: string[];
  summary?: string;
}

// ── Step bar ──────────────────────────────────────────────────────────────

const MANUAL_STEPS = [
  { id: "form", label: "Fill Details" },
  { id: "hashing", label: "Save to DB" },
  { id: "analyzing", label: "AI Analysis" },
  { id: "done", label: "Registered" },
];

const URL_STEPS = [
  { id: "form", label: "Enter URL" },
  { id: "scanning", label: "AI Scanning" },
  { id: "done", label: "Registered" },
];

function StepBar({ current, mode }: { current: Step; mode: Mode }) {
  const steps = mode === "url" ? URL_STEPS : MANUAL_STEPS;
  const idx = Math.max(0, steps.findIndex((s) => s.id === current));
  return (
    <div className="flex items-center mb-8">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
              i < idx ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
              : i === idx ? "bg-accent/20 border-accent/40 text-accent-2"
              : "bg-surface border-border text-muted"}`}>
              {i < idx ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span className={`text-[9px] mt-1 whitespace-nowrap ${i === idx ? "text-accent-2" : "text-muted"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-1 mb-4 ${i < idx ? "bg-emerald-500/30" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function NewDataset() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("url");
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [datasetUrl, setDatasetUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [result, setResult] = useState<DoneResult | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
  const isBusy = ["scanning", "hashing", "analyzing", "submitting"].includes(step);

  function getAuth() {
    const token = localStorage.getItem("token");
    const ownerAddress = localStorage.getItem("address");
    if (!token || !ownerAddress) throw new Error("Please connect your wallet first!");
    return { token, ownerAddress };
  }

  // ── URL scan submit ───────────────────────────────────────────────────

  async function handleUrlSubmit() {
    setUrlError("");
    if (!datasetUrl.trim()) { setUrlError("Please enter a URL."); return; }
    if (!datasetUrl.startsWith("http")) { setUrlError("URL must start with http:// or https://"); return; }

    let auth: { token: string; ownerAddress: string };
    try { auth = getAuth(); } catch (e: unknown) {
      setUrlError(e instanceof Error ? e.message : "Auth error");
      return;
    }

    const owner = form.owner.trim() || "Unknown Owner";

    try {
      setStep("scanning");
      const res = await fetch(`${baseUrl}/datasets/scan-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${auth.token}` },
        body: JSON.stringify({ url: datasetUrl, owner, ownerAddress: auth.ownerAddress }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Scan failed");

      const ds = json.data?.dataset || json.data || json;
      const scanned = json.scanned ?? {};

      setResult({
        datasetId: ds.id || ds._id,
        hash: ds.hash ?? "",
        name: scanned.name || ds.name,
        riskLevel: scanned.riskLevel || ds.riskLevel,
        riskScore: scanned.riskScore ?? ds.riskScore,
        riskFlags: ds.riskFlags ?? [],
        summary: scanned.summary || ds.aiAnalysis,
      });
      setStep("done");
    } catch (err: unknown) {
      setUrlError(err instanceof Error ? err.message : "Scan failed");
      setStep("form");
    }
  }

  // ── Manual form submit ────────────────────────────────────────────────

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Required.";
    if (!form.description.trim()) e.description = "Required.";
    if (!form.owner.trim()) e.owner = "Required.";
    if (!form.records || isNaN(Number(form.records))) e.records = "Enter a number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleManualSubmit() {
    if (!validate()) return;
    let auth: { token: string; ownerAddress: string };
    try { auth = getAuth(); } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Auth error"); return;
    }

    try {
      setStep("hashing");
      const createRes = await fetch(`${baseUrl}/datasets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${auth.token}` },
        body: JSON.stringify({
          name: form.name, description: form.description, owner: form.owner,
          ownerAddress: auth.ownerAddress, license: form.license,
          version: form.version || "1.0.0", size: form.size,
          records: Number(form.records),
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          ipfsCid: form.ipfsCid || undefined, notes: form.notes || undefined,
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson?.message || "Save failed");

      const ds = createJson.data?.dataset || createJson.data || createJson;
      const datasetId = ds.id || ds._id;
      if (!datasetId) throw new Error("No dataset ID in response");

      setStep("analyzing");
      const analyzeRes = await fetch(`${baseUrl}/datasets/${datasetId}/analyze`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${auth.token}` },
      });
      const analyzeJson = await analyzeRes.json();

      setResult({
        datasetId,
        hash: ds.hash ?? "",
        name: form.name,
        riskLevel: analyzeJson?.data?.riskLevel,
        riskScore: analyzeJson?.data?.riskScore,
        riskFlags: analyzeJson?.data?.riskFlags ?? [],
        summary: analyzeJson?.report?.summary,
      });
      setStep("done");
    } catch (err: unknown) {
      console.error(err);
      setStep("error");
    }
  }

  // ── Risk colour helper ────────────────────────────────────────────────
  const riskColor: Record<string, string> = {
    low: "text-emerald-400", medium: "text-amber-400",
    high: "text-orange-400", critical: "text-rose-400",
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>Register Dataset · DataPassport</title></Head>
      <div className="flex min-h-screen bg-void">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar title="Register Dataset" subtitle="Add a new dataset to the registry" />
          <main className="flex-1 px-6 py-6 max-w-3xl">

            {/* ── Mode toggle ──────────────────────────────────── */}
            {step === "form" && (
              <div className="flex gap-2 mb-6 p-1 bg-surface rounded-xl border border-border w-fit">
                <button
                  onClick={() => { setMode("url"); setStep("form"); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === "url" ? "bg-accent text-void" : "text-muted-2 hover:text-text"}`}
                >
                  <Link2 size={13} /> Scan from URL
                </button>
                <button
                  onClick={() => { setMode("manual"); setStep("form"); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === "manual" ? "bg-accent text-void" : "text-muted-2 hover:text-text"}`}
                >
                  <FileText size={13} /> Manual Entry
                </button>
              </div>
            )}

            <StepBar current={step} mode={mode} />

            {/* ── DONE state ───────────────────────────────────── */}
            {step === "done" && result && (
              <div className="card-lg bg-surface/40 border border-border rounded-xl p-6 animate-in space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text" style={{ fontFamily: "Syne, sans-serif" }}>
                      Dataset Registered!
                    </h2>
                    <p className="text-xs text-text-2">{result.name}</p>
                  </div>
                </div>

                {/* AI result */}
                {result.riskLevel && (
                  <div className="bg-void-3 rounded-xl px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-accent-2" />
                      <p className="text-xs font-semibold text-text">AI Risk Analysis</p>
                      <span className={`text-xs font-bold uppercase ${riskColor[result.riskLevel] ?? "text-muted"}`}>
                        {result.riskLevel} ({result.riskScore}/100)
                      </span>
                    </div>
                    {result.summary && <p className="text-xs text-text-2">{result.summary}</p>}
                    {result.riskFlags && result.riskFlags.length > 0 && (
                      <ul className="space-y-0.5 mt-1">
                        {result.riskFlags.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-[10px] text-rose-400">
                            <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {result.hash && (
                  <div className="bg-void-3 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-muted-2 uppercase tracking-wider mb-1">SHA-256 Hash</p>
                    <p className="font-mono text-[10px] text-accent-2 break-all">{result.hash}</p>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  <button className="btn-secondary text-xs px-4 py-2 border border-border rounded-lg"
                    onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                  </button>
                  {result.datasetId && (
                    <button className="btn-primary flex items-center gap-2 bg-accent text-void px-4 py-2 rounded-lg font-bold text-xs"
                      onClick={() => router.push(`/datasets/${result.datasetId}`)}>
                      View & Anchor <ArrowRight size={13} />
                    </button>
                  )}
                  <button className="text-xs text-muted-2 hover:text-text transition-colors"
                    onClick={() => { setStep("form"); setResult(null); setDatasetUrl(""); setForm(INITIAL); }}>
                    Register Another
                  </button>
                </div>
              </div>
            )}

            {/* ── ERROR state ──────────────────────────────────── */}
            {step === "error" && (
              <div className="card-lg text-center py-10 bg-surface/40 border border-border rounded-xl">
                <AlertCircle size={36} className="text-rose-400 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-text mb-2">Registration Failed</h2>
                <p className="text-xs text-text-2 mb-5">Check backend logs for details.</p>
                <div className="flex gap-3 justify-center">
                  <button className="text-xs text-muted-2 hover:text-text"
                    onClick={() => router.push("/dashboard")}>Cancel</button>
                  <button className="bg-accent text-void px-5 py-2 rounded-lg font-bold text-xs"
                    onClick={() => setStep("form")}>Try Again</button>
                </div>
              </div>
            )}

            {/* ── LOADING state ────────────────────────────────── */}
            {isBusy && (
              <div className="card-lg text-center py-14 bg-surface/40 border border-border rounded-xl animate-in">
                <Loader2 size={36} className="text-accent mx-auto mb-4 animate-spin" />
                <p className="text-base font-semibold text-text" style={{ fontFamily: "Syne, sans-serif" }}>
                  {step === "scanning" && "AI scanning dataset URL…"}
                  {step === "hashing" && "Saving to database…"}
                  {step === "analyzing" && "Running AI risk analysis…"}
                  {step === "submitting" && "Finalising…"}
                </p>
                <p className="text-xs text-muted-2 mt-2">
                  {step === "scanning" && "Fetching content and analysing with Claude AI. This may take 10–20 seconds."}
                  {step === "analyzing" && "Checking for PII, license conflicts, and risk factors."}
                </p>
              </div>
            )}

            {/* ── URL MODE form ────────────────────────────────── */}
            {step === "form" && mode === "url" && (
              <div className="space-y-5 animate-in">
                <div className="card-lg bg-surface/40 border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 size={15} className="text-accent-2" />
                    <h3 className="text-sm font-semibold text-text">Dataset URL</h3>
                  </div>
                  <p className="text-xs text-text-2 mb-4">
                    Paste any public link — a CSV file, JSON file, Kaggle dataset page, GitHub raw file, or any API endpoint.
                    Claude AI will fetch the content, count rows/columns, infer metadata, and run a risk scan automatically.
                  </p>

                  {/* Supported formats hint */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["CSV file URL", "JSON endpoint", "Kaggle page", "GitHub raw", "HuggingFace dataset"].map((f) => (
                      <span key={f} className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-md text-[10px] text-accent-2">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">
                        Dataset URL *
                      </label>
                      <input
                        type="url"
                        className={`w-full bg-void border rounded-lg px-3 py-2.5 text-sm font-mono focus:border-accent/50 outline-none transition-all ${
                          urlError ? "border-rose-500/60" : "border-border"}`}
                        placeholder="https://raw.githubusercontent.com/…/dataset.csv"
                        value={datasetUrl}
                        onChange={(e) => { setDatasetUrl(e.target.value); setUrlError(""); }}
                      />
                      {urlError && (
                        <p className="flex items-center gap-1 text-[10px] text-rose-400 mt-1">
                          <AlertCircle size={10} /> {urlError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">
                        Your Name / Organisation (optional)
                      </label>
                      <input
                        className="w-full bg-void border border-border rounded-lg px-3 py-2 text-sm focus:border-accent/50 outline-none transition-all"
                        placeholder="e.g. HealthAI Labs"
                        value={form.owner}
                        onChange={(e) => set("owner", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-5 p-3 bg-accent/5 border border-accent/20 rounded-lg text-xs text-text-2">
                    <strong className="text-accent-2">What happens next:</strong> We fetch up to 500KB of your dataset,
                    send a sample to Claude AI, and automatically extract: name, description, record count,
                    tags, license, risk score, and risk flags. No manual typing needed.
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button className="text-xs text-muted-2 hover:text-text"
                    onClick={() => router.push("/dashboard")}>Cancel</button>
                  <button
                    onClick={handleUrlSubmit}
                    className="flex items-center gap-2 bg-accent text-void px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    <Zap size={15} /> Scan & Register
                  </button>
                </div>
              </div>
            )}

            {/* ── MANUAL MODE form ─────────────────────────────── */}
            {step === "form" && mode === "manual" && (
              <div className="space-y-5 animate-in">
                {/* Basic info */}
                <div className="card-lg bg-surface/40 border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <FileText size={15} className="text-accent-2" />
                    <h3 className="text-sm font-semibold text-text">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">Dataset Name *</label>
                      <input
                        className={`w-full bg-void border rounded-lg px-3 py-2 text-sm focus:border-accent/50 outline-none transition-all ${errors.name ? "border-rose-500/60" : "border-border"}`}
                        placeholder="e.g. ImageNet-Medical-v3"
                        value={form.name} onChange={(e) => set("name", e.target.value)}
                      />
                      {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">Description *</label>
                      <textarea rows={3}
                        className={`w-full bg-void border rounded-lg px-3 py-2 text-sm focus:border-accent/50 outline-none transition-all resize-none ${errors.description ? "border-rose-500/60" : "border-border"}`}
                        placeholder="Describe the dataset…"
                        value={form.description} onChange={(e) => set("description", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">Owner *</label>
                      <input
                        className={`w-full bg-void border rounded-lg px-3 py-2 text-sm focus:border-accent/50 outline-none transition-all ${errors.owner ? "border-rose-500/60" : "border-border"}`}
                        placeholder="HealthAI Labs"
                        value={form.owner} onChange={(e) => set("owner", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">License</label>
                      <select className="w-full bg-void border border-border rounded-lg px-3 py-2 text-sm focus:border-accent/50 outline-none transition-all text-text"
                        value={form.license} onChange={(e) => set("license", e.target.value)}>
                        {LICENSE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Technical */}
                <div className="card-lg bg-surface/40 border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Hash size={15} className="text-accent-2" />
                    <h3 className="text-sm font-semibold text-text">Technical Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">Version</label>
                      <input className="w-full bg-void border border-border rounded-lg px-3 py-2 text-sm focus:border-accent/50 outline-none"
                        placeholder="1.0.0" value={form.version} onChange={(e) => set("version", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">Size</label>
                      <input className="w-full bg-void border border-border rounded-lg px-3 py-2 text-sm focus:border-accent/50 outline-none"
                        placeholder="48.2 GB" value={form.size} onChange={(e) => set("size", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">Record Count *</label>
                      <input type="number"
                        className={`w-full bg-void border rounded-lg px-3 py-2 text-sm focus:border-accent/50 outline-none ${errors.records ? "border-rose-500/60" : "border-border"}`}
                        placeholder="284000" value={form.records} onChange={(e) => set("records", e.target.value)} />
                      {errors.records && <p className="text-[10px] text-rose-400 mt-1">{errors.records}</p>}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="card-lg bg-surface/40 border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Tag size={15} className="text-accent-2" />
                    <h3 className="text-sm font-semibold text-text">Tags & Notes</h3>
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
                      <input className="w-full bg-void border border-border rounded-lg px-3 py-2 text-sm focus:border-accent/50 outline-none"
                        placeholder="medical, imaging, annotated" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">IPFS CID (optional)</label>
                      <input className="w-full bg-void border border-border rounded-lg px-3 py-2 text-sm focus:border-accent/50 outline-none"
                        placeholder="bafybeig…" value={form.ipfsCid} onChange={(e) => set("ipfsCid", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">Provenance Notes</label>
                      <textarea rows={2} className="w-full bg-void border border-border rounded-lg px-3 py-2 text-sm focus:border-accent/50 outline-none resize-none"
                        placeholder="Source institutions, collection methods…"
                        value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button className="text-xs text-muted-2 hover:text-text"
                    onClick={() => router.push("/dashboard")}>Cancel</button>
                  <button onClick={handleManualSubmit}
                    className="flex items-center gap-2 bg-accent text-void px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90">
                    <Upload size={16} /> Register Dataset
                  </button>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}
