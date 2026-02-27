import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { Option, type Effect } from "effect";

import { db } from "db/client";
import { dbHandler, type DbError } from "@libs/dbHandler";
import {
  organizationLlmsTable,
  type OrganizationLlmRecord,
  type NewOrganizationLlmRecord,
} from "@db/schemas/organization-llms.schema";

export class OrganizationLlmStorage {
  static insert(payload: NewOrganizationLlmRecord): Effect.Effect<Option.Option<OrganizationLlmRecord>, DbError> {
    return dbHandler(async () => {
      const id = payload.id ?? randomUUID();
      await db.insert(organizationLlmsTable).values({ ...payload, id });
      const rows = await db.select().from(organizationLlmsTable).where(eq(organizationLlmsTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static del(id: string): Effect.Effect<Option.Option<OrganizationLlmRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(organizationLlmsTable).where(eq(organizationLlmsTable.id, id)).limit(1);
      await db.delete(organizationLlmsTable).where(eq(organizationLlmsTable.id, id));

      return Option.fromNullable(rows.at(0));
    });
  }

  static update(
    id: string,
    payload: Partial<NewOrganizationLlmRecord>,
  ): Effect.Effect<Option.Option<OrganizationLlmRecord>, DbError> {
    return dbHandler(async () => {
      await db.update(organizationLlmsTable).set(payload).where(eq(organizationLlmsTable.id, id));
      const rows = await db.select().from(organizationLlmsTable).where(eq(organizationLlmsTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static findOne(id: string): Effect.Effect<Option.Option<OrganizationLlmRecord>, DbError> {
    return dbHandler(async () => {
      const rows = await db.select().from(organizationLlmsTable).where(eq(organizationLlmsTable.id, id)).limit(1);

      return Option.fromNullable(rows.at(0));
    });
  }

  static findMany(): Effect.Effect<OrganizationLlmRecord[], DbError> {
    return dbHandler(async () => {
      return db.select().from(organizationLlmsTable);
    });
  }
}
