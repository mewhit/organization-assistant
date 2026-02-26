import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { boolean, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

import { organizationUsersTable } from "./organization-users.schema";

export const usersTable = mysqlTable("users", {
  id: varchar("id", { length: 36 })
    .default(sql`(uuid())`)
    .primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  displayName: varchar("display_name", { length: 150 }),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  organizationUsers: many(organizationUsersTable),
}));

export type UserRecord = typeof usersTable.$inferSelect;

export type NewUserRecord = typeof usersTable.$inferInsert;
