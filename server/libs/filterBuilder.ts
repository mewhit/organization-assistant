import { and, like, sql } from "drizzle-orm";

export type DateFilter = {
  on?: Date;
  before?: Date;
  after?: Date;
};

export type StringFilter = {
  value: string;
  mode?: "exact" | "partial";
};

export function buildDateConditions(column: any, dateFilter: Date | DateFilter) {
  if (dateFilter instanceof Date) {
    return sql`${column} = ${dateFilter}`;
  } else {
    const conditions = [];
    if (dateFilter.on !== undefined) conditions.push(sql`${column} = ${dateFilter.on}`);
    if (dateFilter.before !== undefined) conditions.push(sql`${column} < ${dateFilter.before}`);
    if (dateFilter.after !== undefined) conditions.push(sql`${column} > ${dateFilter.after}`);
    return conditions.length === 1 ? conditions[0] : conditions.length > 1 ? and(...conditions) : undefined;
  }
}

export function buildStringConditions(column: any, strFilter: string | StringFilter) {
  const value = typeof strFilter === "string" ? strFilter : strFilter.value;
  const mode = typeof strFilter === "string" ? "partial" : (strFilter.mode ?? "partial");
  if (mode === "exact") {
    return sql`${column} = ${value}`;
  } else {
    return like(column, `%${value}%`);
  }
}
