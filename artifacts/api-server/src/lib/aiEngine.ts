export type Badge = {
  id: string;
  label: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  description: string;
};

const CATEGORIES = ["Music", "Fashion", "Tech", "Film", "Art", "Gaming", "Fitness", "Food", "Travel", "Comedy"];

const AUDIENCE_SIZES = ["1K–10K", "10K–100K", "100K–500K", "500K–1M", "1M+"];

const ALL_BADGES: Array<Omit<Badge, "id">> = [
  { label: "Rising Star", tier: "bronze", description: "Fresh voice gaining traction in the scene" },
  { label: "Vibe Setter", tier: "silver", description: "Consistently shapes the cultural conversation" },
  { label: "Cultural Icon", tier: "gold", description: "Defines the aesthetic for an entire generation" },
  { label: "Trend Breaker", tier: "silver", description: "Moves against the grain and pulls the crowd along" },
  { label: "Crowd Magnet", tier: "bronze", description: "High engagement, real community energy" },
  { label: "Underground Legend", tier: "gold", description: "Cult following, authentic to the core" },
  { label: "Brand Amplifier", tier: "silver", description: "Proven record of boosting brand visibility" },
  { label: "Platinum Creator", tier: "platinum", description: "Top 1% creator — elite brand fit across all verticals" },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export type AnalysisInput = {
  handle: string;
  locale?: string;
};

export type AnalysisData = {
  handle: string;
  vibeScore: number;
  brandFitScore: number;
  category: string;
  audienceSize: string;
  engagementRate: number;
  badges: Badge[];
  locale: string;
};

export async function runAnalysis(input: AnalysisInput): Promise<AnalysisData> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const vibeScore = randomInt(42, 97);
  const brandFitScore = randomInt(38, 99);
  const category = pick(CATEGORIES);
  const audienceSize = pick(AUDIENCE_SIZES);
  const engagementRate = parseFloat((Math.random() * 9.5 + 0.5).toFixed(2));

  const badgeCount = randomInt(1, 3);
  const selectedBadges = pickN(ALL_BADGES, badgeCount);
  const badges: Badge[] = selectedBadges.map((b, i) => ({ ...b, id: `badge-${i}-${Date.now()}` }));

  if (vibeScore >= 90 && brandFitScore >= 88) {
    badges.push({ id: `badge-plat-${Date.now()}`, label: "Platinum Creator", tier: "platinum", description: "Top 1% creator — elite brand fit across all verticals" });
  }

  return {
    handle: input.handle,
    vibeScore,
    brandFitScore,
    category,
    audienceSize,
    engagementRate,
    badges,
    locale: input.locale ?? "global",
  };
}
