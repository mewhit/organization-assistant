import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { Option, type Effect } from "effect";

import { db } from "db/client";
import { dbHandler, type DbError } from "@libs/dbHandler";
import {
  organizationsTable,
  type OrganizationRecord,
  type NewOrganizationRecord,
} from "@db/schemas/organizations.schema";

export class OrganizationStorage {
  static insert(payload: NewOrganizationRecord): Effect.Effect<Option.Option<OrganizationRecord>, DbError> {
    return dbHandler(async () => {
      const id = payload.id ?? randomUUID();
      await db.insert(organizationsTable).values({ ...payload, id });
      const rows = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);
      return Option.fromNullable(rows.at(0));
    });
  }

  static del(id: string): Effect.Effect<Option.Option<OrganizationRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);
      await db.delete(organizationsTable).where(eq(organizationsTable.id, id));

      return Option.fromNullable(rows.at(0));
    });
  }

  static update(
    id: string,
    payload: Partial<NewOrganizationRecord>,
  ): Effect.Effect<Option.Option<OrganizationRecord>, DbError> {
    return dbHandler(async () => {
      await db.update(organizationsTable).set(payload).where(eq(organizationsTable.id, id));
      const rows = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static findOne(id: string): Effect.Effect<Option.Option<OrganizationRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }
}
