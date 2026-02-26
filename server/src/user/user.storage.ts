import { eq } from "drizzle-orm";

import { Effect, Option } from "effect";

import { db } from "@db/client";
import { usersTable, type UserRecord, type NewUserRecord } from "../db/schemas/users.schema";

export class DbError {
  readonly _tag = "DbError";
  constructor(readonly cause: unknown) {}
}

export class UserStorage {
  static insert(payload: NewUserRecord): Effect.Effect<Option.Option<UserRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.insert(usersTable).values(payload).returning();
        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static del(id: number): Effect.Effect<Option.Option<UserRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static update(id: number, payload: Partial<NewUserRecord>): Effect.Effect<Option.Option<UserRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.update(usersTable).set(payload).where(eq(usersTable.id, id)).returning();

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static findOne(id: number): Effect.Effect<Option.Option<UserRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }
}