import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { Option, type Effect } from "effect";

import { db } from "db/client";
import { dbHandler, type DbError } from "@libs/dbHandler";
import {
  organizationContextsTable,
  type OrganizationContextRecord,
  type NewOrganizationContextRecord,
} from "@db/schemas/organization-contexts.schema";

export class OrganizationContextStorage {
  static insert(
    payload: NewOrganizationContextRecord,
  ): Effect.Effect<Option.Option<OrganizationContextRecord>, DbError> {
    return dbHandler(async () => {
      const id = payload.id ?? randomUUID();
      await db.insert(organizationContextsTable).values({ ...payload, id });
      const rows = await db
        .select()
        .from(organizationContextsTable)
        .where(eq(organizationContextsTable.id, id))
        .limit(1);
      return Option.fromNullable(rows.at(0));
    });
  }

  static del(id: string): Effect.Effect<Option.Option<OrganizationContextRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db
        .select()
        .from(organizationContextsTable)
        .where(eq(organizationContextsTable.id, id))
        .limit(1);
      await db.delete(organizationContextsTable).where(eq(organizationContextsTable.id, id));

      return Option.fromNullable(rows.at(0));
    });
  }

  static update(
    id: string,
    payload: Partial<NewOrganizationContextRecord>,
  ): Effect.Effect<Option.Option<OrganizationContextRecord>, DbError> {
    return dbHandler(async () => {
      await db.update(organizationContextsTable).set(payload).where(eq(organizationContextsTable.id, id));
      const rows = await db
        .select()
        .from(organizationContextsTable)
        .where(eq(organizationContextsTable.id, id))
        .limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static findOne(id: string): Effect.Effect<Option.Option<OrganizationContextRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db
        .select()
        .from(organizationContextsTable)
        .where(eq(organizationContextsTable.id, id))
        .limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }
}
