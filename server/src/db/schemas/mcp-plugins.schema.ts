import { pgTable, serial,  timestamp } from "drizzle-orm/pg-core";

export const mcpPluginsTable = pgTable("mcp-plugins", {
  id: serial("id").primaryKey(),
  updatedAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});