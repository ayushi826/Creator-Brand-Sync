import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const badgeSchema = z.object({
  id: z.string(),
  label: z.string(),
  tier: z.enum(["bronze", "silver", "gold", "platinum"]),
  description: z.string().optional(),
});

export type Badge = z.infer<typeof badgeSchema>;

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  handle: text("handle").notNull(),
  vibeScore: integer("vibe_score").notNull(),
  brandFitScore: integer("brand_fit_score").notNull(),
  category: text("category").notNull(),
  audienceSize: text("audience_size"),
  engagementRate: real("engagement_rate"),
  badges: jsonb("badges").notNull().$type<Badge[]>(),
  locale: text("locale").notNull().default("global"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, createdAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
