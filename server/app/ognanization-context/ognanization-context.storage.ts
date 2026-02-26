import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { Option, type Effect } from "effect";

import { db } from "db/client";
import { dbHandler, type DbError } from "@libs/dbHandler";
import {
  ognanizationContextsTable,
  type OgnanizationContextRecord,
  type NewOgnanizationContextRecord,
} from "@db/schemas/ognanization-contexts.schema";

export class OgnanizationContextStorage {
  static insert(
    payload: NewOgnanizationContextRecord,
  ): Effect.Effect<Option.Option<OgnanizationContextRecord>, DbError> {
    return dbHandler(async () => {
      const id = payload.id ?? randomUUID();
      await db.insert(ognanizationContextsTable).values({ ...payload, id });
      const rows = await db
        .select()
        .from(ognanizationContextsTable)
        .where(eq(ognanizationContextsTable.id, id))
        .limit(1);
      return Option.fromNullable(rows.at(0));
    });
  }

  static del(id: string): Effect.Effect<Option.Option<OgnanizationContextRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db
        .select()
        .from(ognanizationContextsTable)
        .where(eq(ognanizationContextsTable.id, id))
        .limit(1);
      await db.delete(ognanizationContextsTable).where(eq(ognanizationContextsTable.id, id));

      return Option.fromNullable(rows.at(0));
    });
  }

  static update(
    id: string,
    payload: Partial<NewOgnanizationContextRecord>,
  ): Effect.Effect<Option.Option<OgnanizationContextRecord>, DbError> {
    return dbHandler(async () => {
      await db.update(ognanizationContextsTable).set(payload).where(eq(ognanizationContextsTable.id, id));
      const rows = await db
        .select()
        .from(ognanizationContextsTable)
        .where(eq(ognanizationContextsTable.id, id))
        .limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static findOne(id: string): Effect.Effect<Option.Option<OgnanizationContextRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db
        .select()
        .from(ognanizationContextsTable)
        .where(eq(ognanizationContextsTable.id, id))
        .limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }
}
