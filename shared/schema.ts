import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Pregnancy logs table for daily check-ins
export const pregnancyLogs = pgTable("pregnancy_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // ISO date string (YYYY-MM-DD)
  week: integer("week").notNull(),
  mood: text("mood").notNull(), // "happy" | "neutral" | "sad"
  symptoms: text("symptoms"), // JSON string array or comma-separated
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schema for inserting pregnancy logs
export const insertPregnancyLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  week: z.number().int().min(1).max(42),
  mood: z.enum(["happy", "neutral", "sad"]),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertPregnancyLog = z.infer<typeof insertPregnancyLogSchema>;
export type PregnancyLog = typeof pregnancyLogs.$inferSelect;
