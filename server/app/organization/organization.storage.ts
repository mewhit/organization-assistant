import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { Effect, Option } from "effect";

import { db } from "db/client";
import { organizationsTable, type OrganizationRecord, type NewOrganizationRecord } from "../../db/schemas/organizations.schema";

export class DbError {
  readonly _tag = "DbError";
  constructor(readonly cause: unknown) {}
}

export class OrganizationStorage {
  static insert(payload: NewOrganizationRecord): Effect.Effect<Option.Option<OrganizationRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const id = payload.id ?? randomUUID();
        await db.insert(organizationsTable).values({ ...payload, id });
        const rows = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);
        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static del(id: string): Effect.Effect<Option.Option<OrganizationRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);
        await db.delete(organizationsTable).where(eq(organizationsTable.id, id));

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static update(id: string, payload: Partial<NewOrganizationRecord>): Effect.Effect<Option.Option<OrganizationRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        await db.update(organizationsTable).set(payload).where(eq(organizationsTable.id, id));
        const rows = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static findOne(id: string): Effect.Effect<Option.Option<OrganizationRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }
}
