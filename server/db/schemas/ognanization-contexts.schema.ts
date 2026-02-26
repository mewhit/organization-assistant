import { sql } from "drizzle-orm";
import { mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const ognanizationContextsTable = mysqlTable("ognanization-contexts", {
  id: varchar("id", { length: 36 })
    .default(sql`(uuid())`)
    .primaryKey(),
  context: text("context").notNull(),
  updatedBy: varchar("updated_by", { length: 150 }),
  createdBy: varchar("created_by", { length: 150 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OgnanizationContextRecord = typeof ognanizationContextsTable.$inferSelect;

export type NewOgnanizationContextRecord = typeof ognanizationContextsTable.$inferInsert;
