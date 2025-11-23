import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
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

// Review schema for marketplace reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketplace: text("marketplace").notNull(), // Amazon, eBay, Shopify, PayPal, Alibaba, Website
  title: text("title").notNull(),
  content: text("content").notNull(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating"),
  sentiment: text("sentiment").notNull(), // positive, neutral, negative
  category: text("category").notNull(), // shipping, defect, service, etc.
  severity: text("severity").notNull(), // low, medium, high, critical
  status: text("status").notNull().default("open"), // open, in_progress, resolved
  aiSuggestedReply: text("ai_suggested_reply"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
