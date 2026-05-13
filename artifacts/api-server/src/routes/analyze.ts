import { Router, type IRouter } from "express";
import { db, analysesTable } from "@workspace/db";
import { desc, avg, count, sql } from "drizzle-orm";
import { runAnalysis } from "../lib/aiEngine";
import {
  AnalyzeCreatorBody,
  AnalyzeCreatorResponse,
  ListAnalysesResponse,
  GetAnalysisStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeCreatorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { handle, locale } = parsed.data;

  req.log.info({ handle, locale }, "Running creator analysis");

  const result = await runAnalysis({ handle, locale: locale ?? "global" });

  const [row] = await db
    .insert(analysesTable)
    .values({
      handle: result.handle,
      vibeScore: result.vibeScore,
      brandFitScore: result.brandFitScore,
      category: result.category,
      audienceSize: result.audienceSize,
      engagementRate: result.engagementRate,
      badges: result.badges,
      locale: result.locale,
    })
    .returning();

  res.json(AnalyzeCreatorResponse.parse(row));
});

router.get("/analyze", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(analysesTable)
    .orderBy(desc(analysesTable.createdAt))
    .limit(20);

  res.json(ListAnalysesResponse.parse(rows));
});

router.get("/analyze/stats", async (req, res): Promise<void> => {
  const [stats] = await db
    .select({
      totalAnalyses: count(),
      avgVibeScore: avg(analysesTable.vibeScore),
      avgBrandFitScore: avg(analysesTable.brandFitScore),
    })
    .from(analysesTable);

  const [topRow] = await db
    .select({
      category: analysesTable.category,
      cnt: count(),
    })
    .from(analysesTable)
    .groupBy(analysesTable.category)
    .orderBy(desc(count()))
    .limit(1);

  const [recentRow] = await db
    .select({ cnt: count() })
    .from(analysesTable)
    .where(sql`${analysesTable.createdAt} > NOW() - INTERVAL '24 hours'`);

  res.json(
    GetAnalysisStatsResponse.parse({
      totalAnalyses: Number(stats?.totalAnalyses ?? 0),
      avgVibeScore: parseFloat(String(stats?.avgVibeScore ?? 0)),
      avgBrandFitScore: parseFloat(String(stats?.avgBrandFitScore ?? 0)),
      topCategory: topRow?.category ?? "Music",
      recentCount: Number(recentRow?.cnt ?? 0),
    })
  );
});

export default router;
