import { useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  motion, AnimatePresence, useInView, useMotionValue,
  useSpring, useTransform, type Variants,
} from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { LocaleProvider, useLocale } from "@/components/locale-provider";
import {
  useAnalyzeCreator, useListAnalyses, useGetAnalysisStats,
  getListAnalysesQueryKey, getGetAnalysisStatsQueryKey,
} from "@workspace/api-client-react";
import {
  Sun, Moon, Zap, TrendingUp, Users, Award, Globe,
  Activity, Target, Radio, Flame, ShieldCheck, BarChart2,
  Clock, ChevronRight, Hash, ArrowRight, CheckCircle2,
  Scan, Layers, Trophy,
} from "lucide-react";

const queryClient = new QueryClient();

/* ─── types ─────────────────────────────────────────────────── */
type Badge = { id: string; label: string; tier: "bronze"|"silver"|"gold"|"platinum"; description?: string };
type AnalysisResult = {
  id: number; handle: string; vibeScore: number; brandFitScore: number;
  category: string; audienceSize?: string|null; engagementRate?: number|null;
  badges: Badge[]; locale: string; createdAt: string;
};

/* ─── helpers ───────────────────────────────────────────────── */
function getTierIcon(tier: Badge["tier"]) {
  if (tier === "platinum") return <ShieldCheck className="w-4 h-4" />;
  if (tier === "gold")     return <Award       className="w-4 h-4" />;
  if (tier === "silver")   return <Target      className="w-4 h-4" />;
  return <Flame className="w-4 h-4" />;
}
function getTierStyle(tier: Badge["tier"]) {
  if (tier === "platinum") return "border-primary/50 bg-primary/10 text-primary";
  if (tier === "gold")     return "border-yellow-400/50 bg-yellow-400/10 text-yellow-400";
  if (tier === "silver")   return "border-slate-300/40 bg-slate-300/10 text-slate-300";
  return "border-orange-500/50 bg-orange-500/10 text-orange-400";
}
function getOverallRating(v: number, f: number) {
  const s = (v + f) / 2;
  if (s >= 88) return { label:"Elite Match",    color:"text-primary",         border:"border-primary/40 bg-primary/10" };
  if (s >= 74) return { label:"Strong Fit",     color:"text-yellow-400",      border:"border-yellow-400/40 bg-yellow-400/10" };
  if (s >= 58) return { label:"Moderate Fit",   color:"text-orange-400",      border:"border-orange-400/40 bg-orange-400/10" };
  return              { label:"Low Alignment",  color:"text-muted-foreground", border:"border-border bg-muted/10" };
}
function deriveMetrics(r: AnalysisResult) {
  const e = r.engagementRate ?? 4;
  return [
    { key:"Authenticity", value: Math.min(100, Math.round(r.vibeScore*0.9 + e*1.5)) },
    { key:"Reach",        value: Math.min(100, Math.round(r.brandFitScore*0.8 + r.vibeScore*0.2)) },
    { key:"Momentum",     value: Math.min(100, Math.round(e*8.5 + r.vibeScore*0.15)) },
    { key:"Resonance",    value: Math.min(100, Math.round((r.vibeScore+r.brandFitScore)/2*0.95)) },
    { key:"Originality",  value: Math.min(100, Math.round(r.vibeScore*0.75 + r.brandFitScore*0.3)) },
    { key:"Community",    value: Math.min(100, Math.round(e*7 + r.brandFitScore*0.25)) },
  ];
}

