import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { Effect, Option } from "effect";

import { db } from "db/client";
import {
  organizationUsersTable,
  type OrganizationUserRecord,
  type NewOrganizationUserRecord,
} from "../../db/schemas/organization-users.schema";

export class DbError {
  readonly _tag = "DbError";
  constructor(readonly cause: unknown) {}
}

export class OrganizationUserStorage {
  static insert(payload: NewOrganizationUserRecord): Effect.Effect<Option.Option<OrganizationUserRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const id = payload.id ?? randomUUID();
        await db.insert(organizationUsersTable).values({ ...payload, id });
        const rows = await db.select().from(organizationUsersTable).where(eq(organizationUsersTable.id, id)).limit(1);
        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static del(id: string): Effect.Effect<Option.Option<OrganizationUserRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.select().from(organizationUsersTable).where(eq(organizationUsersTable.id, id)).limit(1);
        await db.delete(organizationUsersTable).where(eq(organizationUsersTable.id, id));

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static update(id: string, payload: Partial<NewOrganizationUserRecord>): Effect.Effect<Option.Option<OrganizationUserRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        await db.update(organizationUsersTable).set(payload).where(eq(organizationUsersTable.id, id));
        const rows = await db.select().from(organizationUsersTable).where(eq(organizationUsersTable.id, id)).limit(1);

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }

  static findOne(id: string): Effect.Effect<Option.Option<OrganizationUserRecord>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.select().from(organizationUsersTable).where(eq(organizationUsersTable.id, id)).limit(1);

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }
}
