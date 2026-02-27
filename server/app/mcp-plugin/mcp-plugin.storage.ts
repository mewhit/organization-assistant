import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { Option, type Effect } from "effect";

import { db } from "db/client";
import { dbHandler, type DbError } from "@libs/dbHandler";
import { mcpPluginsTable, type McpPluginRecord, type NewMcpPluginRecord } from "@db/schemas/mcp-plugins.schema";

export class McpPluginStorage {
  static insert(payload: NewMcpPluginRecord): Effect.Effect<Option.Option<McpPluginRecord>, DbError> {
    return dbHandler(async () => {
      const id = payload.id ?? randomUUID();
      await db.insert(mcpPluginsTable).values({ ...payload, id });
      const rows = await db.select().from(mcpPluginsTable).where(eq(mcpPluginsTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static del(id: string): Effect.Effect<Option.Option<McpPluginRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(mcpPluginsTable).where(eq(mcpPluginsTable.id, id)).limit(1);
      await db.delete(mcpPluginsTable).where(eq(mcpPluginsTable.id, id));

      return Option.fromNullable(rows.at(0));
    });
  }

  static update(id: string, payload: Partial<NewMcpPluginRecord>): Effect.Effect<Option.Option<McpPluginRecord>, DbError> {
    return dbHandler(async () => {
      await db.update(mcpPluginsTable).set(payload).where(eq(mcpPluginsTable.id, id));
      const rows = await db.select().from(mcpPluginsTable).where(eq(mcpPluginsTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static findOne(id: string): Effect.Effect<Option.Option<McpPluginRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(mcpPluginsTable).where(eq(mcpPluginsTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }
}