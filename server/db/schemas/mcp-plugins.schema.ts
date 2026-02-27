import { sql } from "drizzle-orm";
import { mysqlTable, timestamp, varchar, json } from "drizzle-orm/mysql-core";

export const mcpPluginsTable = mysqlTable("mcp_plugins", {
  id: varchar("id", { length: 36 })
    .default(sql`(uuid())`)
    .primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1024 }),
  configNeeded: json("config_needed").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type McpPluginRecord = typeof mcpPluginsTable.$inferSelect;

export type NewMcpPluginRecord = typeof mcpPluginsTable.$inferInsert;
