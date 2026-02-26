import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { Option, type Effect } from "effect";

import { db } from "db/client";
import { dbHandler, type DbError } from "@libs/dbHandler";
import { usersTable, type UserRecord, type NewUserRecord } from "@db/schemas/users.schema";

export class UserStorage {
  static insert(payload: NewUserRecord): Effect.Effect<Option.Option<UserRecord>, DbError> {
    return dbHandler(async () => {
      const id = payload.id ?? randomUUID();
      await db.insert(usersTable).values({ ...payload, id });
      const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      return Option.fromNullable(rows.at(0));
    });
  }

  static del(id: string): Effect.Effect<Option.Option<UserRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      await db.delete(usersTable).where(eq(usersTable.id, id));
      return Option.fromNullable(rows.at(0));
    });
  }

  static update(id: string, payload: Partial<NewUserRecord>): Effect.Effect<Option.Option<UserRecord>, DbError> {
    return dbHandler(async () => {
      await db.update(usersTable).set(payload).where(eq(usersTable.id, id));
      const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static findOne(id: string): Effect.Effect<Option.Option<UserRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }
}
