import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { LocaleProvider, useLocale } from "@/components/locale-provider";
import {
  useAnalyzeCreator,
  useListAnalyses,
  useGetAnalysisStats,
  getListAnalysesQueryKey,
  getGetAnalysisStatsQueryKey,
} from "@workspace/api-client-react";
import {
  Sun, Moon, Zap, TrendingUp, Users, Award, Globe,
  Activity, Target, Radio, Flame, ShieldCheck, BarChart2,
  Clock, ChevronRight, Hash, ArrowRight, CheckCircle2,
  Scan, Layers, Trophy,
} from "lucide-react";

const queryClient = new QueryClient();

type Badge = {
  id: string;
  label: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  description?: string;
};

type AnalysisResult = {
  id: number;
  handle: string;
  vibeScore: number;
  brandFitScore: number;
  category: string;
  audienceSize?: string | null;
  engagementRate?: number | null;
  badges: Badge[];
  locale: string;
  createdAt: string;
};

function getTierIcon(tier: Badge["tier"]) {
  if (tier === "platinum") return <ShieldCheck className="w-4 h-4" />;
  if (tier === "gold") return <Award className="w-4 h-4" />;
  if (tier === "silver") return <Target className="w-4 h-4" />;
  return <Flame className="w-4 h-4" />;
}

function getTierStyle(tier: Badge["tier"]) {
  if (tier === "platinum") return "border-primary/50 bg-primary/10 text-primary";
  if (tier === "gold") return "border-yellow-400/50 bg-yellow-400/10 text-yellow-400";
  if (tier === "silver") return "border-slate-300/50 bg-slate-300/10 text-slate-300 dark:text-slate-300";
  return "border-orange-500/50 bg-orange-500/10 text-orange-400";
}

function getOverallRating(vibe: number, fit: number) {
  const score = (vibe + fit) / 2;
  if (score >= 88) return { label: "Elite Match", color: "text-primary", border: "border-primary/40 bg-primary/10" };
  if (score >= 74) return { label: "Strong Fit", color: "text-yellow-400", border: "border-yellow-400/40 bg-yellow-400/10" };
  if (score >= 58) return { label: "Moderate Fit", color: "text-orange-400", border: "border-orange-400/40 bg-orange-400/10" };
  return { label: "Low Alignment", color: "text-muted-foreground", border: "border-border bg-muted/10" };
}

function deriveMetrics(result: AnalysisResult) {
  const { vibeScore, brandFitScore, engagementRate } = result;
  const eng = engagementRate ?? 4;
  return [
    { key: "Authenticity", value: Math.min(100, Math.round(vibeScore * 0.9 + eng * 1.5)) },
    { key: "Reach", value: Math.min(100, Math.round(brandFitScore * 0.8 + vibeScore * 0.2)) },
    { key: "Momentum", value: Math.min(100, Math.round(eng * 8.5 + vibeScore * 0.15)) },
    { key: "Resonance", value: Math.min(100, Math.round((vibeScore + brandFitScore) / 2 * 0.95)) },
    { key: "Originality", value: Math.min(100, Math.round(vibeScore * 0.75 + brandFitScore * 0.3)) },
    { key: "Community", value: Math.min(100, Math.round(eng * 7 + brandFitScore * 0.25)) },
  ];
}

