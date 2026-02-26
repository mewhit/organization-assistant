import fs from "fs/promises";
import path from "path";
import { generateRoute } from "./generate-route";
import { generateStorage } from "./generate-storage";
import { toCamelCase } from "./name-case";

function toPascalCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join("");
}

function buildServiceTemplate(name: string, serviceName: string, storageName: string) {
  return `
import { ${storageName} } from "./${name}.storage";

export class ${serviceName} {
  static create(payload: Record<string, unknown>) {
    return ${storageName}.insert(payload);
  }

  static findOne(id: number) {
    return ${storageName}.findOne(id);
  }

  static find(id: number) {
    return ${serviceName}.findOne(id);
  }

  static update(id: number, payload: Record<string, unknown>) {
    return ${storageName}.update(id, payload);
  }

  static remove(id: number) {
    return ${storageName}.del(id);
  }
}
`.trim();
}

function buildDtoSchemaTemplate(className: string) {
  return `
import { Schema } from "effect";

export const Create${className}DtoSchema = Schema.Struct({});

export type Create${className}Dto = Schema.Schema.Type<typeof Create${className}DtoSchema>;
`.trim();
}

export async function generateCrud(name: string) {
  await generateRoute(name, ["get|/:id", "post|/", "patch|/:id", "put|/:id", "delete|/:id"]);
  await generateStorage(name, ["all"]);

  const className = toPascalCase(name);
  const camelCaseName = toCamelCase(name);
  const serviceName = `${camelCaseName}Service`;
  const storageName = `${camelCaseName}Storage`;
  const modulePath = path.join("src", name);
  const serviceFilePath = path.join(modulePath, `${name}.service.ts`);
  const dtoSchemaFilePath = path.join(modulePath, `${name}.dto.schema.ts`);

  const serviceTemplate = buildServiceTemplate(name, serviceName, storageName);
  const dtoSchemaTemplate = buildDtoSchemaTemplate(className);

  await fs.writeFile(serviceFilePath, serviceTemplate);
  await fs.writeFile(dtoSchemaFilePath, dtoSchemaTemplate);

  console.log(`✅ Created CRUD module: ${name}`);
  console.log(`✅ Generated ${name}.routes.ts, ${name}.service.ts, ${name}.dto.schema.ts, and ${name}.storage.ts`);
}