/* ─── animation presets ─────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};
const stagger = (delay = 0.07): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay } },
});

function SectionReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className}
      initial="hidden" animate={inView ? "visible" : "hidden"}
      variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] } } }}>
      {children}
    </motion.div>
  );
}

/* ─── Animated counter ──────────────────────────────────────── */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 40, stiffness: 120 });
  const display = useTransform(spring, (v) => {
    if (Number.isInteger(value)) return Math.round(v).toString() + suffix;
    return v.toFixed(1) + suffix;
  });
  useEffect(() => { if (inView) mv.set(value); }, [inView, mv, value]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ─── Score ring ────────────────────────────────────────────── */
function ScoreRing({ score, label, size = "lg" }: { score: number; label: string; size?: "sm"|"lg" }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => { const t = setTimeout(() => setDisplayed(score), 120); return () => clearTimeout(t); }, [score]);
  const isLg = size === "lg";
  const dim = isLg ? 124 : 80; const r = isLg ? 50 : 30; const sw = isLg ? 7 : 5;
  const circ = 2 * Math.PI * r; const offset = circ - (displayed / 100) * circ;
  const cx = dim / 2; const cy = dim / 2;
  return (
    <div className="flex flex-col items-center gap-2" data-testid={`score-ring-${label.toLowerCase().replace(/\s/g,"-")}`}>
      <motion.div className="relative" style={{ width: dim, height: dim }}
        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}>
        <svg width={dim} height={dim} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw} className="stroke-muted" />
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw} className="stroke-primary"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition:"stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)", filter:"drop-shadow(0 0 6px hsl(var(--primary)/0.6))" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-bold text-primary ${isLg ? "text-3xl" : "text-xl"}`}>{displayed}</span>
          {isLg && <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">/100</span>}
        </div>
      </motion.div>
      <span className={`font-mono uppercase tracking-widest text-muted-foreground ${isLg?"text-xs":"text-[10px]"}`}>{label}</span>
    </div>
  );
}

/* ─── Metric bar ─────────────────────────────────────────────── */
function MetricBar({ label, value }: { label: string; value: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(value), 250); return () => clearTimeout(t); }, [value]);
  const color = value >= 80 ? "bg-primary" : value >= 60 ? "bg-yellow-400" : value >= 40 ? "bg-orange-400" : "bg-slate-500";
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs font-mono text-muted-foreground flex-shrink-0">{label}</div>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }} animate={{ width: `${width}%` }}
          transition={{ duration: 1, ease: [0.22,1,0.36,1], delay: 0.1 }} />
      </div>
      <div className="text-xs font-mono font-bold text-foreground w-7 text-right">{value}</div>
    </div>
  );
}

/* ─── Badge card / pill ─────────────────────────────────────── */
function BadgeCard({ badge, t }: { badge: Badge; t: (k:string)=>string }) {
  const keyMap: Record<string,string> = {
    "risingstar":"risingStar","culturalicon":"culturalIcon","vibesetter":"vibeSetter",
    "trendbreaker":"trendBreaker","crowdmagnet":"crowdMagnet","undergroundlegend":"undergroundLegend",
  };
  const translated = keyMap[badge.label.toLowerCase().replace(/\s/g,"")] ? t(keyMap[badge.label.toLowerCase().replace(/\s/g,"")]) : badge.label;
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}
      className={`flex items-start gap-2.5 border rounded-lg p-3 ${getTierStyle(badge.tier)}`}
      data-testid={`badge-${badge.id}`}>
      <div className="mt-0.5 flex-shrink-0">{getTierIcon(badge.tier)}</div>
      <div>
        <div className="font-mono font-bold text-sm leading-tight">{translated}</div>
        {badge.description && <div className="text-[11px] font-mono opacity-70 mt-0.5 leading-snug">{badge.description}</div>}
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mt-1">{badge.tier}</div>
      </div>
    </motion.div>
  );
}

function BadgePillSmall({ badge, t }: { badge: Badge; t: (k:string)=>string }) {
  const keyMap: Record<string,string> = {
    "risingstar":"risingStar","culturalicon":"culturalIcon","vibesetter":"vibeSetter",
    "trendbreaker":"trendBreaker","crowdmagnet":"crowdMagnet","undergroundlegend":"undergroundLegend",
  };
  const translated = keyMap[badge.label.toLowerCase().replace(/\s/g,"")] ? t(keyMap[badge.label.toLowerCase().replace(/\s/g,"")]) : badge.label;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-mono font-medium ${getTierStyle(badge.tier)}`}>
      {getTierIcon(badge.tier)}{translated}
    </span>
  );
}

/* ─── Analyzing state ───────────────────────────────────────── */
const STEPS = [
  { label:"Crawling creator profile",    dur:400 },
  { label:"Mapping cultural footprint",  dur:700 },
  { label:"Scoring vibe alignment",      dur:500 },
  { label:"Calculating brand fit",       dur:600 },
  { label:"Generating badge awards",     dur:400 },
  { label:"Compiling final report",      dur:400 },
];

