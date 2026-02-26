import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { boolean, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

import { organizationUsersTable } from "./organization-users.schema";

export const organizationsTable = mysqlTable("organizations", {
  id: varchar("id", { length: 36 })
    .default(sql`(uuid())`)
    .primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationsRelations = relations(organizationsTable, ({ many }) => ({
  organizationUsers: many(organizationUsersTable),
}));

export type OrganizationRecord = typeof organizationsTable.$inferSelect;

export type NewOrganizationRecord = typeof organizationsTable.$inferInsert;
