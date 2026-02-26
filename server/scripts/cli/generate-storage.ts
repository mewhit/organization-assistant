import fs from "fs/promises";
import path from "path";
import { pluralize, toCamelCase, toPascalCase } from "./name-case";

const STORAGE_ACTIONS = ["insert", "del", "update", "findOne", "all"] as const;
type StorageAction = (typeof STORAGE_ACTIONS)[number];

function isStorageAction(value: string): value is StorageAction {
  return (STORAGE_ACTIONS as readonly string[]).includes(value);
}

function parseStorageActions(actions: string[]) {
  const normalizedActions = actions.map((action) => action.trim().toLowerCase()).filter(Boolean);

  if (normalizedActions.length === 0) {
    return [] as Exclude<StorageAction, "all">[];
  }

  const uniqueActions = [...new Set(normalizedActions)] as string[];

  for (const action of uniqueActions) {
    if (!isStorageAction(action)) {
      throw new Error(`Invalid storage action: "${action}". Supported actions: ${STORAGE_ACTIONS.join(", ")}.`);
    }
  }

  if (uniqueActions.includes("all")) {
    return ["insert", "del", "update", "findOne"] as Exclude<StorageAction, "all">[];
  }

  return uniqueActions as Exclude<StorageAction, "all">[];
}

function buildStorageTemplate(
  pascalCaseName: string,
  tableVariableName: string,
  tableName: string,
  actions: Exclude<StorageAction, "all">[],
) {
  const needsEq = actions.includes("del") || actions.includes("update") || actions.includes("findOne");
  const methodBlocks: string[] = [];
  const selectTypeName = `${pascalCaseName}Record`;
  const insertTypeName = `New${pascalCaseName}Record`;

  if (actions.includes("insert")) {
    methodBlocks.push(`  static insert(payload: ${insertTypeName}): Effect.Effect<Option.Option<${selectTypeName}>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.insert(${tableVariableName}).values(payload).returning();
        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }`);
  }

  if (actions.includes("del")) {
    methodBlocks.push(`  static del(id: string): Effect.Effect<Option.Option<${selectTypeName}>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.delete(${tableVariableName}).where(eq(${tableVariableName}.id, id)).returning();

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }`);
  }

  if (actions.includes("update")) {
    methodBlocks.push(`  static update(id: string, payload: Partial<${insertTypeName}>): Effect.Effect<Option.Option<${selectTypeName}>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.update(${tableVariableName}).set(payload).where(eq(${tableVariableName}.id, id)).returning();

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }`);
  }

  if (actions.includes("findOne")) {
    methodBlocks.push(`  static findOne(id: string): Effect.Effect<Option.Option<${selectTypeName}>, DbError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await db.select().from(${tableVariableName}).where(eq(${tableVariableName}.id, id)).limit(1);

        return Option.fromNullable(rows.at(0));
      },
      catch: (error) => new DbError(error),
    });
  }`);
  }

  const lines: string[] = [];

  if (needsEq) {
    lines.push('import { eq } from "drizzle-orm";', "");
  }

  if (actions.length > 0) {
    lines.push(
      'import { Effect, Option } from "effect";',
      "",
      'import { db } from "db/client";',
      `import { ${tableVariableName}, type ${selectTypeName}, type ${insertTypeName} } from "../../db/schemas/${tableName}.schema";`,
      "",
      "export class DbError {",
      '  readonly _tag = "DbError";',
      "  constructor(readonly cause: unknown) {}",
      "}",
      "",
    );
  }

  if (methodBlocks.length === 0) {
    lines.push(`export class ${pascalCaseName}Storage {}`);
  } else {
    lines.push(`export class ${pascalCaseName}Storage {`, `${methodBlocks.join("\n\n")}`, `}`);
  }

  return lines.join("\n");
}

async function registerSchemaTable(tableName: string, tableVariableName: string) {
  const schemaRegistryPath = path.join("db", "schema.ts");
  const schemaRegistryContent = await fs.readFile(schemaRegistryPath, "utf-8");
  const importLine = `import { ${tableVariableName} } from "./schemas/${tableName}.schema";`;
  const tablePropertyLine = `  ${tableVariableName},`;

  const schemaLines = schemaRegistryContent.split("\n");

  const sameSymbolImportIndex = schemaLines.findIndex((line) => {
    const escapedVariableName = tableVariableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matcher = new RegExp(`^import\\s+\\{\\s*${escapedVariableName}\\s*\\}\\s+from\\s+[\"'][^\"']+[\"'];?$`);

    return matcher.test(line.trim());
  });

  if (sameSymbolImportIndex !== -1) {
    schemaLines[sameSymbolImportIndex] = importLine;
  } else if (!schemaRegistryContent.includes(importLine)) {
    const lastImportIndex = [...schemaLines]
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.trim().startsWith("import "))
      .at(-1)?.index;

    if (lastImportIndex === undefined) {
      schemaLines.unshift(importLine);
    } else {
      schemaLines.splice(lastImportIndex + 1, 0, importLine);
    }
  }

  let updatedSchemaContent = schemaLines.join("\n");
  const schemaObjectMatcher = /(export\s+const\s+schemas?\s*=\s*\{)([\s\S]*?)(\};?)/;
  const escapedVariableName = tableVariableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tablePropertyMatcher = new RegExp(`(^|\\n)\\s*${escapedVariableName}\\s*,?\\s*(?=\\n|$)`);

  updatedSchemaContent = updatedSchemaContent.replace(schemaObjectMatcher, (fullMatch, prefix: string, body: string, suffix: string) => {
    if (tablePropertyMatcher.test(body)) {
      return fullMatch;
    }

    const normalizedBody = body.trim().length === 0 ? "\n" : `${body.trimEnd()}\n`;
    return `${prefix}${normalizedBody}${tablePropertyLine}\n${suffix}`;
  });

  await fs.writeFile(schemaRegistryPath, updatedSchemaContent);
}

export async function generateStorage(name: string, actionOptions: string[] = []) {
  const modulePath = path.join("app", name);
  const storageFilePath = path.join(modulePath, `${name}.storage.ts`);
  const pascalCaseName = toPascalCase(name);
  const tableName = pluralize(name);
  const tableVariableName = `${toCamelCase(tableName)}Table`;
  const dbSchemaPath = path.join("db", "schemas", `${tableName}.schema.ts`);
  const selectedActions = parseStorageActions(actionOptions);

  await fs.mkdir(modulePath, { recursive: true });
  await fs.mkdir(path.dirname(dbSchemaPath), { recursive: true });

  const storageTemplate = buildStorageTemplate(pascalCaseName, tableVariableName, tableName, selectedActions).trim();

  const dbSchemaTemplate = `
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const ${tableVariableName} = pgTable("${tableName}", {
  id: uuid("id").defaultRandom().primaryKey(),
  updatedAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ${pascalCaseName}Record = typeof ${tableVariableName}.$inferSelect;

export type New${pascalCaseName}Record = typeof ${tableVariableName}.$inferInsert;
`.trim();

  await fs.writeFile(storageFilePath, storageTemplate);
  await fs.writeFile(dbSchemaPath, dbSchemaTemplate);
  await registerSchemaTable(tableName, tableVariableName);

  console.log(`✅ Created storage: ${name}`);
  if (selectedActions.length === 0) {
    console.log("✅ Generated empty storage object (no actions selected)");
  } else {
    console.log(`✅ Generated storage actions: ${selectedActions.join(", ")}`);
  }
  console.log(`✅ Created db schema: db/schemas/${tableName}/schema.ts`);
  console.log("✅ Registered schema in db/schema.ts");
}
