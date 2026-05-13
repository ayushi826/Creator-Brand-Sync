import { createContext, useContext, useState, ReactNode } from "react";

type Locale = "global" | "bharat";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  global: {
    /* nav */
    globalMode: "Global Edition",
    bharatMode: "Bharat Edition",
    creatorSync: "Creator Sync",

    /* hero */
    buildFromScratch: "Build from Scratch",
    heroLine1: "Creator—",
    heroLine2: "Brand",
    heroLine3: "Sync.",
    tagline: "Sync creators to your brand's raw frequency.",
    heroSub: "Drop a creator handle, get an instant cultural alignment score — no spreadsheets, no guesswork.",
    pill1: "AI Engine",
    pill2: "Real-time scoring",
    pill3: "Culture-first",
    pill4: "Free to use",
    terminalTitle: "offbeat-sync — analysis engine",
    terminalVibeLabel: "Vibe Score:",
    terminalFitLabel: "Brand Fit:",
    terminalBadges: "Badges: Cultural Icon, Platinum Creator",

    /* how it works */
    howTitle: "How It Works",
    step1Title: "Drop a Handle",
    step1Desc: "Enter any creator's social handle — Instagram, TikTok, YouTube. No API key, no login required.",
    step2Title: "AI Engine Runs",
    step2Desc: "Our mock AI crawls cultural signals, community vibes, content patterns, and audience energy in ~2 seconds.",
    step3Title: "Get the Full Report",
    step3Desc: "Vibe Match, Brand Fit scores, a 6-axis radar profile, trait breakdown, and gamification badges by tier.",

    /* features */
    featuresTitle: "What You Get",
    featuresCount: "6 signals analyzed",
    feat1Title: "Vibe Match Score",
    feat1Desc: "0–100 score measuring cultural resonance between creator content and your brand's aesthetic.",
    feat2Title: "Brand Fit Index",
    feat2Desc: "Calculates how well the creator's audience aligns with your target demographic and brand values.",
    feat3Title: "6-Axis Radar Profile",
    feat3Desc: "Authenticity, Reach, Momentum, Resonance, Originality, Community — visualized in a radar chart.",
    feat4Title: "Gamification Badges",
    feat4Desc: "Bronze to Platinum badge awards based on cultural footprint. Rising Star, Cultural Icon, and more.",
    feat5Title: "Engagement Analysis",
    feat5Desc: "Estimated engagement rate and audience size tier — surface signals before you go deeper.",
    feat6Title: "Bharat Edition",
    feat6Desc: "Switch to INR mode with translated badge labels and localized copy for the Indian creator market.",

    /* badge tiers */
    badgeTiersTitle: "Badge Tier System",
    badgeTiersMeta: "4 tiers · 8 badges total",
    tier_platinum_label: "Platinum Creator",
    tier_platinum_desc: "Top 1% — elite brand fit across all verticals",
    tier_platinum_count: "Rare",
    tier_gold_label: "Cultural Icon / Underground",
    tier_gold_desc: "Defines or disrupts culture at scale",
    tier_gold_count: "Top 10%",
    tier_silver_label: "Vibe Setter / Trend Breaker",
    tier_silver_desc: "Consistently shapes or challenges the narrative",
    tier_silver_count: "Top 25%",
    tier_bronze_label: "Rising Star / Crowd Magnet",
    tier_bronze_desc: "Gaining traction, real community energy",
    tier_bronze_count: "Entry",

    /* analyze */
    analyzeTitle: "Run a Creator Scan",
    analyzeEditionLabel: "Global Edition",
    handlePlaceholder: "@username",
    readyToScan: "Ready to scan",
    pressEnterHint: "↵ press Enter or click Run Scan",
    runScan: "Run Scan",
    scanning: "Scanning",
    emptyStateTitle: "Enter a creator handle above to run your first scan",
    analyzing: "Analyzing",

    /* result */
    scoreBreakdown: "Score Breakdown",
    creatorRadar: "Creator Radar",
    traitBreakdown: "Trait Breakdown",
    awards: "Awards",
    badgesEarned: "badge earned",
    badgesEarnedPlural: "badges earned",

    /* stats */
    statsTitle: "Platform Stats",
    statsTotal: "Total Analyses",
    statsLast24h: "in last 24h",
    statsAvgVibe: "Avg Vibe",
    statsAvgVibeDesc: "average vibe score",
    statsAvgFit: "Avg Fit",
    statsAvgFitDesc: "brand alignment score",
    topCategory: "Top Category",
    topCategoryDesc: "most analyzed niche",

    /* recent */
    recentAnalyses: "Recent Analyses",
    noAnalyses: "No analyses yet. Run your first creator scan above.",
    audience: "audience",

    /* overall ratings */
    eliteMatch: "Elite Match",
    strongFit: "Strong Fit",
    moderateFit: "Moderate Fit",
    lowAlignment: "Low Alignment",

    /* cta */
    ctaTitle: "Ready to scan your next creator?",
    ctaDesc: "Drop a handle and get the full cultural alignment report in 2 seconds.",
    ctaButton: "Run a Scan",

    /* footer */
    footerTagline: "Cultural alignment scoring for music & creator brands.",
    footerBuilt: "Built from scratch.",
    footerCopy: "© 2026 OFF/BEAT",

    /* badges */
    brandFit: "Brand Fit",
    risingStar: "Rising Star",
    culturalIcon: "Cultural Icon",
    vibeSetter: "Vibe Setter",
    trendBreaker: "Trend Breaker",
    crowdMagnet: "Crowd Magnet",
    undergroundLegend: "Underground Legend",
    currency: "$",
  },

  bharat: {
    /* nav */
    globalMode: "Global Mode",
    bharatMode: "Bharat Edition",
    creatorSync: "Creator Sync",

    /* hero */
    buildFromScratch: "Suru Se Shuru",
    heroLine1: "Creator—",
    heroLine2: "Brand",
    heroLine3: "Sync.",
    tagline: "Creators ko apni brand ke vibe se sync karo.",
    heroSub: "Creator ka handle daalo, turant cultural alignment score pao — koi spreadsheet nahi, koi andaza nahi.",
    pill1: "AI Engine",
    pill2: "Real-time Scoring",
    pill3: "Culture-first",
    pill4: "Bilkul Free",
    terminalTitle: "offbeat-sync — analysis engine",
    terminalVibeLabel: "Vibe Score:",
    terminalFitLabel: "Brand Fit:",
    terminalBadges: "Badges: Sanskriti Ka Raja, Platinum Creator",

    /* how it works */
    howTitle: "Kaise Kaam Karta Hai",
    step1Title: "Handle Daalo",
    step1Desc: "Kisi bhi creator ka social handle enter karo — Instagram, TikTok, YouTube. Koi API key nahi, koi login nahi.",
    step2Title: "AI Engine Chalega",
    step2Desc: "Humara mock AI cultural signals, community vibes, content patterns, aur audience energy ~2 seconds mein analyse karta hai.",
    step3Title: "Poori Report Lo",
    step3Desc: "Vibe Match, Brand Fit score, 6-axis radar profile, trait breakdown, aur tier-wise gamification badges milenge.",

    /* features */
    featuresTitle: "Kya Milega",
    featuresCount: "6 signals analysed",
    feat1Title: "Vibe Match Score",
    feat1Desc: "0–100 score jo creator content aur brand aesthetic ke beech cultural resonance measure karta hai.",
    feat2Title: "Brand Sahi Hai Index",
    feat2Desc: "Creator ki audience aur tumhari target demographic ke beech alignment calculate karta hai.",
    feat3Title: "6-Axis Radar Profile",
    feat3Desc: "Authenticity, Reach, Momentum, Resonance, Originality, Community — radar chart mein visualized.",
    feat4Title: "Gamification Badges",
    feat4Desc: "Cultural footprint ke basis par Bronze se Platinum tak badge awards. Naya Sitara, Sanskriti Ka Raja, aur zyada.",
    feat5Title: "Engagement Analysis",
    feat5Desc: "Estimated engagement rate aur audience size tier — aage jaane se pehle surface-level signals.",
    feat6Title: "Bharat Edition",
    feat6Desc: "INR mode mein switch karo, translated badge labels aur Indian creator market ke liye localized copy ke saath.",

    /* badge tiers */
    badgeTiersTitle: "Badge Tier System",
    badgeTiersMeta: "4 tier · 8 badges kul",
    tier_platinum_label: "Platinum Creator",
    tier_platinum_desc: "Top 1% — sabhi verticals mein elite brand fit",
    tier_platinum_count: "Rare",
    tier_gold_label: "Sanskriti Ka Raja / Gully Legend",
    tier_gold_desc: "Culture ko scale par define ya disrupt karta hai",
    tier_gold_count: "Top 10%",
    tier_silver_label: "Mahol Banane Wala / Trend Todne Wala",
    tier_silver_desc: "Lagatar narrative ko shape ya challenge karta hai",
    tier_silver_count: "Top 25%",
    tier_bronze_label: "Naya Sitara / Bheed Ka Magnet",
    tier_bronze_desc: "Traction aa rahi hai, asli community energy hai",
    tier_bronze_count: "Entry",

    /* analyze */
    analyzeTitle: "Creator Scan Chalao",
    analyzeEditionLabel: "Bharat Edition",
    handlePlaceholder: "@username",
    readyToScan: "Scan ke liye taiyar",
    pressEnterHint: "↵ Enter dabao ya Run Scan click karo",
    runScan: "Scan Chalao",
    scanning: "Jaanch Raha Hai",
    emptyStateTitle: "Creator ka handle upar enter karo pehla scan chalane ke liye",
    analyzing: "Jaanche ja raha hai",

    /* result */
    scoreBreakdown: "Score Breakdown",
    creatorRadar: "Creator Radar",
    traitBreakdown: "Trait Breakdown",
    awards: "Awards",
    badgesEarned: "badge mila",
    badgesEarnedPlural: "badges mile",

    /* stats */
    statsTitle: "Platform Stats",
    statsTotal: "Kul Analyses",
    statsLast24h: "pichle 24 ghante mein",
    statsAvgVibe: "Avg Vibe",
    statsAvgVibeDesc: "average vibe score",
    statsAvgFit: "Avg Fit",
    statsAvgFitDesc: "brand alignment score",
    topCategory: "Top Category",
    topCategoryDesc: "sabse zyada analysed niche",

    /* recent */
    recentAnalyses: "Pichle Analyses",
    noAnalyses: "Abhi koi analysis nahi. Upar pehla creator scan chalao.",
    audience: "audience",

    /* overall ratings */
    eliteMatch: "Zabardast Match",
    strongFit: "Accha Fit",
    moderateFit: "Theek-Thak Fit",
    lowAlignment: "Kam Alignment",

    /* cta */
    ctaTitle: "Agla creator scan karne ke liye taiyar ho?",
    ctaDesc: "Handle daalo aur 2 second mein poori cultural alignment report pao.",
    ctaButton: "Scan Chalao",

    /* footer */
    footerTagline: "Music aur creator brands ke liye cultural alignment scoring.",
    footerBuilt: "Suru se banaya.",
    footerCopy: "© 2026 OFF/BEAT",

    /* badges */
    brandFit: "Brand Sahi Hai",
    risingStar: "Naya Sitara",
    culturalIcon: "Sanskriti Ka Raja",
    vibeSetter: "Mahol Banane Wala",
    trendBreaker: "Trend Todne Wala",
    crowdMagnet: "Bheed Ka Magnet",
    undergroundLegend: "Gully Boy",
    currency: "₹",
  },
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("global");

  const t = (key: string): string => translations[locale][key] ?? key;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) throw new Error("useLocale must be used within a LocaleProvider");
  return context;
}
