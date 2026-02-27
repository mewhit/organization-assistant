import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

import { organizationsTable } from "./organizations.schema";
import { usersTable } from "./users.schema";

export const organizationUsersTable = mysqlTable(
  "organization_users",
  {
    id: varchar("id", { length: 36 })
      .default(sql`(uuid())`)
      .primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: varchar("organization_id", { length: 36 })
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("organization_users_user_org_unique").on(table.userId, table.organizationId)],
);

export const organizationUsersRelations = relations(organizationUsersTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [organizationUsersTable.userId],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [organizationUsersTable.organizationId],
    references: [organizationsTable.id],
  }),
}));

export type OrganizationUserRecord = typeof organizationUsersTable.$inferSelect;

export type NewOrganizationUserRecord = typeof organizationUsersTable.$inferInsert;
