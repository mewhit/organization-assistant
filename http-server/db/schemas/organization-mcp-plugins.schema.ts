import { relations, sql } from "drizzle-orm";
import { boolean, json, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

import { mcpPluginsTable } from "./mcp-plugins.schema";
import { organizationsTable } from "./organizations.schema";

export const organizationMcpPluginsTable = mysqlTable(
  "organization_mcp_plugins",
  {
    id: varchar("id", { length: 36 })
      .default(sql`(uuid())`)
      .primaryKey(),
    mcpPluginId: varchar("mcp_plugin_id", { length: 36 })
      .references(() => mcpPluginsTable.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: varchar("organization_id", { length: 36 })
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    config: json("config").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("organization_mcp_plugins_org_plugin_unique").on(table.organizationId, table.mcpPluginId)],
);

export const organizationMcpPluginsRelations = relations(organizationMcpPluginsTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [organizationMcpPluginsTable.organizationId],
    references: [organizationsTable.id],
  }),
  mcpPlugin: one(mcpPluginsTable, {
    fields: [organizationMcpPluginsTable.mcpPluginId],
    references: [mcpPluginsTable.id],
  }),
}));

export type OrganizationMcpPluginRecord = typeof organizationMcpPluginsTable.$inferSelect;

export type NewOrganizationMcpPluginRecord = typeof organizationMcpPluginsTable.$inferInsert;
