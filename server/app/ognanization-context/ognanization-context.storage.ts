import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { Effect, Option } from "effect";

import { db } from "db/client";
import {
  ognanizationContextsTable,
  type OgnanizationContextRecord,
  type NewOgnanizationContextRecord,
} from "../../db/schemas/ognanization-contexts.schema";

export class DbError {
  readonly _tag = "DbError";
  constructor(readonly cause: unknown) {}
}

export class OgnanizationContextStorage {
  static insert(payload: NewOgnanizationContextRecord): Effect.Effect<Option.Option<OgnanizationContextRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const id = payload.id ?? randomUUID();
        await db.insert(ognanizationContextsTable).values({ ...payload, id });
        const rows = await db.select().from(ognanizationContextsTable).where(eq(ognanizationContextsTable.id, id)).limit(1);
        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static del(id: string): Effect.Effect<Option.Option<OgnanizationContextRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.select().from(ognanizationContextsTable).where(eq(ognanizationContextsTable.id, id)).limit(1);
        await db.delete(ognanizationContextsTable).where(eq(ognanizationContextsTable.id, id));

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static update(
    id: string,
    payload: Partial<NewOgnanizationContextRecord>,
  ): Effect.Effect<Option.Option<OgnanizationContextRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        await db.update(ognanizationContextsTable).set(payload).where(eq(ognanizationContextsTable.id, id));
        const rows = await db.select().from(ognanizationContextsTable).where(eq(ognanizationContextsTable.id, id)).limit(1);

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static findOne(id: string): Effect.Effect<Option.Option<OgnanizationContextRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.select().from(ognanizationContextsTable).where(eq(ognanizationContextsTable.id, id)).limit(1);

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }
}