function AnalyzingState({ handle }: { handle: string }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let s = 0, elapsed = 0;
    const total = STEPS.reduce((a,x) => a+x.dur, 0);
    const next = () => {
      if (s >= STEPS.length) return;
      setTimeout(() => { s++; elapsed += STEPS[s-1].dur; setStep(s); setProgress(Math.round((elapsed/total)*100)); next(); }, STEPS[s].dur);
    };
    next();
  }, []);
  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}
      className="mt-5 border border-border rounded-lg bg-background/60 p-5 backdrop-blur-sm" data-testid="analyzing-state">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ boxShadow:"0 0 8px hsl(var(--primary)/0.8)" }} />
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Analyzing {handle}</span>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{progress}%</span>
      </div>
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-5">
        <motion.div className="h-full bg-primary rounded-full"
          animate={{ width:`${progress}%` }} transition={{ duration:0.4, ease:"easeOut" }}
          style={{ boxShadow:"0 0 8px hsl(var(--primary)/0.6)" }} />
      </div>
      <div className="space-y-2">
        {STEPS.map((s,i) => (
          <motion.div key={i}
            animate={{ opacity: i < step ? 1 : i === step ? 1 : 0.3 }}
            className={`flex items-center gap-2.5 text-xs font-mono ${i < step ? "text-foreground" : i === step ? "text-primary" : "text-muted-foreground"}`}>
            <span className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
              {i < step
                ? <motion.span initial={{ scale:0 }} animate={{ scale:1 }} className="text-primary text-xs">✓</motion.span>
                : i === step
                ? <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" style={{ boxShadow:"0 0 6px hsl(var(--primary)/0.8)" }} />
                : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 inline-block" />}
            </span>
            {s.label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Result card ───────────────────────────────────────────── */
function ResultCard({ result, t }: { result: AnalysisResult; t: (k:string)=>string }) {
  const metrics = deriveMetrics(result);
  const radarData = metrics.map((m) => ({ subject:m.key, A:m.value, fullMark:100 }));
  const overall = getOverallRating(result.vibeScore, result.brandFitScore);
  const initials = result.handle.replace("@","").slice(0,2).toUpperCase();
  const engFmt = result.engagementRate != null ? `${result.engagementRate}%` : "—";
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
      className="mt-5 border border-primary/30 rounded-xl bg-background overflow-hidden glow-primary"
      data-testid="analysis-result">
      <div className="h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
      <div className="p-6">
        {/* header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.1, type:"spring", stiffness:200 }}
              className="w-12 h-12 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center font-mono font-bold text-primary text-sm flex-shrink-0">
              {initials}
            </motion.div>
            <div>
              <div className="font-mono font-bold text-foreground text-lg leading-tight" data-testid="result-handle">{result.handle}</div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-md">{result.category}</span>
                <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-md flex items-center gap-1"><Users className="w-3 h-3" />{result.audienceSize??"-"}</span>
                <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-md flex items-center gap-1"><TrendingUp className="w-3 h-3" />{engFmt} eng.</span>
              </div>
            </div>
          </div>
          <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}
            className={`flex-shrink-0 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border ${overall.border} ${overall.color}`}>
            {overall.label}
          </motion.div>
        </div>

        {/* scores + radar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-1.5 mb-5">
              <Radio className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Score Breakdown</span>
            </div>
            <div className="flex gap-10">
              <ScoreRing score={result.vibeScore} label="Vibe Match" />
              <ScoreRing score={result.brandFitScore} label={t("brandFit")} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Creator Radar</span>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top:4, right:20, bottom:4, left:20 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize:9, fontFamily:"monospace", fill:"hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:8, fontSize:11, fontFamily:"monospace", color:"hsl(var(--foreground))" }} />
                  <Radar name="Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.18} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* trait bars */}
        <div className="border-t border-border pt-5 mb-5">
          <div className="flex items-center gap-1.5 mb-4">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Trait Breakdown</span>
          </div>
          <div className="space-y-3">
            {metrics.map((m) => <MetricBar key={m.key} label={m.key} value={m.value} />)}
          </div>
        </div>

        {/* badges */}
        <div className="border-t border-border pt-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Award className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Awards — {result.badges.length} badge{result.badges.length!==1?"s":""} earned
            </span>
          </div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            variants={stagger(0.08)} initial="hidden" animate="visible"
            data-testid="result-badges">
            {result.badges.map((b) => (
              <motion.div key={b.id} variants={fadeUp}>
                <BadgeCard badge={b} t={t} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Navbar ────────────────────────────────────────────────── */
function Navbar() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <motion.nav initial={{ y:-64 }} animate={{ y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
      className={`sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md transition-shadow duration-300 ${scrolled ? "shadow-lg shadow-black/20" : ""}`}
      data-testid="navbar">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-primary font-mono font-bold text-xl tracking-tighter" data-testid="brand-logo"
            style={{ textShadow:"0 0 20px hsl(var(--primary)/0.5)" }}>
            OFF/BEAT
          </span>
          <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono uppercase tracking-widest border border-border px-1.5 py-0.5 rounded">
            Creator Sync
          </span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            data-testid="locale-toggle" onClick={() => setLocale(locale==="global"?"bharat":"global")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary/60 hover:text-foreground transition-all duration-200 text-xs font-mono text-muted-foreground">
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{locale==="global" ? t("globalMode") : t("bharatMode")}</span>
          </motion.button>
          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            data-testid="theme-toggle" onClick={() => setTheme(theme==="dark"?"light":"dark")}
            className="p-2 rounded-lg border border-border hover:border-primary/60 transition-all duration-200 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme">
            <AnimatePresence mode="wait">
              <motion.div key={theme} initial={{ rotate:-90, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:90, opacity:0 }} transition={{ duration:0.2 }}>
                {theme==="dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

/* ─── Hero ──────────────────────────────────────────────────── */
const TICKER_HANDLES = [
  "@wavecult","@neondelhi","@retrofuture","@citysound","@undergroundmx",
  "@beatdropnyc","@vibelab","@bassline99","@hiphopgate","@cultureOS",
];

function HeroSection() {
  const { t } = useLocale();
  const [tickerIdx, setTickerIdx] = useState(0);
  useEffect(() => { const id = setInterval(() => setTickerIdx((i)=>(i+1)%TICKER_HANDLES.length), 2200); return ()=>clearInterval(id); }, []);

  const words = ["Creator—", "Brand", "Sync."];

  return (
    <section className="relative border-b border-border overflow-hidden" data-testid="hero-section">
      {/* subtle grid bg */}
      <div className="absolute inset-0 grid-bg opacity-100 pointer-events-none" />
      {/* glow blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.5 }}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-3 py-1.5 rounded-full mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ boxShadow:"0 0 6px hsl(var(--primary))" }} />
            {t("buildFromScratch")}
          </motion.div>

          <div className="mb-5">
            {words.map((word, i) => (
              <motion.div key={word}
                initial={{ opacity:0, x:-24 }} animate={{ opacity:1, x:0 }}
                transition={{ delay:0.2+i*0.1, duration:0.55, ease:[0.22,1,0.36,1] }}>
                <span className={`block font-mono font-bold leading-[1.05] tracking-tight text-5xl sm:text-6xl ${word==="Sync." ? "text-primary" : "text-foreground"}`}
                  style={word==="Sync." ? { textShadow:"0 0 40px hsl(var(--primary)/0.4)" } : {}}>
                  {word}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.55, duration:0.5 }}
            className="text-muted-foreground font-mono text-sm leading-relaxed max-w-md mb-7">
            {t("tagline")} Drop a creator handle, get an instant cultural alignment score — no spreadsheets, no guesswork.
          </motion.p>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.65, duration:0.5 }}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-muted-foreground">
            {["AI Engine","Real-time scoring","Culture-first","Free to use"].map((tag, i) => (
              <span key={tag} className="flex items-center gap-1.5">
                {i===0 && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ boxShadow:"0 0 4px hsl(var(--primary))" }} />}
                {i>0 && <span className="text-border">·</span>}
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Terminal mock */}
        <motion.div initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }}
          transition={{ delay:0.3, duration:0.6, ease:[0.22,1,0.36,1] }}
          className="relative border border-border rounded-xl bg-card overflow-hidden terminal-scanline"
          style={{ boxShadow:"0 0 40px hsl(var(--primary)/0.08)" }}>
          <div className="border-b border-border px-4 py-2.5 flex items-center gap-2 bg-muted/30">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/80" style={{ boxShadow:"0 0 6px hsl(var(--primary)/0.8)" }} />
            <span className="text-muted-foreground ml-2 text-[11px] font-mono">offbeat-sync — analysis engine</span>
          </div>
          <div className="p-4 font-mono text-xs space-y-2">
            <div className="text-muted-foreground flex items-center gap-2">
              <span>$ run analyze</span>
              <AnimatePresence mode="wait">
                <motion.span key={tickerIdx}
                  initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
                  transition={{ duration:0.25 }} className="text-primary" style={{ textShadow:"0 0 8px hsl(var(--primary)/0.7)" }}>
                  {TICKER_HANDLES[tickerIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="text-muted-foreground/60">→ Crawling profile...</div>
            <div className="text-muted-foreground/60">→ Mapping cultural footprint...</div>
            <div className="text-foreground">→ Vibe Score: <span className="text-primary font-bold" style={{ textShadow:"0 0 8px hsl(var(--primary)/0.6)" }}>87/100</span></div>
            <div className="text-foreground">→ Brand Fit: <span className="text-primary font-bold" style={{ textShadow:"0 0 8px hsl(var(--primary)/0.6)" }}>91/100</span></div>
            <div className="text-muted-foreground/60">→ Badges: Cultural Icon, Platinum Creator</div>
            <span className="text-primary cursor-blink" style={{ textShadow:"0 0 8px hsl(var(--primary)/0.8)" }}>_</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How It Works ──────────────────────────────────────────── */
const HOW_STEPS = [
  { step:"01", icon:<Hash className="w-5 h-5" />, title:"Drop a Handle", desc:"Enter any creator's social handle — Instagram, TikTok, YouTube. No API key, no login required." },
  { step:"02", icon:<Scan className="w-5 h-5" />, title:"AI Engine Runs", desc:"Our mock AI crawls cultural signals, community vibes, content patterns, and audience energy in ~2 seconds." },
  { step:"03", icon:<Layers className="w-5 h-5" />, title:"Get the Full Report", desc:"Vibe Match, Brand Fit scores, a 6-axis radar profile, trait breakdown, and gamification badges by tier." },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:"-80px" });
  return (
    <section className="border-b border-border bg-card/20" data-testid="how-it-works">
      <div className="max-w-5xl mx-auto px-4 py-14">
        <SectionReveal className="flex items-center gap-2 mb-10">
          <span className="w-1 h-4 bg-primary rounded inline-block" style={{ boxShadow:"0 0 8px hsl(var(--primary)/0.8)" }} />
          <h2 className="font-mono font-bold text-sm uppercase tracking-widest">How It Works</h2>
        </SectionReveal>
        <motion.div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden"
          variants={stagger(0.1)} initial="hidden" animate={inView?"visible":"hidden"}>
          {HOW_STEPS.map((item) => (
            <motion.div key={item.step} variants={fadeUp}
              className="bg-background p-6 flex flex-col gap-4 group hover:bg-card/60 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <motion.div whileHover={{ scale:1.1, rotate:5 }} transition={{ duration:0.2 }}
                  className="p-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary group-hover:border-primary/60 group-hover:bg-primary/15 transition-all duration-300">
                  {item.icon}
                </motion.div>
                <span className="font-mono text-4xl font-bold text-muted-foreground/15 group-hover:text-muted-foreground/25 transition-colors duration-300">{item.step}</span>
              </div>
              <div>
                <div className="font-mono font-bold text-foreground mb-2">{item.title}</div>
                <div className="text-xs font-mono text-muted-foreground leading-relaxed">{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Features Grid ─────────────────────────────────────────── */
const FEATURES = [
  { icon:<Radio className="w-4 h-4" />, title:"Vibe Match Score",    desc:"0–100 score measuring cultural resonance between creator content and your brand's aesthetic." },
  { icon:<Target className="w-4 h-4" />, title:"Brand Fit Index",    desc:"Calculates how well the creator's audience aligns with your target demographic and brand values." },
  { icon:<BarChart2 className="w-4 h-4" />, title:"6-Axis Radar Profile", desc:"Authenticity, Reach, Momentum, Resonance, Originality, Community — visualized in a radar chart." },
  { icon:<Trophy className="w-4 h-4" />, title:"Gamification Badges", desc:"Bronze to Platinum badge awards based on cultural footprint. Rising Star, Cultural Icon, and more." },
  { icon:<Activity className="w-4 h-4" />, title:"Engagement Analysis", desc:"Estimated engagement rate and audience size tier — surface signals before you go deeper." },
  { icon:<Globe className="w-4 h-4" />, title:"Bharat Edition",      desc:"Switch to INR mode with translated badge labels and localized copy for the Indian creator market." },
];

function FeaturesGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:"-80px" });
  return (
    <section className="border-b border-border" data-testid="features-grid">
      <div className="max-w-5xl mx-auto px-4 py-14">
        <SectionReveal className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded inline-block" style={{ boxShadow:"0 0 8px hsl(var(--primary)/0.8)" }} />
            <h2 className="font-mono font-bold text-sm uppercase tracking-widest">What You Get</h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{FEATURES.length} signals analyzed</span>
        </SectionReveal>
        <motion.div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          variants={stagger(0.07)} initial="hidden" animate={inView?"visible":"hidden"}>
          {FEATURES.map((f, i) => (
            <motion.div key={i} variants={fadeUp}>
              <motion.div whileHover={{ y:-3, boxShadow:"0 8px 30px hsl(var(--primary)/0.1)" }}
                transition={{ duration:0.2 }}
                className="border border-border rounded-xl bg-card p-5 h-full group cursor-default transition-colors duration-200 hover:border-primary/30">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-1.5 rounded-lg border border-border bg-background text-primary group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                    {f.icon}
                  </div>
                  <span className="font-mono font-bold text-sm text-foreground">{f.title}</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Badge Tiers ───────────────────────────────────────────── */
const BADGE_TIERS = [
  { tier:"platinum" as const, label:"Platinum Creator",             desc:"Top 1% — elite brand fit across all verticals",           count:"Rare" },
  { tier:"gold"     as const, label:"Cultural Icon / Underground",  desc:"Defines or disrupts culture at scale",                    count:"Top 10%" },
  { tier:"silver"   as const, label:"Vibe Setter / Trend Breaker",  desc:"Consistently shapes or challenges the narrative",         count:"Top 25%" },
  { tier:"bronze"   as const, label:"Rising Star / Crowd Magnet",   desc:"Gaining traction, real community energy",                 count:"Entry" },
];

function BadgeTierSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:"-80px" });
  return (
    <section className="border-b border-border bg-card/20" data-testid="badge-tiers">
      <div className="max-w-5xl mx-auto px-4 py-14">
        <SectionReveal className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded inline-block" style={{ boxShadow:"0 0 8px hsl(var(--primary)/0.8)" }} />
            <h2 className="font-mono font-bold text-sm uppercase tracking-widest">Badge Tier System</h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">4 tiers · 8 badges total</span>
        </SectionReveal>
        <motion.div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          variants={stagger(0.09)} initial="hidden" animate={inView?"visible":"hidden"}>
          {BADGE_TIERS.map((b) => (
            <motion.div key={b.tier} variants={fadeUp}>
              <motion.div whileHover={{ y:-4, scale:1.02 }} transition={{ duration:0.2 }}
                className={`border rounded-xl p-4 flex flex-col gap-2.5 h-full ${getTierStyle(b.tier)} cursor-default`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">{getTierIcon(b.tier)}<span className="font-mono font-bold text-xs uppercase tracking-widest">{b.tier}</span></div>
                  <span className="text-[10px] font-mono opacity-60 border border-current/30 px-1.5 py-0.5 rounded">{b.count}</span>
                </div>
                <div className="font-mono font-bold text-sm leading-tight">{b.label}</div>
                <div className="text-[11px] font-mono opacity-70 leading-snug">{b.desc}</div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Analyze section ───────────────────────────────────────── */
function AnalyzeSection() {
  const { locale, t } = useLocale();
  const [handle, setHandle] = useState("");
  const [result, setResult] = useState<AnalysisResult|null>(null);
  const [focused, setFocused] = useState(false);
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
      <div className="max-w-5xl mx-auto px-4 py-14">
        <SectionReveal className="flex items-center gap-2 mb-8">
          <span className="w-1 h-4 bg-primary rounded inline-block" style={{ boxShadow:"0 0 8px hsl(var(--primary)/0.8)" }} />
          <h2 className="font-mono font-bold text-sm uppercase tracking-widest">Run a Creator Scan</h2>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-md">
            {locale==="bharat" ? "Bharat Edition" : "Global Edition"}
          </span>
        </SectionReveal>

        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ duration:0.55, ease:[0.22,1,0.36,1] }}
          className="border border-border rounded-xl bg-card overflow-hidden"
          style={{ boxShadow: focused ? "0 0 0 1px hsl(var(--primary)/0.3), 0 0 30px hsl(var(--primary)/0.08)" : undefined, transition:"box-shadow 0.3s ease" }}>

          <div className="p-5 border-b border-border bg-background/40">
            <form onSubmit={handleSubmit} className="flex gap-2" data-testid="analyze-form">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input data-testid="input-handle" type="text" value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  placeholder={t("handlePlaceholder")}
                  className="input-glow w-full bg-background border border-border rounded-lg pl-9 pr-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200"
                  disabled={mutation.isPending} />
              </div>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                data-testid="button-analyze" type="submit" disabled={mutation.isPending || !handle.trim()}
                className="px-6 py-3 bg-primary text-primary-foreground font-mono font-bold text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap transition-all duration-200"
                style={{ boxShadow: handle.trim() && !mutation.isPending ? "0 0 20px hsl(var(--primary)/0.4)" : undefined }}>
                {mutation.isPending
                  ? <><span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Scanning</>
                  : <><Zap className="w-3.5 h-3.5" />Run Scan</>}
              </motion.button>
            </form>
            <AnimatePresence>
              {handle.length>0 && !mutation.isPending && !result && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  className="mt-2 overflow-hidden">
                  <div className="text-xs font-mono text-muted-foreground pt-1">
                    Ready to scan <span className="text-foreground">{handle.startsWith("@")?handle:`@${handle}`}</span>
                    <span className="ml-3 text-primary">↵ press Enter or click Run Scan</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-5">
            <AnimatePresence mode="wait">
              {!mutation.isPending && !result && (
                <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="py-10 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-full border border-border bg-muted/20 flex items-center justify-center text-muted-foreground/40">
                    <Scan className="w-6 h-6" />
                  </div>
                  <div className="font-mono text-sm text-muted-foreground">Enter a creator handle above to run your first scan</div>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-muted-foreground/60">
                    {["Vibe score","Brand fit","Badges","Radar chart","Trait breakdown"].map((f) => (
                      <span key={f} className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary" />{f}</span>
                    ))}
                  </div>
                </motion.div>
              )}
              {mutation.isPending && (
                <AnalyzingState key="loading" handle={handle.startsWith("@")?handle:`@${handle}`} />
              )}
              {result && !mutation.isPending && (
                <ResultCard key="result" result={result} t={t} />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Stats Bar ─────────────────────────────────────────────── */
function StatsBar() {
  const { t } = useLocale();
  const { data: stats, isLoading } = useGetAnalysisStats();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:"-60px" });

  const items = stats ? [
    { label:t("statsTotal"),   value:stats.totalAnalyses,                           sub:`${stats.recentCount} in last 24h`,   icon:<Users className="w-4 h-4" />,   isNum:true },
    { label:t("statsAvgVibe"), value:stats.avgVibeScore??0,                          sub:"average vibe score",                 icon:<Radio className="w-4 h-4" />,   isNum:true, dec:1 },
    { label:t("statsAvgFit"),  value:stats.avgBrandFitScore??0,                      sub:"brand alignment score",              icon:<Target className="w-4 h-4" />,  isNum:true, dec:1 },
    { label:t("topCategory"),  value:stats.topCategory,                              sub:"most analyzed niche",                icon:<Award className="w-4 h-4" />,   isNum:false },
  ] : null;

  return (
    <section className="border-b border-border bg-card/20" data-testid="stats-bar">
      <div className="max-w-5xl mx-auto px-4 py-14">
        <SectionReveal className="flex items-center gap-2 mb-8">
          <span className="w-1 h-4 bg-primary rounded inline-block" style={{ boxShadow:"0 0 8px hsl(var(--primary)/0.8)" }} />
          <h2 className="font-mono font-bold text-sm uppercase tracking-widest">Platform Stats</h2>
        </SectionReveal>
        <motion.div ref={ref} className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          variants={stagger(0.08)} initial="hidden" animate={inView&&!isLoading?"visible":"hidden"}>
          {isLoading || !items
            ? [...Array(4)].map((_,i) => (
                <div key={i} className="border border-border rounded-xl bg-card p-5 space-y-2">
                  <div className="h-3 skeleton rounded w-1/2" />
                  <div className="h-8 skeleton rounded w-2/3" />
                  <div className="h-2.5 skeleton rounded w-3/4" />
                </div>
              ))
            : items.map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <motion.div whileHover={{ y:-3, boxShadow:"0 8px 24px hsl(var(--primary)/0.08)" }}
                    transition={{ duration:0.2 }}
                    className="border border-border rounded-xl bg-card p-5 hover:border-primary/30 transition-colors duration-200 cursor-default"
                    data-testid={`stat-item-${i}`}>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground mb-2">
                      <span className="text-primary">{item.icon}</span>{item.label}
                    </div>
                    <div className="font-mono font-bold text-foreground text-2xl leading-tight mb-1">
                      {item.isNum && typeof item.value==="number"
                        ? <AnimatedNumber value={item.value} />
                        : item.value}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">{item.sub}</div>
                  </motion.div>
                </motion.div>
              ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Recent Analyses ───────────────────────────────────────── */
function RecentAnalyses() {
  const { t } = useLocale();
  const { data: analyses, isLoading } = useListAnalyses();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:"-60px" });

  return (
    <section className="border-b border-border" data-testid="recent-analyses">
      <div className="max-w-5xl mx-auto px-4 py-14">
        <SectionReveal className="flex items-center gap-2 mb-8">
          <span className="w-1 h-4 bg-primary rounded inline-block" style={{ boxShadow:"0 0 8px hsl(var(--primary)/0.8)" }} />
          <h2 className="font-mono font-bold text-sm uppercase tracking-widest">{t("recentAnalyses")}</h2>
          {!isLoading && analyses && <span className="ml-auto text-xs font-mono text-muted-foreground">{analyses.length} total</span>}
        </SectionReveal>

        {isLoading && (
          <div className="space-y-2">
            {[...Array(4)].map((_,i) => (
              <div key={i} className="border border-border rounded-xl bg-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 skeleton rounded-lg" />
                  <div className="space-y-2"><div className="h-3 skeleton rounded w-28" /><div className="h-2.5 skeleton rounded w-16" /></div>
                </div>
                <div className="flex gap-3"><div className="h-8 skeleton rounded w-12" /><div className="h-8 skeleton rounded w-12" /></div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!analyses||analyses.length===0) && (
          <div className="border border-border rounded-xl bg-card p-12 text-center">
            <div className="text-muted-foreground/30 font-mono text-4xl mb-3">[ ]</div>
            <div className="text-muted-foreground font-mono text-sm">No analyses yet. Run your first creator scan above.</div>
          </div>
        )}

        {!isLoading && analyses && analyses.length>0 && (
          <motion.div ref={ref} className="space-y-2"
            variants={stagger(0.06)} initial="hidden" animate={inView?"visible":"hidden"}>
            {(analyses as AnalysisResult[]).map((a) => {
              const overall = getOverallRating(a.vibeScore, a.brandFitScore);
              const initials = a.handle.replace("@","").slice(0,2).toUpperCase();
              return (
                <motion.div key={a.id} variants={fadeUp}>
                  <motion.div whileHover={{ x:3, borderColor:"hsl(var(--primary)/0.35)" }}
                    transition={{ duration:0.18 }}
                    className="border border-border rounded-xl bg-card p-4 cursor-default"
                    data-testid={`analysis-row-${a.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg border border-border bg-muted/50 flex items-center justify-center font-mono font-bold text-foreground text-xs flex-shrink-0">{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-foreground">{a.handle}</span>
                          <span className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded-md">{a.category}</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${overall.border} ${overall.color}`}>{overall.label}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {a.badges.slice(0,2).map((b) => <BadgePillSmall key={b.id} badge={b} t={t} />)}
                          {a.badges.length>2 && <span className="text-[10px] font-mono text-muted-foreground">+{a.badges.length-2} more</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 text-right">
                        <div><div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Vibe</div><div className="font-mono font-bold text-primary text-lg">{a.vibeScore}</div></div>
                        <div><div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{t("brandFit")}</div><div className="font-mono font-bold text-foreground text-lg">{a.brandFitScore}</div></div>
                        <div className="hidden sm:block"><div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Eng.</div><div className="font-mono font-bold text-foreground text-lg">{a.engagementRate!=null?`${a.engagementRate}%`:"—"}</div></div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 hidden sm:block" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-muted-foreground border-t border-border pt-2.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(a.createdAt).toLocaleString()}</span>
                      <span className="text-border">·</span>
                      <span>{a.audienceSize??"—"} audience</span>
                      <span className="text-border">·</span>
                      <span>{a.locale==="bharat"?"Bharat Edition":"Global"}</span>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ─── CTA Banner ────────────────────────────────────────────── */
function CtaBanner() {
  return (
    <section className="border-b border-border relative overflow-hidden" data-testid="cta-banner">
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-4 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <SectionReveal>
          <div className="font-mono font-bold text-foreground text-xl mb-1.5">Ready to scan your next creator?</div>
          <div className="text-sm font-mono text-muted-foreground">Drop a handle and get the full cultural alignment report in 2 seconds.</div>
        </SectionReveal>
        <motion.a href="#analyze" whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
          className="flex-shrink-0 flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-mono font-bold text-sm rounded-xl transition-all duration-200"
          style={{ boxShadow:"0 0 30px hsl(var(--primary)/0.4)" }}>
          Run a Scan <ArrowRight className="w-4 h-4" />
        </motion.a>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer data-testid="footer">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary font-mono font-bold text-lg tracking-tighter" style={{ textShadow:"0 0 12px hsl(var(--primary)/0.5)" }}>OFF/BEAT</span>
            <span className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">Creator Sync</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground">Cultural alignment scoring for music & creator brands.</div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1">
          <span className="text-primary text-xs font-mono">Built from scratch.</span>
          <span className="text-xs font-mono text-muted-foreground">© 2026 OFF/BEAT</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── Root ──────────────────────────────────────────────────── */
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