function ScoreRing({ score, label, size = "lg" }: { score: number; label: string; size?: "sm" | "lg" }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDisplayed(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const isLg = size === "lg";
  const dim = isLg ? 120 : 80;
  const r = isLg ? 48 : 30;
  const sw = isLg ? 7 : 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (displayed / 100) * circ;
  const cx = dim / 2, cy = dim / 2;

  return (
    <div className="flex flex-col items-center gap-2" data-testid={`score-ring-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw} className="stroke-muted" />
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw} className="stroke-primary"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-bold text-primary ${isLg ? "text-3xl" : "text-xl"}`}>{displayed}</span>
          {isLg && <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">/100</span>}
        </div>
      </div>
      <span className={`font-mono uppercase tracking-widest text-muted-foreground ${isLg ? "text-xs" : "text-[10px]"}`}>{label}</span>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 200);
    return () => clearTimeout(t);
  }, [value]);
  const color = value >= 80 ? "bg-primary" : value >= 60 ? "bg-yellow-400" : value >= 40 ? "bg-orange-400" : "bg-slate-500";
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs font-mono text-muted-foreground flex-shrink-0">{label}</div>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`}
          style={{ width: `${width}%`, transition: "width 1s cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
      <div className="text-xs font-mono font-bold text-foreground w-7 text-right">{value}</div>
    </div>
  );
}

function BadgeCard({ badge, t }: { badge: Badge; t: (k: string) => string }) {
  const labelKey = badge.label.toLowerCase().replace(/\s/g, "");
  const keyMap: Record<string, string> = {
    "risingstar": "risingStar", "culturalicon": "culturalIcon",
    "vibesetter": "vibeSetter", "trendbreaker": "trendBreaker",
    "crowdmagnet": "crowdMagnet", "undergroundlegend": "undergroundLegend",
  };
  const translated = keyMap[labelKey] ? t(keyMap[labelKey]) : badge.label;
  return (
    <div className={`flex items-start gap-2.5 border rounded p-3 ${getTierStyle(badge.tier)}`} data-testid={`badge-${badge.id}`}>
      <div className="mt-0.5 flex-shrink-0">{getTierIcon(badge.tier)}</div>
      <div>
        <div className="font-mono font-bold text-sm leading-tight">{translated}</div>
        {badge.description && <div className="text-[11px] font-mono opacity-70 mt-0.5 leading-snug">{badge.description}</div>}
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mt-1">{badge.tier}</div>
      </div>
    </div>
  );
}

function BadgePillSmall({ badge, t }: { badge: Badge; t: (k: string) => string }) {
  const labelKey = badge.label.toLowerCase().replace(/\s/g, "");
  const keyMap: Record<string, string> = {
    "risingstar": "risingStar", "culturalicon": "culturalIcon",
    "vibesetter": "vibeSetter", "trendbreaker": "trendBreaker",
    "crowdmagnet": "crowdMagnet", "undergroundlegend": "undergroundLegend",
  };
  const translated = keyMap[labelKey] ? t(keyMap[labelKey]) : badge.label;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono font-medium ${getTierStyle(badge.tier)}`}>
      {getTierIcon(badge.tier)}
      {translated}
    </span>
  );
}

const ANALYSIS_STEPS = [
  { label: "Crawling creator profile", duration: 400 },
  { label: "Mapping cultural footprint", duration: 700 },
  { label: "Scoring vibe alignment", duration: 500 },
  { label: "Calculating brand fit", duration: 600 },
  { label: "Generating badge awards", duration: 400 },
  { label: "Compiling final report", duration: 400 },
];

function AnalyzingState({ handle }: { handle: string }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let s = 0, elapsed = 0;
    const total = ANALYSIS_STEPS.reduce((a, x) => a + x.duration, 0);
    const advance = () => {
      if (s >= ANALYSIS_STEPS.length) return;
      const dur = ANALYSIS_STEPS[s].duration;
      setTimeout(() => { s++; elapsed += dur; setStep(s); setProgress(Math.round((elapsed / total) * 100)); advance(); }, dur);
    };
    advance();
  }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mt-5 border border-border rounded bg-background p-5" data-testid="analyzing-state">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Analyzing {handle}</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{progress}%</span>
      </div>
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-4">
        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%`, transition: "width 0.4s ease" }} />
      </div>
      <div className="space-y-1.5">
        {ANALYSIS_STEPS.map((s, i) => (
          <div key={i} className={`flex items-center gap-2.5 text-xs font-mono transition-colors ${i < step ? "text-foreground" : i === step ? "text-primary" : "text-muted-foreground/40"}`}>
            <span className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
              {i < step ? <span className="text-primary">✓</span>
                : i === step ? <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
                : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 inline-block" />}
            </span>
            {s.label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ResultCard({ result, t }: { result: AnalysisResult; t: (k: string) => string }) {
  const metrics = deriveMetrics(result);
  const radarData = metrics.map((m) => ({ subject: m.key, A: m.value, fullMark: 100 }));
  const overall = getOverallRating(result.vibeScore, result.brandFitScore);
  const initials = result.handle.replace("@", "").slice(0, 2).toUpperCase();
  const engFmt = result.engagementRate != null ? `${result.engagementRate}%` : "—";
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-5 border border-primary/30 rounded bg-background overflow-hidden" data-testid="analysis-result">
      <div className="h-1 bg-primary w-full" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded border border-border bg-muted flex items-center justify-center font-mono font-bold text-foreground text-sm flex-shrink-0">{initials}</div>
            <div>
              <div className="font-mono font-bold text-foreground text-lg leading-tight" data-testid="result-handle">{result.handle}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">{result.category}</span>
                <span className="text-xs font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded flex items-center gap-1"><Users className="w-3 h-3" />{result.audienceSize ?? "—"}</span>
                <span className="text-xs font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded flex items-center gap-1"><TrendingUp className="w-3 h-3" />{engFmt} eng.</span>
              </div>
            </div>
          </div>
          <div className={`flex-shrink-0 text-xs font-mono font-bold px-3 py-1.5 rounded border ${overall.border} ${overall.color}`}>{overall.label}</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <Radio className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Score Breakdown</span>
            </div>
            <div className="flex gap-10 justify-start">
              <ScoreRing score={result.vibeScore} label="Vibe Match" size="lg" />
              <ScoreRing score={result.brandFitScore} label={t("brandFit")} size="lg" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <BarChart2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Creator Radar</span>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 4, fontSize: 11, fontFamily: "monospace", color: "hsl(var(--foreground))" }} />
                  <Radar name="Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-5 mb-5">
          <div className="flex items-center gap-1.5 mb-4">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Trait Breakdown</span>
          </div>
          <div className="space-y-3">
            {metrics.map((m) => <MetricBar key={m.key} label={m.key} value={m.value} />)}
          </div>
        </div>
        <div className="border-t border-border pt-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Award className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Awards — {result.badges.length} badge{result.badges.length !== 1 ? "s" : ""} earned</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="result-badges">
            {result.badges.map((badge) => <BadgeCard key={badge.id} badge={badge} t={t} />)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const TICKER_HANDLES = [
  "@wavecult", "@neondelhi", "@retrofuture", "@citysound", "@undergroundmx",
  "@beatdropnyc", "@vibelab", "@bassline99", "@hiphopgate", "@cultureOS",
];

function Navbar() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm" data-testid="navbar">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-primary font-mono font-bold text-xl tracking-tighter" data-testid="brand-logo">OFF/BEAT</span>
          <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono uppercase tracking-widest border border-border px-1.5 py-0.5 rounded">Creator Sync</span>
        </div>
        <div className="flex items-center gap-2">
          <button data-testid="locale-toggle" onClick={() => setLocale(locale === "global" ? "bharat" : "global")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border hover:border-primary/60 transition-colors text-xs font-mono text-muted-foreground hover:text-foreground">
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{locale === "global" ? t("globalMode") : t("bharatMode")}</span>
          </button>
          <button data-testid="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded border border-border hover:border-primary/60 transition-colors text-muted-foreground hover:text-foreground" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const { t } = useLocale();
  const [tickerIdx, setTickerIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTickerIdx((i) => (i + 1) % TICKER_HANDLES.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="border-b border-border" data-testid="hero-section">
      <div className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-3 py-1.5 rounded mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t("buildFromScratch")}
          </div>
          <h1 className="text-5xl sm:text-6xl font-mono font-bold leading-[1.05] mb-5 tracking-tight">
            <span className="text-foreground">Creator</span><span className="text-primary">—</span><br />
            <span className="text-foreground">Brand</span><br />
            <span className="text-primary">Sync.</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm leading-relaxed max-w-md mb-6">
            {t("tagline")} Drop a creator handle, get an instant cultural alignment score — no spreadsheets, no guesswork.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />AI Engine</span>
            <span className="text-border">·</span><span>Real-time scoring</span>
            <span className="text-border">·</span><span>Culture-first</span>
          </div>
        </div>
        <div className="border border-border rounded bg-card p-4 font-mono text-xs space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground ml-2 text-[11px]">offbeat-sync — analysis engine</span>
          </div>
          <div className="text-muted-foreground">$ run analyze <AnimatePresence mode="wait">
            <motion.span key={tickerIdx} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="text-primary inline-block">
              {TICKER_HANDLES[tickerIdx]}
            </motion.span>
          </AnimatePresence></div>
          <div className="text-muted-foreground/60">→ Crawling profile...</div>
          <div className="text-muted-foreground/60">→ Mapping cultural footprint...</div>
          <div className="text-foreground">→ Vibe Score: <span className="text-primary font-bold">87/100</span></div>
          <div className="text-foreground">→ Brand Fit: <span className="text-primary font-bold">91/100</span></div>
          <div className="text-muted-foreground/60">→ Badges: Cultural Icon, Platinum Creator</div>
          <div className="text-primary animate-pulse">_</div>
        </div>
      </div>
    </section>
  );
}

const HOW_IT_WORKS = [
  { step: "01", icon: <Hash className="w-5 h-5" />, title: "Drop a Handle", desc: "Enter any creator's social handle — Instagram, TikTok, YouTube. No API key, no login required." },
  { step: "02", icon: <Scan className="w-5 h-5" />, title: "AI Engine Runs", desc: "Our mock AI crawls cultural signals, community vibes, content patterns, and audience energy in ~2 seconds." },
  { step: "03", icon: <Layers className="w-5 h-5" />, title: "Get the Full Report", desc: "Vibe Match, Brand Fit scores, a 6-axis radar profile, trait breakdown, and gamification badges by tier." },
];

function HowItWorks() {
  return (
    <section className="border-b border-border bg-card/30" data-testid="how-it-works">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-1 h-4 bg-primary rounded inline-block" />
          <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-foreground">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded border border-primary/30 bg-primary/10 text-primary">{item.icon}</div>
                <span className="font-mono text-4xl font-bold text-muted-foreground/20">{item.step}</span>
              </div>
              <div>
                <div className="font-mono font-bold text-foreground mb-1.5">{item.title}</div>
                <div className="text-xs font-mono text-muted-foreground leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: <Radio className="w-4 h-4" />, title: "Vibe Match Score", desc: "0–100 score measuring cultural resonance between creator content and your brand's aesthetic." },
  { icon: <Target className="w-4 h-4" />, title: "Brand Fit Index", desc: "Calculates how well the creator's audience aligns with your target demographic and brand values." },
  { icon: <BarChart2 className="w-4 h-4" />, title: "6-Axis Radar Profile", desc: "Authenticity, Reach, Momentum, Resonance, Originality, Community — visualized in a radar chart." },
  { icon: <Trophy className="w-4 h-4" />, title: "Gamification Badges", desc: "Bronze to Platinum badge awards based on cultural footprint. Rising Star, Cultural Icon, and more." },
  { icon: <Activity className="w-4 h-4" />, title: "Engagement Analysis", desc: "Estimated engagement rate and audience size tier, surface-level signals before you go deeper." },
  { icon: <Globe className="w-4 h-4" />, title: "Bharat Edition", desc: "Switch to INR mode with translated badge labels and localized copy for the Indian creator market." },
];

function FeaturesGrid() {
  return (
    <section className="border-b border-border" data-testid="features-grid">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded inline-block" />
            <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-foreground">What You Get</h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{FEATURES.length} signals analyzed</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="border border-border rounded bg-card p-4 hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 rounded border border-border bg-background text-primary group-hover:border-primary/40 transition-colors">{f.icon}</div>
                <span className="font-mono font-bold text-sm text-foreground">{f.title}</span>
              </div>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const BADGE_TIERS = [
  { tier: "platinum" as const, label: "Platinum Creator", desc: "Top 1% — elite brand fit across all verticals", count: "Rare" },
  { tier: "gold" as const, label: "Cultural Icon / Underground Legend", desc: "Defines or disrupts culture at scale", count: "Top 10%" },
  { tier: "silver" as const, label: "Vibe Setter / Trend Breaker", desc: "Consistently shapes or challenges the narrative", count: "Top 25%" },
  { tier: "bronze" as const, label: "Rising Star / Crowd Magnet", desc: "Gaining traction, real community energy", count: "Entry" },
];

function BadgeTierSection() {
  return (
    <section className="border-b border-border bg-card/30" data-testid="badge-tiers">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded inline-block" />
            <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-foreground">Badge Tier System</h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">4 tiers · 8 badges total</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BADGE_TIERS.map((b) => (
            <div key={b.tier} className={`border rounded p-4 flex flex-col gap-2 ${getTierStyle(b.tier)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTierIcon(b.tier)}
                  <span className="font-mono font-bold text-xs uppercase tracking-widest">{b.tier}</span>
                </div>
                <span className="text-[10px] font-mono opacity-60 border border-current/30 px-1.5 py-0.5 rounded">{b.count}</span>
              </div>
              <div className="font-mono font-bold text-sm leading-tight">{b.label}</div>
              <div className="text-[11px] font-mono opacity-70 leading-snug">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnalyzeSection() {
  const { locale, t } = useLocale();
  const [handle, setHandle] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const qc = useQueryClient();

  const mutation = useAnalyzeCreator({
    mutation: {
      onSuccess: (data) => {
        setResult(data as AnalysisResult);
        qc.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;
    setResult(null);
    mutation.mutate({ data: { handle: handle.trim(), locale } });
  };

  return (
    <section className="border-b border-border" id="analyze" data-testid="analyze-section">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1 h-4 bg-primary rounded inline-block" />
          <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-foreground">Run a Creator Scan</h2>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded">{locale === "bharat" ? "Bharat Edition" : "Global Edition"}</span>
        </div>

        <div className="border border-border rounded bg-card overflow-hidden">
          <div className="p-5 border-b border-border bg-background/40">
            <form onSubmit={handleSubmit} className="flex gap-2" data-testid="analyze-form">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input data-testid="input-handle" type="text" value={handle}
                  onChange={(e) => setHandle(e.target.value)} placeholder={t("handlePlaceholder")}
                  className="w-full bg-background border border-border rounded pl-9 pr-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  disabled={mutation.isPending} />
              </div>
              <button data-testid="button-analyze" type="submit" disabled={mutation.isPending || !handle.trim()}
                className="px-6 py-3 bg-primary text-primary-foreground font-mono font-bold text-sm rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 whitespace-nowrap">
                {mutation.isPending
                  ? <><span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Scanning</>
                  : <><Zap className="w-3.5 h-3.5" />Run Scan</>}
              </button>
            </form>
            {handle.length > 0 && !mutation.isPending && !result && (
              <div className="mt-2 text-xs font-mono text-muted-foreground">
                Ready to scan <span className="text-foreground">{handle.startsWith("@") ? handle : `@${handle}`}</span>
                <span className="ml-3 text-primary">↵ Enter or click Run Scan</span>
              </div>
            )}
          </div>

          <div className="p-5">
            {!mutation.isPending && !result && (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full border border-border bg-muted/30 flex items-center justify-center text-muted-foreground/50">
                  <Scan className="w-5 h-5" />
                </div>
                <div className="font-mono text-sm text-muted-foreground">Enter a creator handle above to run your first scan</div>
                <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground/60">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary" />Vibe score</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary" />Brand fit</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary" />Badges</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary" />Radar chart</span>
                </div>
              </div>
            )}
            {mutation.isPending && <AnalyzingState handle={handle.startsWith("@") ? handle : `@${handle}`} />}
            <AnimatePresence>
              {result && !mutation.isPending && <ResultCard result={result} t={t} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const { t } = useLocale();
  const { data: stats, isLoading } = useGetAnalysisStats();
  const statItems = stats ? [
    { label: t("statsTotal"), value: stats.totalAnalyses, sub: `${stats.recentCount} in last 24h`, icon: <Users className="w-4 h-4" /> },
    { label: t("statsAvgVibe"), value: stats.avgVibeScore != null ? stats.avgVibeScore.toFixed(1) : "—", sub: "average vibe score", icon: <Radio className="w-4 h-4" /> },
    { label: t("statsAvgFit"), value: stats.avgBrandFitScore != null ? stats.avgBrandFitScore.toFixed(1) : "—", sub: "brand alignment score", icon: <Target className="w-4 h-4" /> },
    { label: t("topCategory"), value: stats.topCategory, sub: "most analyzed niche", icon: <Award className="w-4 h-4" /> },
  ] : null;

  return (
    <section className="border-b border-border bg-card/30" data-testid="stats-bar">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1 h-4 bg-primary rounded inline-block" />
          <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-foreground">Platform Stats</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isLoading || !statItems
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="border border-border rounded bg-card p-5 animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-2/3" />
                  <div className="h-2.5 bg-muted rounded w-3/4" />
                </div>
              ))
            : statItems.map((item, i) => (
                <div key={i} className="border border-border rounded bg-card p-5 hover:border-primary/30 transition-colors" data-testid={`stat-item-${i}`}>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground mb-2">
                    <span className="text-primary">{item.icon}</span>{item.label}
                  </div>
                  <div className="font-mono font-bold text-foreground text-2xl leading-tight mb-1">{item.value}</div>
                  <div className="text-[11px] font-mono text-muted-foreground">{item.sub}</div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

function RecentAnalyses() {
  const { t } = useLocale();
  const { data: analyses, isLoading } = useListAnalyses();

  return (
    <section className="border-b border-border" data-testid="recent-analyses">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1 h-4 bg-primary rounded inline-block" />
          <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-foreground">{t("recentAnalyses")}</h2>
          {!isLoading && analyses && (
            <span className="ml-auto text-xs font-mono text-muted-foreground">{analyses.length} total</span>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-border rounded bg-card p-4 animate-pulse flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-muted rounded" />
                  <div className="space-y-1.5"><div className="h-3 bg-muted rounded w-28" /><div className="h-2.5 bg-muted rounded w-16" /></div>
                </div>
                <div className="flex gap-3"><div className="h-8 bg-muted rounded w-12" /><div className="h-8 bg-muted rounded w-12" /></div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!analyses || analyses.length === 0) && (
          <div className="border border-border rounded bg-card p-10 text-center">
            <div className="text-muted-foreground/40 font-mono text-3xl mb-2">[ ]</div>
            <div className="text-muted-foreground font-mono text-sm">No analyses yet. Run your first creator scan above.</div>
          </div>
        )}

        {!isLoading && analyses && analyses.length > 0 && (
          <div className="space-y-2">
            {(analyses as AnalysisResult[]).map((a) => {
              const overall = getOverallRating(a.vibeScore, a.brandFitScore);
              const initials = a.handle.replace("@", "").slice(0, 2).toUpperCase();
              return (
                <div key={a.id} className="border border-border rounded bg-card p-4 hover:border-primary/30 transition-colors" data-testid={`analysis-row-${a.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded border border-border bg-muted flex items-center justify-center font-mono font-bold text-foreground text-xs flex-shrink-0">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-foreground">{a.handle}</span>
                        <span className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">{a.category}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${overall.border} ${overall.color}`}>{overall.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {a.badges.slice(0, 2).map((b) => <BadgePillSmall key={b.id} badge={b} t={t} />)}
                        {a.badges.length > 2 && <span className="text-[10px] font-mono text-muted-foreground">+{a.badges.length - 2} more</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 text-right">
                      <div><div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Vibe</div><div className="font-mono font-bold text-primary text-lg leading-tight">{a.vibeScore}</div></div>
                      <div><div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{t("brandFit")}</div><div className="font-mono font-bold text-foreground text-lg leading-tight">{a.brandFitScore}</div></div>
                      <div className="hidden sm:block"><div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Eng.</div><div className="font-mono font-bold text-foreground text-lg leading-tight">{a.engagementRate != null ? `${a.engagementRate}%` : "—"}</div></div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-muted-foreground border-t border-border pt-2.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(a.createdAt).toLocaleString()}</span>
                    <span className="text-border mx-1">·</span>
                    <span>{a.audienceSize ?? "—"} audience</span>
                    <span className="text-border mx-1">·</span>
                    <span>{a.locale === "bharat" ? "Bharat Edition" : "Global"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="border-b border-border bg-primary/5" data-testid="cta-banner">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-mono font-bold text-foreground text-lg mb-1">Ready to scan your next creator?</div>
          <div className="text-sm font-mono text-muted-foreground">Drop a handle above and get your full cultural alignment report in 2 seconds.</div>
        </div>
        <a href="#analyze" className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono font-bold text-sm rounded hover:opacity-90 transition-opacity">
          Run a Scan <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer data-testid="footer">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-primary font-mono font-bold text-lg tracking-tighter">OFF/BEAT</span>
              <span className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">Creator Sync</span>
            </div>
            <div className="text-xs font-mono text-muted-foreground">Cultural alignment scoring for music & creator brands.</div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <span className="text-primary text-xs font-mono">Built from scratch.</span>
            <span className="text-xs font-mono text-muted-foreground">© 2026 OFF/BEAT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <FeaturesGrid />
        <BadgeTierSection />
        <AnalyzeSection />
        <StatsBar />
        <RecentAnalyses />
        <CtaBanner />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="offbeat-theme">
        <LocaleProvider>
          <AppContent />
        </LocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
