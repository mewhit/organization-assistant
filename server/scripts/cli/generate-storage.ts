import fs from "fs/promises";
import path from "path";
import { pluralize, toCamelCase } from "./name-case";

async function registerSchemaTable(tableName: string, tableVariableName: string) {
  const schemaRegistryPath = path.join("src", "db", "schema.ts");
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

  const schemaObjectStartIndex = schemaLines.findIndex((line) => line.match(/export\s+const\s+schemas?\s*=\s*\{/));

  const hasTableProperty = schemaLines.some((line) => line.trim() === `${tableVariableName},`);

  if (schemaObjectStartIndex !== -1 && !hasTableProperty) {
    const schemaObjectEndIndex = schemaLines.findIndex((line, index) => index > schemaObjectStartIndex && line.trim() === "};");

    if (schemaObjectEndIndex !== -1) {
      schemaLines.splice(schemaObjectEndIndex, 0, tablePropertyLine);
    }
  }

  await fs.writeFile(schemaRegistryPath, schemaLines.join("\n"));
}

export async function generateStorage(name: string) {
  const modulePath = path.join("src", name);
  const storageFilePath = path.join(modulePath, `${name}.storage.ts`);
  const camelCaseName = toCamelCase(name);
  const tableName = pluralize(name);
  const tableVariableName = `${toCamelCase(tableName)}Table`;
  const dbSchemaPath = path.join("src", "db", "schemas", `${tableName}.schema.ts`);

  await fs.mkdir(modulePath, { recursive: true });
  await fs.mkdir(path.dirname(dbSchemaPath), { recursive: true });

  const storageTemplate = `
export const ${camelCaseName}Storage = {};
`.trim();

  const dbSchemaTemplate = `
import { pgTable, serial,  timestamp } from "drizzle-orm/pg-core";

export const ${tableVariableName} = pgTable("${tableName}", {
  id: serial("id").primaryKey(),
  updatedAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
`.trim();

  await fs.writeFile(storageFilePath, storageTemplate);
  await fs.writeFile(dbSchemaPath, dbSchemaTemplate);
  await registerSchemaTable(tableName, tableVariableName);

  console.log(`✅ Created storage: ${name}`);
  console.log(`✅ Created db schema: db/schemas/${tableName}/schema.ts`);
  console.log("✅ Registered schema in src/db/schema.ts");
}
