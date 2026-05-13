import { useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
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
import { Sun, Moon, Zap, TrendingUp, Users, Star, Award, Globe } from "lucide-react";

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

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2" data-testid={`score-ring-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" strokeWidth="6" className="stroke-muted" />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            strokeWidth="6"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold font-mono" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

function BadgePill({ badge, t }: { badge: Badge; t: (key: string) => string }) {
  const tierColors: Record<string, string> = {
    bronze: "border-orange-500/40 bg-orange-500/10 text-orange-400",
    silver: "border-slate-400/40 bg-slate-400/10 text-slate-300",
    gold: "border-yellow-400/40 bg-yellow-400/10 text-yellow-400",
    platinum: "border-primary/40 bg-primary/10 text-primary",
  };

  const labelKey = badge.label.toLowerCase().replace(/\s/g, "");
  const badgeLabelKeys: Record<string, string> = {
    "risingstar": "risingStar",
    "culturalicon": "culturalIcon",
    "vibesetter": "vibeSetter",
    "trendbreaker": "trendBreaker",
    "crowdmagnet": "crowdMagnet",
    "undergroundlegend": "undergroundLegend",
  };
  const translated = badgeLabelKeys[labelKey] ? t(badgeLabelKeys[labelKey]) : badge.label;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-mono font-medium ${tierColors[badge.tier] || tierColors.bronze}`}
      data-testid={`badge-${badge.id}`}
      title={badge.description}
    >
      <Star className="w-3 h-3" />
      {translated}
    </span>
  );
}

function Navbar() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm" data-testid="navbar">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono font-bold text-lg tracking-tighter" data-testid="brand-logo">
            OFF/BEAT
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground font-mono uppercase tracking-widest border border-border px-1.5 py-0.5 rounded">
            Creator Sync
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="locale-toggle"
            onClick={() => setLocale(locale === "global" ? "bharat" : "global")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border hover:border-primary/50 transition-colors text-xs font-mono text-muted-foreground hover:text-foreground"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === "global" ? t("globalMode") : t("bharatMode")}</span>
          </button>
          <button
            data-testid="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded border border-border hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const { t } = useLocale();
  return (
    <section className="pt-20 pb-16 px-4 max-w-5xl mx-auto" data-testid="hero-section">
      <div className="max-w-2xl">
        <div className="inline-block text-xs font-mono uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-3 py-1 rounded mb-6">
          {t("buildFromScratch")}
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold leading-tight mb-4 tracking-tight">
          <span className="text-foreground">Creator</span>
          <span className="text-primary">—</span>
          <br />
          <span className="text-foreground">Brand</span>
          <br />
          <span className="text-primary">Sync.</span>
        </h1>
        <p className="text-muted-foreground font-mono text-sm sm:text-base leading-relaxed max-w-lg">
          {t("tagline")}
        </p>
        <div className="mt-6 flex items-center gap-3 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI-Powered
          </span>
          <span className="text-border">|</span>
          <span>Real-time scoring</span>
          <span className="text-border">|</span>
          <span>Culture-first</span>
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
    <section className="px-4 max-w-5xl mx-auto mb-16" data-testid="analyze-section">
      <div className="border border-border rounded-sm bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-foreground">
            {t("analyzeTitle")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2" data-testid="analyze-form">
          <input
            data-testid="input-handle"
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={t("handlePlaceholder")}
            className="flex-1 bg-background border border-border rounded-sm px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            disabled={mutation.isPending}
          />
          <button
            data-testid="button-analyze"
            type="submit"
            disabled={mutation.isPending || !handle.trim()}
            className="px-5 py-2.5 bg-primary text-primary-foreground font-mono font-bold text-sm rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {t("analyzing")}
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Run
              </>
            )}
          </button>
        </form>

        {mutation.isPending && (
          <div className="mt-6 border border-border rounded-sm bg-background p-6" data-testid="analyzing-state">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                {t("analyzing")}
              </span>
            </div>
            <div className="space-y-2">
              {["Fetching creator data", "Running vibe analysis", "Scoring brand fit", "Generating badges"].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 h-1.5 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded animate-pulse"
                      style={{ width: `${Math.random() * 60 + 20}%`, animationDelay: `${i * 0.2}s` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && !mutation.isPending && (
          <div className="mt-6 border border-primary/20 rounded-sm bg-background p-6 animate-in fade-in slide-in-from-bottom-2 duration-500" data-testid="analysis-result">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-mono font-bold text-foreground text-lg" data-testid="result-handle">{result.handle}</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">{result.category} — {result.locale === "bharat" ? "Bharat Edition" : "Global"}</div>
              </div>
              <div className="text-xs font-mono border border-primary/30 text-primary px-2 py-1 rounded">
                {result.audienceSize}
              </div>
            </div>

            <div className="flex gap-8 mb-6 justify-center">
              <ScoreRing
                score={result.vibeScore}
                label="Vibe Match"
                color="hsl(84 100% 59%)"
              />
              <ScoreRing
                score={result.brandFitScore}
                label={t("brandFit")}
                color={result.locale === "bharat" ? "hsl(243 75% 59%)" : "hsl(84 100% 59%)"}
              />
            </div>

            {result.engagementRate != null && (
              <div className="flex items-center gap-2 mb-4 text-xs font-mono text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span>Engagement rate: <span className="text-foreground font-bold">{result.engagementRate}%</span></span>
              </div>
            )}

            <div className="flex flex-wrap gap-2" data-testid="result-badges">
              {result.badges.map((badge) => (
                <BadgePill key={badge.id} badge={badge} t={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StatsBar() {
  const { t } = useLocale();
  const { data: stats, isLoading } = useGetAnalysisStats();

  if (isLoading || !stats) {
    return (
      <section className="px-4 max-w-5xl mx-auto mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border border-border rounded-sm bg-card p-4 animate-pulse">
              <div className="h-3 bg-muted rounded w-2/3 mb-2" />
              <div className="h-6 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const statItems = [
    { label: t("statsTotal"), value: stats.totalAnalyses, icon: <Users className="w-3.5 h-3.5" /> },
    { label: t("statsAvgVibe"), value: stats.avgVibeScore?.toFixed(0) ?? "—", icon: <Zap className="w-3.5 h-3.5" /> },
    { label: t("statsAvgFit"), value: stats.avgBrandFitScore?.toFixed(0) ?? "—", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { label: t("topCategory"), value: stats.topCategory, icon: <Award className="w-3.5 h-3.5" /> },
  ];

  return (
    <section className="px-4 max-w-5xl mx-auto mb-10" data-testid="stats-bar">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map((item, i) => (
          <div key={i} className="border border-border rounded-sm bg-card p-4" data-testid={`stat-item-${i}`}>
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground mb-1">
              <span className="text-primary">{item.icon}</span>
              {item.label}
            </div>
            <div className="font-mono font-bold text-foreground text-xl">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentAnalyses() {
  const { t } = useLocale();
  const { data: analyses, isLoading } = useListAnalyses();

  return (
    <section className="px-4 max-w-5xl mx-auto mb-16" data-testid="recent-analyses">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block w-1 h-4 bg-primary rounded" />
        <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-foreground">
          {t("recentAnalyses")}
        </h2>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-border rounded-sm bg-card p-4 animate-pulse flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-3 bg-muted rounded w-32" />
                <div className="h-2 bg-muted rounded w-20" />
              </div>
              <div className="h-6 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!analyses || analyses.length === 0) && (
        <div className="border border-border rounded-sm bg-card p-8 text-center text-muted-foreground font-mono text-sm">
          No analyses yet. Run your first creator scan above.
        </div>
      )}

      {!isLoading && analyses && analyses.length > 0 && (
        <div className="space-y-2">
          {(analyses as AnalysisResult[]).map((a) => (
            <div key={a.id} className="border border-border rounded-sm bg-card p-4 hover:border-primary/30 transition-colors" data-testid={`analysis-row-${a.id}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-mono font-bold text-sm text-foreground">{a.handle}</div>
                    <div className="text-xs font-mono text-muted-foreground">{a.category} — {a.locale === "bharat" ? "Bharat" : "Global"}</div>
                  </div>
                  <div className="hidden sm:flex gap-1.5 flex-wrap">
                    {a.badges.slice(0, 2).map((b) => (
                      <BadgePill key={b.id} badge={b} t={t} />
                    ))}
                    {a.badges.length > 2 && (
                      <span className="text-xs font-mono text-muted-foreground">+{a.badges.length - 2}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground">Vibe</div>
                    <div className="font-mono font-bold text-primary">{a.vibeScore}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground">{t("brandFit")}</div>
                    <div className="font-mono font-bold text-foreground">{a.brandFitScore}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-4 py-6 max-w-5xl mx-auto" data-testid="footer">
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>OFF/BEAT &copy; 2026 — Creator-Brand Sync</span>
        <span className="text-primary">Built from scratch.</span>
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
        <AnalyzeSection />
        <StatsBar />
        <RecentAnalyses />
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
