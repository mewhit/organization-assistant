import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { Option, type Effect } from "effect";

import { db } from "db/client";
import { dbHandler, type DbError } from "@libs/dbHandler";
import {
  organizationUsersTable,
  type OrganizationUserRecord,
  type NewOrganizationUserRecord,
} from "@db/schemas/organization-users.schema";

export class OrganizationUserStorage {
  static insert(payload: NewOrganizationUserRecord): Effect.Effect<Option.Option<OrganizationUserRecord>, DbError> {
    return dbHandler(async () => {
      const id = payload.id ?? randomUUID();
      await db.insert(organizationUsersTable).values({ ...payload, id });
      const rows = await db.select().from(organizationUsersTable).where(eq(organizationUsersTable.id, id)).limit(1);
      return Option.fromNullable(rows.at(0));
    });
  }

  static del(id: string): Effect.Effect<Option.Option<OrganizationUserRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(organizationUsersTable).where(eq(organizationUsersTable.id, id)).limit(1);
      await db.delete(organizationUsersTable).where(eq(organizationUsersTable.id, id));

      return Option.fromNullable(rows.at(0));
    });
  }

  static update(
    id: string,
    payload: Partial<NewOrganizationUserRecord>,
  ): Effect.Effect<Option.Option<OrganizationUserRecord>, DbError> {
    return dbHandler(async () => {
      await db.update(organizationUsersTable).set(payload).where(eq(organizationUsersTable.id, id));
      const rows = await db.select().from(organizationUsersTable).where(eq(organizationUsersTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static findOne(id: string): Effect.Effect<Option.Option<OrganizationUserRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(organizationUsersTable).where(eq(organizationUsersTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }
}
