import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { Option, type Effect } from "effect";

import { db } from "db/client";
import { dbHandler, type DbError } from "@libs/dbHandler";
import {
  organizationMcpPluginsTable,
  type OrganizationMcpPluginRecord,
  type NewOrganizationMcpPluginRecord,
} from "@db/schemas/organization-mcp-plugins.schema";

export class OrganizationMcpPluginStorage {
  static insert(payload: NewOrganizationMcpPluginRecord): Effect.Effect<Option.Option<OrganizationMcpPluginRecord>, DbError> {
    return dbHandler(async () => {
      const id = payload.id ?? randomUUID();
      await db.insert(organizationMcpPluginsTable).values({ ...payload, id });
      const rows = await db.select().from(organizationMcpPluginsTable).where(eq(organizationMcpPluginsTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static del(id: string): Effect.Effect<Option.Option<OrganizationMcpPluginRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(organizationMcpPluginsTable).where(eq(organizationMcpPluginsTable.id, id)).limit(1);
      await db.delete(organizationMcpPluginsTable).where(eq(organizationMcpPluginsTable.id, id));

      return Option.fromNullable(rows.at(0));
    });
  }

  static update(
    id: string,
    payload: Partial<NewOrganizationMcpPluginRecord>,
  ): Effect.Effect<Option.Option<OrganizationMcpPluginRecord>, DbError> {
    return dbHandler(async () => {
      await db.update(organizationMcpPluginsTable).set(payload).where(eq(organizationMcpPluginsTable.id, id));
      const rows = await db.select().from(organizationMcpPluginsTable).where(eq(organizationMcpPluginsTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static findOne(id: string): Effect.Effect<Option.Option<OrganizationMcpPluginRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(organizationMcpPluginsTable).where(eq(organizationMcpPluginsTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static findActiveByOrganizationId(organizationId: string): Effect.Effect<Option.Option<OrganizationMcpPluginRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db
        .select()
        .from(organizationMcpPluginsTable)
        .where(and(eq(organizationMcpPluginsTable.organizationId, organizationId), eq(organizationMcpPluginsTable.isActive, true)))
        .limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }
}
