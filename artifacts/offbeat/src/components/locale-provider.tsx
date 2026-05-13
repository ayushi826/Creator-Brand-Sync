import { createContext, useContext, useState, ReactNode } from "react";

type Locale = "global" | "bharat";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  global: {
    brandFit: "Brand Fit",
    risingStar: "Rising Star",
    culturalIcon: "Cultural Icon",
    vibeSetter: "Vibe Setter",
    trendBreaker: "Trend Breaker",
    crowdMagnet: "Crowd Magnet",
    undergroundLegend: "Underground Legend",
    currency: "$",
    analyzeTitle: "Analyze Creator",
    handlePlaceholder: "@username",
    analyzing: "Analyzing...",
    recentAnalyses: "Recent Analyses",
    statsTotal: "Total Analyses",
    statsAvgVibe: "Avg Vibe",
    statsAvgFit: "Avg Fit",
    topCategory: "Top Category",
    audienceSize: "Audience Size",
    engagementRate: "Engagement Rate",
    globalMode: "Global Edition",
    bharatMode: "Bharat Edition",
    buildFromScratch: "Build from Scratch",
    tagline: "Sync creators to your brand's raw frequency.",
  },
  bharat: {
    brandFit: "Brand Sahi Hai",
    risingStar: "Naya Sitara",
    culturalIcon: "Sanskriti Ka Raja",
    vibeSetter: "Mahol Banane Wala",
    trendBreaker: "Trend Todne Wala",
    crowdMagnet: "Bheed Ka Magnet",
    undergroundLegend: "Gully Boy",
    currency: "₹",
    analyzeTitle: "Creator Ka Analysis",
    handlePlaceholder: "@username",
    analyzing: "Jaanche ja raha hai...",
    recentAnalyses: "Pichle Analyses",
    statsTotal: "Total Analyses",
    statsAvgVibe: "Avg Vibe",
    statsAvgFit: "Avg Fit",
    topCategory: "Top Category",
    audienceSize: "Audience Size",
    engagementRate: "Engagement Rate",
    globalMode: "Global Mode",
    bharatMode: "Bharat Edition",
    buildFromScratch: "Suru Se Shuru",
    tagline: "Creators ko apni brand ke vibe se sync karo.",
  },
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("global");

  const t = (key: string) => {
    return translations[locale][key] || key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
