import { randomUUID } from "node:crypto";

import { eq, and, sql } from "drizzle-orm";

import { Option, type Effect } from "effect";

import { db } from "db/client";
import { dbHandler, type DbError } from "@libs/dbHandler";
import { buildDateConditions, buildStringConditions, type DateFilter, type StringFilter } from "@libs/filterBuilder";
import {
  organizationsTable,
  type OrganizationRecord,
  type NewOrganizationRecord,
} from "@db/schemas/organizations.schema";

type OrganizationFilter = {
  id?: string;
  name?: string | StringFilter;
  slug?: string | StringFilter;
  isActive?: boolean;
  deletedAt?: Date | DateFilter;
  updatedAt?: Date | DateFilter;
  createdAt?: Date | DateFilter;
};

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

  static find(filter: OrganizationFilter): Effect.Effect<OrganizationRecord[], DbError> {
    return dbHandler(async () => {
      const conditions = [];
      if (filter.id !== undefined) conditions.push(sql`${organizationsTable.id} = ${filter.id}`);
      if (filter.name !== undefined) conditions.push(buildStringConditions(organizationsTable.name, filter.name));
      if (filter.slug !== undefined) conditions.push(buildStringConditions(organizationsTable.slug, filter.slug));
      if (filter.isActive !== undefined) conditions.push(sql`${organizationsTable.isActive} = ${filter.isActive}`);
      if (filter.deletedAt !== undefined) {
        const cond = buildDateConditions(organizationsTable.deletedAt, filter.deletedAt);
        if (cond) conditions.push(cond);
      }
      if (filter.updatedAt !== undefined) {
        const cond = buildDateConditions(organizationsTable.updatedAt, filter.updatedAt);
        if (cond) conditions.push(cond);
      }
      if (filter.createdAt !== undefined) {
        const cond = buildDateConditions(organizationsTable.createdAt, filter.createdAt);
        if (cond) conditions.push(cond);
      }
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      const rows = await db.select().from(organizationsTable).where(whereClause);
      return rows;
    });
  }
}
