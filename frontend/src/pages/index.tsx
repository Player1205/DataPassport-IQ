import Head from "next/head";
import Link from "next/link";
import {
  Shield,
  ArrowRight,
  Database,
  Hexagon,
  CheckCircle,
  Zap,
} from "lucide-react";

//import Image from "next/image";

const FEATURES = [
  {
    icon: Shield,
    title: "Immutable Provenance",
    desc: "Every dataset registration anchored on Shardeum. Tamper-proof audit trails, forever.",
  },
  {
    icon: Database,
    title: "AI Risk Scoring",
    desc: "Automated risk analysis flags PII exposure, license conflicts, and misuse potential.",
  },
  {
    icon: Zap,
    title: "Instant Verification",
    desc: "Verify any dataset hash against on-chain records in milliseconds.",
  },
];

const STATS = [
  { value: "12,490+", label: "Datasets Registered" },
  { value: "99.98%", label: "Uptime" },
  { value: "< 2s", label: "Avg. Verification" },
  { value: "8,082", label: "Shardeum Chain ID" },
];

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>DataPassport – Trustworthy AI Data Provenance</title>
        <meta
          name="description"
          content="On-chain provenance, AI risk scoring, and tamper-proof certification for AI training datasets."
        />
      </Head>

      <div className="min-h-screen bg-void bg-grid text-text">
        {/* ── Nav ──────────────────────────────────────────────────── */}
        <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 h-14 border-b border-border/60 bg-void/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Hexagon size={14} className="text-accent-2 fill-accent/20" />
            </div>
            <span
              className="text-sm font-bold text-text"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              DataPassport
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-2">
            <Link href="/dashboard" className="hover:text-text transition-colors">Dashboard</Link>
            <Link href="/verify" className="hover:text-text transition-colors">Verify</Link>
            <a href="#" className="hover:text-text transition-colors">Docs</a>
          </nav>

          <Link href="/dashboard" className="btn-primary text-xs px-3 py-1.5">
            Launch App <ArrowRight size={13} />
          </Link>
        </header>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 pt-14">
          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl animate-fade-in">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent-2 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Live on Shardeum Sphinx Testnet
            </div>

            <h1
              className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-5"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              <span className="text-gradient">Trustworthy</span>
              <br />
              AI Data Provenance
            </h1>

            <p className="text-lg md:text-xl text-text-2 max-w-xl mx-auto leading-relaxed mb-8">
              Register, certify, and verify AI training datasets on-chain.{" "}
              <span className="text-text">DataPassport</span> gives every
              dataset an immutable identity — with AI-powered risk scoring.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/dashboard" className="btn-primary px-6 py-2.5 text-sm">
                Explore Datasets <ArrowRight size={14} />
              </Link>
              <Link href="/datasets/new" className="btn-secondary px-6 py-2.5 text-sm">
                Register Dataset
              </Link>
              <Link href="/verify" className="btn-ghost px-5 py-2.5 text-sm">
                Verify Hash
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────────── */}
        <section className="border-y border-border bg-void-2/60">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <p
                  className="text-3xl font-bold text-accent-2"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  {value}
                </p>
                <p className="text-xs text-muted-2 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-[10px] font-medium text-muted uppercase tracking-widest text-center mb-3">
            What DataPassport does
          </p>
          <h2
            className="text-3xl font-bold text-center text-text mb-10"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Built for trustworthy AI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-lg hover:border-accent/30 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Icon size={17} className="text-accent-2" />
                </div>
                <h3 className="text-base font-semibold text-text mb-2">{title}</h3>
                <p className="text-sm text-text-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-void-2/40 py-20 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <CheckCircle className="mx-auto text-accent-2 mb-4" size={32} />
            <h2
              className="text-3xl font-bold text-text mb-3"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Ready to certify your dataset?
            </h2>
            <p className="text-text-2 text-sm mb-6">
              Connect your wallet and register a dataset in under 2 minutes.
            </p>
            <Link href="/datasets/new" className="btn-primary px-8 py-3">
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="border-t border-border py-6 px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-2">
          <p>© 2024 DataPassport. Built on Shardeum.</p>
          <p>
            A hackathon project ·{" "}
            <a href="#" className="hover:text-text transition-colors">
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
