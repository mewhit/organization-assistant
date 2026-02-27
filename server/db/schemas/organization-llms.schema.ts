import { sql } from "drizzle-orm";
import { mysqlTable, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

import { organizationsTable } from "./organizations.schema";

export const organizationLlmsTable = mysqlTable("organization_llms", {
  id: varchar("id", { length: 36 })
    .default(sql`(uuid())`)
    .primaryKey(),
  organizationId: varchar("organization_id", { length: 36 })
    .references(() => organizationsTable.id, { onDelete: "cascade" })
    .notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  apiKey: varchar("api_key", { length: 1024 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrganizationLlmRecord = typeof organizationLlmsTable.$inferSelect;

export type NewOrganizationLlmRecord = typeof organizationLlmsTable.$inferInsert;
