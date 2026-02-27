import { sql } from "drizzle-orm";
import { mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

import { usersTable } from "./users.schema";

export const organizationContextsTable = mysqlTable("organization_contexts", {
  id: varchar("id", { length: 36 })
    .default(sql`(uuid())`)
    .primaryKey(),
  context: text("context").notNull(),
  organizationId: varchar("organization_id", { length: 36 }).notNull(),
  updatedBy: varchar("updated_by", { length: 36 }).references(() => usersTable.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrganizationContextRecord = typeof organizationContextsTable.$inferSelect;

export type NewOrganizationContextRecord = typeof organizationContextsTable.$inferInsert;
